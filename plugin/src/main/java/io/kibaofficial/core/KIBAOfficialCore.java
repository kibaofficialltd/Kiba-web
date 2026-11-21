package io.kibaofficial.core;

import java.util.HashMap;
import java.util.Map;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

import io.kibaofficial.core.economy.EconomyBridge;
import io.kibaofficial.core.http.HttpClientBridge;
import io.kibaofficial.core.link.LinkCommand;
import io.kibaofficial.core.sync.StatsService;

/**
 * KIBAOFFICIALCore bridges a Paper/Spigot server into the KIBAOFFICIAL website
 * portal: live status heartbeats, the delivery queue, gameplay statistics and
 * the economy read model.
 *
 * Everything that mutates website state goes through HMAC-signed,
 * timestamped, replay-protected requests — see
 * {@link io.kibaofficial.core.http.HttpClientBridge}.
 */
public final class KIBAOfficialCore extends JavaPlugin implements org.bukkit.event.Listener {

  public static final String PREFIX = "KIBAOFFICIAL";

  private HttpClientBridge bridge;
  private StatsService statsService;
  private EconomyBridge economyBridge;
  private DeliveryService deliveryService;
  private HeartbeatService heartbeatService;

  private String motd = "&bKIBA&7&8 » &f&lKIBAOFFICIAL&8&7&8 » &bPlay your adventure.";
  private String version = "Java 1.21.x · Bedrock 1.21.x";
  private String host = "play.kibaofficial.fun";
  private int port = 25565;
  private int bedrockPort = 19132;

  private int heartbeatIntervalSeconds = 20;
  private int staleAfterSeconds = 90;

  @Override
  public void onEnable() {
    saveDefaultConfig();
    loadConfig();

    this.bridge = new HttpClientBridge(this);
    this.statsService = new StatsService(this);
    this.economyBridge = new EconomyBridge(this);
    this.deliveryService = new DeliveryService(this);
    this.heartbeatService = new HeartbeatService(this);

    getServer().getPluginManager().registerEvents(this, this);

    this.getServer().getCommandMap().register(
        "kiba",
        "link",
        new LinkCommand(this));

    this.heartbeatService.start();
    this.deliveryService.start();
    this.statsService.start();
    this.economyBridge.start();

    getLogger().info("KIBAOFFICIALCore enabled — portal bridge online.");
  }

  @Override
  public void onDisable() {
    this.heartbeatService.stop();
    this.deliveryService.stop();
    this.statsService.stop();
    this.economyBridge.stop();
  }

  public void onPlayerJoin(org.bukkit.event.player.PlayerJoinEvent event) {
    this.statsService.push(event.getPlayer());
    this.economyBridge.refreshOnline();
  }

  public void onPlayerQuit(org.bukkit.event.player.PlayerQuitEvent event) {
    this.statsService.push(event.getPlayer());
    this.economyBridge.refreshOnline();
  }

  public HttpClientBridge getBridge() {
    return this.bridge;
  }

  public String getMotd() {
    return this.motd;
  }

  public String getVersion() {
    return this.version;
  }

  public String getHost() {
    return this.host;
  }

  public int getPort() {
    return this.port;
  }

  public int getBedrockPort() {
    return this.bedrockPort;
  }

  public int getHeartbeatIntervalSeconds() {
    return this.heartbeatIntervalSeconds;
  }

  public int getStaleAfterSeconds() {
    return this.staleAfterSeconds;
  }

  void loadConfig() {
    FileConfiguration config = getConfig();
    this.motd = config.getString("server.motd", this.motd);
    this.version = config.getString("server.version", this.version);
    this.host = config.getString("server.host", this.host);
    this.port = config.getInt("server.port", this.port);
    this.bedrockPort = config.getInt("server.bedrock-port", this.bedrockPort);

    this.heartbeatIntervalSeconds = Math.max(5, config.getInt("heartbeat.interval-seconds", 20));
    this.staleAfterSeconds = Math.max(30, config.getInt("heartbeat.stale-after-seconds", 90));
  }

  /** Online player book-keeping shared by the heartbeat and stats tasks. */
  public final Map<org.bukkit.entity.Player, String> playerEditions = new HashMap<>();

  public void setEdition(org.bukkit.entity.Player player, String edition) {
    this.playerEditions.put(player, edition);
  }

  public void removeEdition(org.bukkit.entity.Player player) {
    this.playerEditions.remove(player);
  }

  public String editionOf(org.bukkit.entity.Player player) {
    return this.playerEditions.getOrDefault(player, "java");
  }
}
