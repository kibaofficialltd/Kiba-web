import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { serverStatus } from "@/db/schema";
import { site } from "@/lib/site";
import type { ServerSnapshot } from "@/lib/server-shared";

export type { ServerSnapshot };
export { formatUptime } from "@/lib/server-shared";

/** A heartbeat older than this means we cannot honestly claim the server is up. */
const STALE_AFTER_MS = 90_000;

export async function getServerSnapshot(): Promise<ServerSnapshot> {
  const rows = await db.select().from(serverStatus).where(eq(serverStatus.id, 1)).limit(1);
  const row = rows[0];
  const lastHeartbeat = row?.lastHeartbeatAt ? new Date(row.lastHeartbeatAt) : null;
  const fresh = Boolean(lastHeartbeat && Date.now() - lastHeartbeat.getTime() < STALE_AFTER_MS);
  const online = Boolean(row?.online && fresh);

  return {
    online,
    stale: Boolean(lastHeartbeat && !fresh),
    motd: row?.motd ?? "",
    version: row?.version ?? site.server.version,
    host: row?.host ?? site.server.host,
    port: row?.port ?? site.server.port,
    bedrockPort: site.server.bedrockPort,
    playersOnline: online ? (row?.playersOnline ?? 0) : 0,
    maxPlayers: row?.maxPlayers ?? 0,
    javaPlayers: online ? (row?.javaPlayers ?? 0) : 0,
    bedrockPlayers: online ? (row?.bedrockPlayers ?? 0) : 0,
    uptimeSeconds: online ? (row?.uptimeSeconds ?? 0) : 0,
    tps: online ? (row?.tps ?? null) : null,
    lastHeartbeatAt: lastHeartbeat?.toISOString() ?? null,
    lastUpdated: new Date().toISOString(),
  };
}
