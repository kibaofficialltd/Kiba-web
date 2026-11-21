import { jsonOk, route } from "@/lib/api";
import { getServerSnapshot } from "@/lib/server-status";
import { db } from "@/db";
import { playerStats } from "@/db/schema";
import { count, sum } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const [snapshot, totals] = await Promise.all([
    getServerSnapshot(),
    db
      .select({
        trackedPlayers: count(),
        totalKills: sum(playerStats.kills),
        totalPlaytime: sum(playerStats.playtimeSeconds),
      })
      .from(playerStats),
  ]);

  return jsonOk({
    server: snapshot,
    network: {
      trackedPlayers: Number(totals[0]?.trackedPlayers ?? 0),
      totalKills: Number(totals[0]?.totalKills ?? 0),
      totalPlaytimeSeconds: Number(totals[0]?.totalPlaytime ?? 0),
    },
  });
});
