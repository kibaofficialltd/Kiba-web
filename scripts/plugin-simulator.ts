/**
 * Smoke test for the KIBAOFFICIALCore plugin bridge.
 *
 * Signs requests exactly like the Java plugin does (HMAC-SHA256 over
 * `${timestamp}.${nonce}.${rawBody}`, single-use nonce, timestamp window) and
 * exercises every endpoint the plugin calls. Run with the dev server up:
 *
 *   pnpm plugin:sim
 */
import { createHmac } from "node:crypto";
import { randomBytes } from "node:crypto";
import { config } from "dotenv";

config();

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";
const SECRET = process.env.PLUGIN_SHARED_SECRET ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

async function pluginPost(path: string, body: unknown) {
  const rawBody = typeof body === "string" ? body : JSON.stringify(body ?? {});
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", SECRET).update(`${timestamp}.${nonce}.${rawBody}`).digest("hex");

  const response = await fetch(`${BASE_URL}/api/plugin${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-kiba-timestamp": timestamp,
      "x-kiba-nonce": nonce,
      "x-kiba-signature": signature,
    },
    body: rawBody,
    credentials: "same-origin",
  });

  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

async function main() {
  if (!SECRET) throw new Error("PLUGIN_SHARED_SECRET is not set.");

  // 1. Heartbeat
  const heartbeat = await pluginPost("/heartbeat", {
    online: true,
    motd: "&bKIBA&7&8 » &f&lKIBAOFFICIAL&8&7&8 » &bPlay your adventure.",
    version: "Java 1.21.x · Bedrock 1.21.x",
    playersOnline: 0,
    maxPlayers: 100,
    javaPlayers: 0,
    bedrockPlayers: 0,
    uptimeSeconds: 3600,
    tps: "1.00",
    host: "play.kibaofficial.fun",
    port: 25565,
    players: [],
  });
  console.log("heartbeat", heartbeat.status, JSON.stringify(heartbeat.payload));
  if (heartbeat.status >= 400) throw new Error("Heartbeat failed");

  // 2. Delivery claim + result
  const claim = await pluginPost("/deliveries/claim", {});
  console.log("deliveries/claim", claim.status, JSON.stringify(claim.payload));
  const deliveries = claim.payload?.data?.deliveries ?? [];
  for (const delivery of deliveries) {
    const result = await pluginPost("/deliveries/result", {
      deliveryId: delivery.id,
      success: true,
    });
    console.log(`deliveries/result(${delivery.id})`, result.status, JSON.stringify(result.payload));
  }

  // 3. Player stats sync
  const stats = await pluginPost("/players/sync", {
    players: [
      {
        uuid: "0f8f7f6e-5f4e-3d2c-1b0a-9f8e7d6c5b4a",
        username: "KibaSmokeTest",
        rank: "Member",
        playtimeSeconds: 120,
        kills: 1,
        deaths: 2,
        mobKills: 3,
        killstreak: 2,
        bestKillstreak: 4,
        wins: 1,
        losses: 2,
        blocksBroken: 100,
        blocksPlaced: 50,
        lastSeenAt: new Date().toISOString(),
      },
    ],
  });
  console.log("players/sync", stats.status, JSON.stringify(stats.payload));
  if (stats.status >= 400) throw new Error("Stats sync failed");

  // 4. Coin balance lookup
  const accounts = await pluginPost("/accounts", { uuids: ["0f8f7f6e-5f4e-3d2c-1b0a-9f8e7d6c5b4a"] });
  console.log("accounts", accounts.status, JSON.stringify(accounts.payload));

  // 5. Link verify with a bogus code — should be rejected cleanly (proves signing).
  const link = await pluginPost("/link/verify", {
    code: "ZZZZZZZZ",
    username: "KibaSmokeTest",
    uuid: "0f8f7f6e-5f4e-3d2c-1b0a-9f8e7d6c5b4a",
    edition: "java",
  });
  console.log("link/verify(bogus)", link.status, JSON.stringify(link.payload));
  if (link.status < 400) throw new Error("Expected the bogus link code to be rejected.");

  // 6. Cron housekeeping (requires bearer token).
  if (CRON_SECRET) {
    const pruneResponse = await fetch(`${BASE_URL}/api/cron/prune`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      credentials: "same-origin",
    });
    console.log("cron/prune", pruneResponse.status, JSON.stringify(await pruneResponse.json()));
  }

  console.log("plugin bridge smoke test passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
