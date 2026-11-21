import type { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { playerStats } from "@/db/schema";
import { jsonOk, route } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeaderboardItem = {
  uuid?: string;
  username?: string;
  value?: string | number;
};

export const POST = route(async (req: NextRequest) => {
  const { body } = await verifyPluginRequest(req);
  const data = (body ?? {}) as Record<string, unknown>;

  const playtimeList = (data.playtime_seconds ?? []) as LeaderboardItem[];
  const killsList = (data.kills ?? []) as LeaderboardItem[];
  const deathsList = (data.deaths ?? []) as LeaderboardItem[];
  const mobKillsList = (data.mob_kills ?? []) as LeaderboardItem[];

  const playerMap = new Map<
    string,
    { username: string; playtime?: number; kills?: number; deaths?: number; mobKills?: number }
  >();

  const register = (
    list: LeaderboardItem[],
    field: "playtime" | "kills" | "deaths" | "mobKills",
  ) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      const u = (item.uuid ?? "").toLowerCase().trim();
      if (!u) continue;
      const existing = playerMap.get(u) ?? { username: item.username ?? "Player" };
      existing.username = item.username ?? existing.username;
      const numVal = Number(item.value) || 0;
      existing[field] = numVal;
      playerMap.set(u, existing);
    }
  };

  register(playtimeList, "playtime");
  register(killsList, "kills");
  register(deathsList, "deaths");
  register(mobKillsList, "mobKills");

  const now = new Date();
  for (const [uuid, p] of playerMap.entries()) {
    await db
      .insert(playerStats)
      .values({
        uuid,
        username: p.username,
        playtimeSeconds: p.playtime ?? 0,
        kills: p.kills ?? 0,
        deaths: p.deaths ?? 0,
        mobKills: p.mobKills ?? 0,
        lastSeenAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: playerStats.uuid,
        set: {
          username: p.username,
          ...(p.playtime !== undefined ? { playtimeSeconds: p.playtime } : {}),
          ...(p.kills !== undefined ? { kills: p.kills } : {}),
          ...(p.deaths !== undefined ? { deaths: p.deaths } : {}),
          ...(p.mobKills !== undefined ? { mobKills: p.mobKills } : {}),
          lastSeenAt: now,
          updatedAt: now,
        },
      });
  }

  return jsonOk({ success: true, updated: playerMap.size });
});
