import type { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  linkCodes,
  minecraftAccounts,
  notifications,
  playerStats,
  users,
} from "@/db/schema";
import { jsonOk, route, ApiError } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";
import { audit } from "@/lib/audit";
import { adjustCoins } from "@/lib/coins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  const { body, ip } = await verifyPluginRequest(req);
  const data = (body ?? {}) as {
    code?: string;
    playerUuid?: string;
    uuid?: string;
    username?: string;
    platform?: string;
    edition?: string;
  };

  const codeStr = (data.code ?? "").toUpperCase().trim();
  const uuid = (data.playerUuid ?? data.uuid ?? "").toLowerCase().trim();
  const username = (data.username ?? "").trim();
  const edition = (data.platform?.toLowerCase() === "bedrock" || data.edition === "bedrock")
    ? ("bedrock" as const)
    : ("java" as const);

  if (!codeStr || !uuid || !username) {
    throw new ApiError(422, "VALIDATION_ERROR", "Missing code, UUID, or username.");
  }

  const result = await db.transaction(async (tx) => {
    const codeRows = await tx
      .select()
      .from(linkCodes)
      .where(and(eq(linkCodes.code, codeStr), isNull(linkCodes.consumedAt)))
      .limit(1);

    const code = codeRows[0];
    if (!code) throw new ApiError(404, "CODE_NOT_FOUND", "That link code is invalid or already used.");
    if (code.expiresAt < new Date()) throw new ApiError(410, "CODE_EXPIRED", "That link code has expired. Generate a new one.");
    if (code.attempts >= 5) throw new ApiError(429, "TOO_MANY_ATTEMPTS", "Too many attempts for this code.");

    const uuidTaken = await tx
      .select({ userId: minecraftAccounts.userId })
      .from(minecraftAccounts)
      .where(eq(minecraftAccounts.uuid, uuid))
      .limit(1);
    if (uuidTaken[0] && uuidTaken[0].userId !== code.userId) {
      throw new ApiError(409, "UUID_ALREADY_LINKED", "This Minecraft account is linked to another portal user.");
    }

    const already = await tx
      .select({ id: minecraftAccounts.id })
      .from(minecraftAccounts)
      .where(eq(minecraftAccounts.userId, code.userId))
      .limit(1);
    if (already[0]) throw new ApiError(409, "ALREADY_LINKED", "This portal account already has a linked profile.");

    await tx.insert(minecraftAccounts).values({
      userId: code.userId,
      username,
      uuid,
      edition,
      verified: true,
      lastSeenAt: new Date(),
    });

    await tx
      .update(linkCodes)
      .set({ consumedAt: new Date(), attempts: code.attempts + 1 })
      .where(eq(linkCodes.id, code.id));

    await tx
      .insert(playerStats)
      .values({
        uuid,
        username,
        firstJoinedAt: new Date(),
        lastSeenAt: new Date(),
      })
      .onConflictDoNothing({ target: playerStats.uuid });

    const ownerRows = await tx
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, code.userId))
      .limit(1);

    await adjustCoins(tx, code.userId, 500, "admin_grant", {
      note: "Account linking bonus",
    });

    await tx.insert(notifications).values({
      userId: code.userId,
      type: "system",
      title: "Minecraft account linked (+500 Coins!)",
      body: `${username} is now connected to your portal account. 500 bonus coins have been added to your balance.`,
      link: "/dashboard",
    });

    return {
      userId: code.userId,
      websiteUsername: ownerRows[0]?.username ?? null,
    };
  });

  await audit({
    actorId: result.userId,
    action: "minecraft.linked",
    targetType: "minecraft",
    targetId: uuid,
    meta: { username, edition, ip },
  });

  return jsonOk({
    success: true,
    linked: true,
    userId: result.userId,
    websiteUsername: result.websiteUsername,
    minecraft: { username, uuid, edition },
  });
});
