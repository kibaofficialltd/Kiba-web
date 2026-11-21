package io.kibaofficial.core.economy;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.bukkit.entity.Player;

import com.google.gson.JsonObject;

import io.kibaofficial.core.KIBAOfficialCore;
import io.kibaofficial.core.http.HttpClientBridge;

/**
 * Reads the website-authoritative coin balance for online players through the
 * plugin bridge and exposes it through the server economy read model. The portal
 * ledger is the single source of truth — the plugin never invents balances.
 */
public final class EconomyBridge {

  private final KIBAOfficialCore plugin;
  private final HttpClientBridge bridge;
  private final ScheduledExecutorService scheduler;

  public EconomyBridge(KIBAOfficialCore plugin) {
    this.plugin = plugin;
    this.bridge = plugin.getBridge();
    this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
      Thread thread = new Thread(r, "kiba-economy-worker");
      thread.setDaemon(true);
      return thread;
    });
  }

  public void start() {
    long intervalMillis = Math.max(10_000L, this.plugin.getConfig().getLong("economy.refresh-interval-seconds", 60L) * 1000L);
    this.scheduler.scheduleAtFixedRate(() -> this.refreshOnline(), intervalMillis, intervalMillis, TimeUnit.MILLISECONDS);
  }

  public void stop() {
    this.scheduler.shutdownNow();
  }

  public void refreshOnline() {
    for (Player player : this.plugin.getServer().getOnlinePlayers()) {
      this.refresh(player);
    }
  }

  private void refresh(Player player) {
    try {
      java.util.List<String> uuids = new java.util.ArrayList<>();
      uuids.add(player.getUniqueId().toString());
      JsonObject body = new JsonObject();
      body.add("uuids", new com.google.gson.Gson().toJsonTree(uuids));
      JsonObject data = this.bridge.post("/accounts", new com.google.gson.Gson().toJson(body));
      com.google.gson.JsonArray accounts = data.getAsJsonArray("accounts");
      if (accounts != null) {
        for (int i = 0; i < accounts.size(); i++) {
          com.google.gson.JsonObject account = accounts.get(i).getAsJsonObject();
          if (account.get("uuid").getAsString().equals(player.getUniqueId().toString())) {
            this.plugin.getLogger().info("Coin balance for " + player.getName() + ": " + account.get("balance"));
          }
        }
      }
    } catch (Exception e) {
      this.plugin.getLogger().warning("Economy lookup failed for " + player.getName() + ": " + e.getMessage());
    }
  }
}
