import { jsonOk, route } from "@/lib/api";
import { db } from "@/db";
import { onlinePlayers } from "@/db/schema";
import { getServerSnapshot } from "@/lib/server-status";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const snapshot = await getServerSnapshot();
  if (!snapshot.online) {
    return jsonOk({ players: [], count: 0, online: false });
  }
  const players = await db
    .select({
      uuid: onlinePlayers.uuid,
      username: onlinePlayers.username,
      edition: onlinePlayers.edition,
    })
    .from(onlinePlayers)
    .orderBy(desc(onlinePlayers.updatedAt))
    .limit(200);

  return jsonOk({ players, count: players.length, online: true });
});
