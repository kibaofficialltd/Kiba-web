package io.kibaofficial.core.http;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import org.bukkit.plugin.java.JavaPlugin;

/**
 * HMAC-signed HTTP client for the KIBAOFFICIAL website plugin bridge.
 *
 * Every request carries:
 *   x-kiba-timestamp : unix seconds (must be within the tolerance window)
 *   x-kiba-nonce     : unique per request, single use
 *   x-kiba-signature : hex HMAC-SHA256(secret, `${timestamp}.${nonce}.${rawBody}`)
 *
 * Timestamps are compared with the server clock (replay window + freshness) and
 * the nonce is recorded by the website so a captured request cannot be replayed.
 */
public final class HttpClientBridge {

  private static final String TIMESTAMP_HEADER = "x-kiba-timestamp";
  private static final String NONCE_HEADER = "x-kiba-nonce";
  private static final String SIGNATURE_HEADER = "x-kiba-signature";

  private final JavaPlugin plugin;
  private final HttpClient client;
  private final String baseUrl;
  private final String apiPath;
  private final String secret;
  private final long timestampToleranceSeconds;
  private final Executor executor = Executors.newSingleThreadExecutor(r -> {
    Thread thread = new Thread(r, "kiba-http-client");
    thread.setDaemon(true);
    return thread;
  });

  private final Gson gson = new Gson();

  public HttpClientBridge(JavaPlugin plugin, String baseUrl, String apiPath, String secret, long timestampToleranceSeconds) {
    this.plugin = plugin;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    this.apiPath = apiPath.startsWith("/") ? apiPath.substring(1) : apiPath;
    this.secret = secret;
    this.timestampToleranceSeconds = timestampToleranceSeconds;
    this.client = HttpClient.newBuilder().version(java.net.http.HttpClient.Version.HTTP_1_1).executor(this.executor).build();
  }

  public HttpClientBridge(JavaPlugin plugin) {
    this(
        plugin,
        plugin.getConfig().getString("website.base-url", "http://127.0.0.1:8080"),
        plugin.getConfig().getString("website.api-path", "/api/plugin"),
        plugin.getConfig().getString("plugin.shared-secret", ""),
        plugin.getConfig().getLong("plugin.timestamp-tolerance-seconds", 300));
  }

  /** Performs a signed POST and returns the parsed `data` object. */
  public JsonObject post(String path, String rawBody) throws Exception {
    long timestamp = Instant.now().getEpochSecond();
    String nonce = UUID.randomUUID().toString();
    String signature = hmacSha256Hex(secret, timestamp + "." + nonce + "." + rawBody);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(baseUrl + "/" + apiPath + "/" + path.stripLeading()))
        .timeout(java.time.Duration.ofSeconds(10))
        .header(TIMESTAMP_HEADER, Long.toString(timestamp))
        .header(NONCE_HEADER, nonce)
        .header(SIGNATURE_HEADER, signature)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(rawBody, java.nio.charset.StandardCharsets.UTF_8))
        .build();

    return send(request, path);
  }

  /** Performs a signed GET and returns the parsed `data` object. */
  public JsonObject get(String path) throws Exception {
    long timestamp = Instant.now().getEpochSecond();
    String nonce = UUID.randomUUID().toString();
    String signature = hmacSha256Hex(secret, timestamp + "." + nonce + "." + "");

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(baseUrl + "/" + apiPath + "/" + path.stripLeading()))
        .timeout(java.time.Duration.ofSeconds(10))
        .header(TIMESTAMP_HEADER, Long.toString(timestamp))
        .header(NONCE_HEADER, nonce)
        .header(SIGNATURE_HEADER, signature)
        .GET()
        .build();

    return send(request, path);
  }

  private JsonObject send(HttpRequest request, String path) throws Exception {
    HttpResponse<String> response = this.client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
    String body = response.body();
    JsonObject parsed = new Gson().fromJson(body, JsonObject.class);
    if (response.statusCode() >= 400 || parsed == null || !parsed.get("ok").getAsBoolean()) {
      throw new IllegalStateException(
          "KIBAOFFICIALCore bridge error on " + path + ": HTTP " + response.statusCode() + " " + body);
    }
    JsonObject data = parsed.has("data") && !parsed.get("data").isJsonNull()
        ? parsed.getAsJsonObject("data")
        : new JsonObject();
    return data;
  }

  private String hmacSha256Hex(String secret, String message) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = mac.doFinal(message.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest).toLowerCase();
    } catch (Exception e) {
      throw new IllegalStateException("HMAC-SHA256 unavailable", e);
    }
  }

  public HttpClient getClient() {
    return this.client;
  }

  public Executor executor() {
    return this.executor;
  }
}
