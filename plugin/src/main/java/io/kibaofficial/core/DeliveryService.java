package io.kibaofficial.core;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.bukkit.Bukkit;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import io.kibaofficial.core.http.HttpClientBridge;

/**
 * Polls the website delivery queue and applies command bundles in-game.
 *
 * The website leases deliveries with FOR UPDATE SKIP LOCKED and reclaims stale
 * leases after two minutes, so this task may safely run on any server instance.
 * Failed attempts are reported back; after the configured attempt limit the
 * delivery is marked failed on the website and staff are notified.
 */
public final class DeliveryService {

  private final KIBAOfficialCore plugin;
  private final HttpClientBridge bridge;
  private final ScheduledExecutorService scheduler;

  public DeliveryService(KIBAOfficialCore plugin) {
    this.plugin = plugin;
    this.bridge = plugin.getBridge();
    this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
      Thread thread = new Thread(r, "kiba-delivery-worker");
      thread.setDaemon(true);
      return thread;
    });
  }

  public void start() {
    long periodMillis = Math.max(1000L, this.plugin.getConfig().getLong("deliveries.claim-interval-seconds", 3L) * 1000L);
    this.scheduler.scheduleAtFixedRate(this::claim, 2L, periodMillis, TimeUnit.MILLISECONDS);
  }

  public void stop() {
    this.scheduler.shutdownNow();
  }

  private void claim() {
    try {
      JsonObject data = this.bridge.post("/deliveries/claim", "{}");
      JsonArray deliveries = data.getAsJsonArray("deliveries");
      if (deliveries == null || !deliveries.isJsonArray()) {
        return;
      }
      int processed = 0;
      for (int i = 0; i < deliveries.size(); i++) {
        JsonObject delivery = deliveries.get(i).getAsJsonObject();
        String deliveryId = delivery.has("id") && !delivery.get("id").isJsonNull() ? delivery.get("id").getAsString() : null;
        if (deliveryId == null) {
          continue;
        }
        boolean success = execute(delivery);
        try {
          JsonObject result = new JsonObject();
          result.addProperty("deliveryId", deliveryId);
          result.addProperty("success", success);
          if (!success) {
            result.addProperty("error", "Delivery command failed in-game.");
          }
          this.bridge.post("/deliveries/result", new com.google.gson.Gson().toJson(result));
          processed++;
        } catch (Exception e) {
          this.plugin.getLogger().warning("Could not report delivery result for " + deliveryId + ": " + e.getMessage());
        }
      }
      if (processed > 0) {
        this.plugin.getLogger().info("Processed " + processed + " delivery(s).");
      }
    } catch (Exception e) {
      this.plugin.getLogger().warning("Delivery claim failed: " + e.getMessage());
    }
  }

  private boolean execute(JsonObject delivery) {
    JsonArray commands = delivery.getAsJsonArray("commands");
    if (commands == null || !commands.isJsonArray()) {
      return true;
    }
    boolean ok = true;
    for (int i = 0; i < commands.size(); i++) {
      String command = commands.get(i).getAsString();
      String playerName = delivery.has("minecraftUsername") && !delivery.get("minecraftUsername").isJsonNull()
          ? delivery.get("minecraftUsername").getAsString()
          : null;
      String playerUuid = delivery.has("minecraftUuid") && !delivery.get("minecraftUuid").isJsonNull()
          ? delivery.get("minecraftUuid").getAsString()
          : null;
      org.bukkit.command.CommandSender sender = playerName != null ? this.plugin.getServer().getPlayer(playerName) : null;
      if (sender == null) {
        ok = false;
        break;
      }
      try {
        String resolved = command
            .replace("{player}", playerName)
            .replace("{uuid}", playerUuid == null ? "" : playerUuid);
        if (!Bukkit.dispatchCommand(sender, resolved)) {
          ok = false;
        }
      } catch (Exception e) {
        ok = false;
        break;
      }
    }
    return ok;
  }
}
