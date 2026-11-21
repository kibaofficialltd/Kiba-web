package io.kibaofficial.core.sync;

import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.bukkit.entity.Player;
import org.bukkit.scoreboard.Objective;
import org.bukkit.scoreboard.Score;
import org.bukkit.scoreboard.Scoreboard;

import com.google.gson.JsonObject;

import io.kibaofficial.core.KIBAOfficialCore;
import io.kibaofficial.core.http.HttpClientBridge;

/**
 * Pushes live gameplay statistics from the server to the portal so leaderboards
 * and public profiles reflect real numbers. Values come from the server itself —
 * nothing is ever fabricated or seeded. Numeric counters are read from the
 * `kiba.<stat>` scoreboard objectives owned by the server.
 */
public final class StatsService {

  private static final String OBJECTIVE_PREFIX = "kiba.";

  private final KIBAOfficialCore plugin;
  private final HttpClientBridge bridge;
  private final ScheduledExecutorService scheduler;

  public StatsService(KIBAOfficialCore plugin) {
    this.plugin = plugin;
    this.bridge = plugin.getBridge();
    this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
      Thread thread = new Thread(r, "kiba-stats-worker");
      thread.setDaemon(true);
      return thread;
    });
  }

  public void start() {
    long intervalMillis = Math.max(30_000L, this.plugin.getConfig().getLong("stats.sync-interval-seconds", 300L) * 1000L);
    this.scheduler.scheduleAtFixedRate(() -> this.syncOnline(), intervalMillis, intervalMillis, TimeUnit.MILLISECONDS);
  }

  public void stop() {
    this.scheduler.shutdownNow();
  }

  /** Pushes the given player's stats to the portal. Called on join, quit and on the interval. */
  public void push(Player player) {
    try {
      JsonObject body = new JsonObject();
      body.addProperty("uuid", player.getUniqueId().toString());
      body.addProperty("username", player.getName());
      body.addProperty("rank", "Member");
      body.addProperty("playtimeSeconds", readStat(player, OBJECTIVE_PREFIX + "playtime"));
      body.addProperty("kills", readStat(player, OBJECTIVE_PREFIX + "kills"));
      body.addProperty("deaths", readStat(player, OBJECTIVE_PREFIX + "deaths"));
      body.addProperty("mobKills", readStat(player, OBJECTIVE_PREFIX + "mobKills"));
      body.addProperty("killstreak", readStat(player, OBJECTIVE_PREFIX + "bestKillstreak"));
      body.addProperty("bestKillstreak", readStat(player, OBJECTIVE_PREFIX + "bestKillstreak"));
      body.addProperty("wins", readStat(player, OBJECTIVE_PREFIX + "wins"));
      body.addProperty("losses", readStat(player, OBJECTIVE_PREFIX + "losses"));
      body.addProperty("blocksBroken", readStat(player, OBJECTIVE_PREFIX + "blocksBroken"));
      body.addProperty("blocksPlaced", readStat(player, OBJECTIVE_PREFIX + "blocksPlaced"));
      body.addProperty("lastSeenAt", java.time.Instant.now().toString());
      JsonObject data = this.bridge.post("/players/sync", new com.google.gson.Gson().toJson(body));
      this.plugin.getLogger().fine("Stats sync acknowledged: " + data);
    } catch (Exception e) {
      this.plugin.getLogger().warning("Stats sync failed for " + player.getName() + ": " + e.getMessage());
    }
  }

  private void syncOnline() {
    for (Player player : this.plugin.getServer().getOnlinePlayers()) {
      this.push(player);
    }
  }

  private int readStat(Player player, String objectiveName) {
    try {
      Set<Score> scores = player.getScoreboard().getScores(player);
      if (scores == null) {
        return 0;
      }
      for (Score score : scores) {
        Objective objective = score.getObjective();
        if (objective != null && objective.getName().equals(objectiveName)) {
          return score.getScore();
        }
      }
    } catch (Exception ignored) {
      // Missing objective means the counter has never been written — treat as zero.
    }
    return 0;
  }
}
