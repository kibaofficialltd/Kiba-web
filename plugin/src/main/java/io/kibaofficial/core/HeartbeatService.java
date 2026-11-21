package io.kibaofficial.core;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.bukkit.entity.Player;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import io.kibaofficial.core.http.HttpClientBridge;

/**
 * Pushes the live server snapshot to the portal every few seconds. The website
 * treats heartbeats older than the stale window as "offline", so this task must
 * keep running for as long as the server is up.
 */
public final class HeartbeatService {

  private static final String MOTD_PLACEHOLDER = "&bKIBA&7&8 » &f&lKIBAOFFICIAL&8&7&8 » &bPlay your adventure.";

  private final KIBAOfficialCore plugin;
  private final HttpClientBridge bridge;
  private final ScheduledExecutorService scheduler;
  private final String motd;
  private final String version;
  private final String host;
  private final int port;
  private final int bedrockPort;
  private final long serverStartedAtMs;

  public HeartbeatService(KIBAOfficialCore plugin) {
    this.plugin = plugin;
    this.bridge = plugin.getBridge();
    this.motd = plugin.getMotd();
    this.version = plugin.getVersion();
    this.host = plugin.getHost();
    this.port = plugin.getPort();
    this.bedrockPort = plugin.getBedrockPort();
    this.serverStartedAtMs = System.currentTimeMillis();
    this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
      Thread thread = new Thread(r, "kiba-heartbeat-worker");
      thread.setDaemon(true);
      return thread;
    });
  }

  public void start() {
    long intervalMillis = Math.max(5000L, this.plugin.getHeartbeatIntervalSeconds() * 1000L);
    this.scheduler.scheduleAtFixedRate(this::beat, intervalMillis, intervalMillis, TimeUnit.MILLISECONDS);
  }

  public void stop() {
    this.scheduler.shutdownNow();
  }

  private void beat() {
    try {
      List<JsonObject> players = new ArrayList<>();
      int online = 0;
      int javaPlayers = 0;
      int bedrockPlayers = 0;

      for (Player player : this.plugin.getServer().getOnlinePlayers()) {
        online++;
        String edition = this.plugin.editionOf(player);
        if ("bedrock".equals(edition)) {
          bedrockPlayers++;
        } else {
          javaPlayers++;
        }
        JsonObject entry = new JsonObject();
        entry.addProperty("uuid", player.getUniqueId().toString());
        entry.addProperty("username", player.getName());
        entry.addProperty("edition", edition);
        players.add(entry);
      }

      JsonObject body = new JsonObject();
      body.addProperty("online", true);
      body.addProperty("motd", this.motd);
      body.addProperty("version", this.version);
      body.addProperty("playersOnline", online);
      body.addProperty("maxPlayers", this.plugin.getServer().getMaxPlayers());
      body.addProperty("javaPlayers", javaPlayers);
      body.addProperty("bedrockPlayers", bedrockPlayers);
      body.addProperty("uptimeSeconds", (System.currentTimeMillis() - this.serverStartedAtMs) / 1000L);
      body.addProperty("tps", averageTicksPerSecond());
      body.addProperty("host", this.host);
      body.addProperty("port", this.port);
      JsonArray playerArray = new JsonArray();
      for (JsonObject player : players) {
        playerArray.add(player);
      }
      body.add("players", playerArray);

      JsonObject data = this.bridge.post("/heartbeat", new com.google.gson.Gson().toJson(body));
      this.plugin.getLogger().fine("Heartbeat acknowledged: " + data);
    } catch (Exception e) {
      this.plugin.getLogger().warning("Heartbeat failed: " + e.getMessage());
    }
  }

  private String averageTicksPerSecond() {
    double averageTickMillis = this.plugin.getServer().getAverageTickTime();
    if (averageTickMillis <= 0) {
      return "1.00";
    }
    return String.valueOf(Math.min(20.0, 1000.0 / averageTickMillis));
  }
}
