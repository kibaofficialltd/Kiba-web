# KIBAOFFICIALCore — Paper plugin

Server-side bridge that connects a Minecraft server to the KIBAOFFICIAL website
portal. Source lives in this folder; build with Maven against Paper 1.21.x.

## Build

```bash
cd plugin
mvn -DskipTests package
# → plugin/target/KIBAOFFICIALCore-1.0.0.jar
```

## Configure

Copy `config.yml` defaults and set in the server:

- `website.base-url` — public site origin hosting the API (e.g. `https://kibaofficial.fun`).
- `website.api-path` — API prefix (default `/api/plugin`).
- `plugin.shared-secret` — must equal `PLUGIN_SHARED_SECRET` on the website.
- `plugin.timestamp-tolerance-seconds` — default 300.
- `server.host`, `server.port`, `server.bedrock-port`, `server.version`, `server.motd`.

## Behaviour

1. **Heartbeat** (`heartbeat.interval-seconds`, default 20s): signed POST to
   `/api/plugin/heartbeat` with live MOTD, version, online counts, uptime, TPS and
   online player list. Website marks the server offline when no heartbeat arrives
   within `heartbeat.stale-after-seconds`.
2. **Delivery worker** (`deliveries.claim-interval-seconds`, default 3s; batch 25):
   signed POST to `/api/plugin/deliveries/claim`, executes the command bundle for
   the target player (`{player}`, `{uuid}`, `{username}` placeholders), then reports
   the result to `/api/plugin/deliveries/result`. Retries up to `deliveries.max-attempts`.
3. **Stats sync** (`stats.sync-on-join`, `stats.sync-interval-seconds`): signed POST to
   `/api/plugin/players/sync` with live gameplay stats; pushes on join/quit and on interval.
4. **Economy read** (`economy.enabled`, `economy.refresh-interval-seconds`): signed POST to
   `/api/plugin/accounts` with online player UUIDs to read the website-authoritative coin
   balance.
5. **`/link <CODE>`**: resolves the caller’s Minecraft UUID server-side (Mojang session
   lookup, Bedrock XUID bridges where available) and redeems the one-time code via
   `/api/plugin/link/verify`.

## Security contract

- All requests are HMAC-SHA256 signed over `${timestamp}.${nonce}.${rawBody}`.
- Timestamps outside the tolerance window are rejected; nonces are single-use.
- Optional `plugin.ip.allowlist` in `config.yml` restricts source IPs.
