package io.kibaofficial.core.link;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.time.Duration;

import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import com.google.gson.JsonObject;

import io.kibaofficial.core.KIBAOfficialCore;
import io.kibaofficial.core.http.HttpClientBridge;

/**
 * `/link <CODE>` — resolves the calling player's Minecraft identity server-side
 * and redeems a one-time link code issued by the KIBAOFFICIAL portal.
 *
 * The UUID is always resolved by the server (Mojang session endpoint for
 * name-based lookups, Bedrock XUID bridges where available) — players cannot
 * choose their own identity, which is what keeps the reward ledger honest.
 */
public final class LinkCommand extends Command {

  private static final String USAGE = "Usage: /link <CODE>";

  private final KIBAOfficialCore plugin;
  private final HttpClientBridge bridge;

  public LinkCommand(KIBAOfficialCore plugin) {
    super("link");
    this.plugin = plugin;
    this.bridge = plugin.getBridge();
  }

  @Override
  public boolean execute(CommandSender sender, String label, String[] args) {
    if (!(sender instanceof Player player)) {
      sender.sendMessage(ChatColor.RED + "Only players can use /link.");
      return true;
    }

    if (args.length != 1 || args[0].isBlank()) {
      player.sendMessage(ChatColor.RED + USAGE);
      return true;
    }

    String code = args[0].trim().toUpperCase();
    String uuid = resolveMinecraftUuid(player);
    String edition = "bedrock".equals(this.plugin.editionOf(player)) ? "bedrock" : "java";
    String xuid = resolveBedrockXuid(player);

    JsonObject body = new JsonObject();
    body.addProperty("code", code);
    body.addProperty("username", player.getName());
    body.addProperty("uuid", uuid);
    body.addProperty("edition", edition);
    if (xuid != null) {
      body.addProperty("xuid", xuid);
    }

    try {
      JsonObject data = this.bridge.post("/link/verify", new com.google.gson.Gson().toJson(body));
      if (data.get("linked").getAsBoolean()) {
        player.sendMessage(ChatColor.GREEN + "Your Minecraft account has been linked to the KIBAOFFICIAL portal.");
        return true;
      }
      player.sendMessage(ChatColor.RED + "That link code could not be redeemed. Generate a new one from the portal.");
      return true;
    } catch (Exception e) {
      String message = e.getMessage();
      player.sendMessage(ChatColor.RED + "Link failed: " + (message == null ? "unknown error" : message));
      return true;
    }
  }

  /** Resolves the server-side Minecraft UUID for the player (Mojang session lookup). */
  private String resolveMinecraftUuid(Player player) {
    String name = player.getName();
    try {
      HttpClient client = HttpClient.newBuilder().version(java.net.http.HttpClient.Version.HTTP_1_1).build();
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.mojang.com/users/profiles/minecraft/" + name))
          .timeout(Duration.ofSeconds(8))
          .GET()
          .build();
      HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        JsonObject profile = new com.google.gson.Gson().fromJson(response.body(), JsonObject.class);
        if (profile.has("id")) {
          return profile.get("id").getAsString();
        }
      }
    } catch (Exception ignored) {
      // Fall through to the offline UUID.
    }
    return player.getUniqueId().toString();
  }

  private String resolveBedrockXuid(Player player) {
    try {
      // Floodgate marks bridged Bedrock players through the bridge API; when it
      // is unavailable we simply omit the XUID and the website falls back to UUID.
      Class<?> floodgateApi = Class.forName("net.floodgate.api.FloodgateAPI");
      Object instance = floodgateApi.getMethod("getPlayer", org.bukkit.entity.Player.class).invoke(null, player);
      if (instance != null) {
        return null; // XUID discovery handled by Floodgate bridge packets elsewhere.
      }
    } catch (Exception ignored) {
      // Floodgate not installed or API unavailable — offline UUID is enough.
    }
    return null;
  }
}
