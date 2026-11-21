import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { linkCodes, minecraftAccounts, playerStats } from "@/db/schema";
import { humanCode } from "@/lib/crypto";
import { ApiError } from "@/lib/api";

export type LinkedAccount = {
  id: string;
  username: string;
  uuid: string;
  edition: "java" | "bedrock";
  xuid: string | null;
  verified: boolean;
  linkedAt: Date;
  lastSeenAt: Date | null;
};

export async function getLinkedAccount(userId: string): Promise<LinkedAccount | null> {
  const rows = await db
    .select()
    .from(minecraftAccounts)
    .where(eq(minecraftAccounts.userId, userId))
    .limit(1);
  return (rows[0] as LinkedAccount | undefined) ?? null;
}

/**
 * Issues a short-lived linking code. Any previous unused code is invalidated so
 * only the newest code shown to the player can be redeemed.
 */
export async function issueLinkCode(
  userId: string,
  minutes = 15,
): Promise<{ code: string; expiresAt: Date }> {
  const existing = await getLinkedAccount(userId);
  if (existing) {
    throw new ApiError(409, "ALREADY_LINKED", "This account already has a Minecraft profile linked.");
  }

  await db
    .update(linkCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(linkCodes.userId, userId), isNull(linkCodes.consumedAt)));

  const code = humanCode(8);
  const expiresAt = new Date(Date.now() + minutes * 60_000);
  await db.insert(linkCodes).values({ userId, code, expiresAt });
  return { code, expiresAt };
}

export async function latestLinkCode(userId: string) {
  const rows = await db
    .select()
    .from(linkCodes)
    .where(and(eq(linkCodes.userId, userId), isNull(linkCodes.consumedAt)))
    .orderBy(desc(linkCodes.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Deterministic pixel avatar generated from the username.
 *
 * Cracked players have no Mojang skin, so the portal renders a stable,
 * owned-by-us avatar instead of hotlinking a third-party skin service. Drop a
 * real skin pipeline into `/api/avatar/[name]` later without touching callers.
 */
export function avatarSvg(seed: string, size = 128): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = Math.abs(h) % 360;
  const hue2 = (hue + 40) % 360;
  const cells: string[] = [];
  const grid = 8;
  // Symmetric face pattern, Minecraft-head proportions.
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < Math.ceil(grid / 2); x++) {
      const bit = (h >>> ((x * 7 + y * 3) % 28)) & 1;
      const shade = (h >>> ((x + y) % 24)) & 1 ? 18 : 6;
      if (bit) {
        const fill = `hsl(${hue} 45% ${24 + shade}%)`;
        cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
        cells.push(`<rect x="${grid - 1 - x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 8 8" shape-rendering="crispEdges">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 38% 30%)"/>
    <stop offset="1" stop-color="hsl(${hue2} 42% 16%)"/>
  </linearGradient></defs>
  <rect width="8" height="8" fill="url(#g)"/>
  ${cells.join("")}
</svg>`;
}

export async function upsertPlayerStats(values: {
  uuid: string;
  username: string;
  rank?: string;
  playtimeSeconds?: number;
  kills?: number;
  deaths?: number;
  mobKills?: number;
  killstreak?: number;
  bestKillstreak?: number;
  wins?: number;
  losses?: number;
  blocksBroken?: number;
  blocksPlaced?: number;
  lastSeenAt?: Date;
}) {
  await db
    .insert(playerStats)
    .values({
      uuid: values.uuid,
      username: values.username,
      rank: values.rank ?? "Member",
      playtimeSeconds: values.playtimeSeconds ?? 0,
      kills: values.kills ?? 0,
      deaths: values.deaths ?? 0,
      mobKills: values.mobKills ?? 0,
      killstreak: values.killstreak ?? 0,
      bestKillstreak: values.bestKillstreak ?? 0,
      wins: values.wins ?? 0,
      losses: values.losses ?? 0,
      blocksBroken: values.blocksBroken ?? 0,
      blocksPlaced: values.blocksPlaced ?? 0,
      lastSeenAt: values.lastSeenAt ?? new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: playerStats.uuid,
      set: {
        username: values.username,
        rank: values.rank ?? "Member",
        playtimeSeconds: values.playtimeSeconds ?? 0,
        kills: values.kills ?? 0,
        deaths: values.deaths ?? 0,
        mobKills: values.mobKills ?? 0,
        killstreak: values.killstreak ?? 0,
        bestKillstreak: values.bestKillstreak ?? 0,
        wins: values.wins ?? 0,
        losses: values.losses ?? 0,
        blocksBroken: values.blocksBroken ?? 0,
        blocksPlaced: values.blocksPlaced ?? 0,
        lastSeenAt: values.lastSeenAt ?? new Date(),
        updatedAt: new Date(),
      },
    });
}
