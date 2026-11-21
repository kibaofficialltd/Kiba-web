import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { minecraftAccounts, spinHistory, spinPrizes, users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { adjustCoins } from "@/lib/coins";
import { weightedPick } from "@/lib/crypto";
import { utcDate } from "@/lib/format";
import { audit } from "@/lib/audit";

export type SpinPrize = {
  id: string;
  label: string;
  coins: number;
  weight: number;
  color: string;
  rarity: string;
};

export type SpinState = {
  canSpin: boolean;
  nextSpinAt: string | null;
  prizes: SpinPrize[];
  history: Array<{
    id: string;
    prizeLabel: string;
    coins: number;
    createdAt: string;
  }>;
  linked: boolean;
  totalWeight: number;
};

export async function getSpinState(userId: string): Promise<SpinState> {
  const [prizes, historyRows, account] = await Promise.all([
    db.select().from(spinPrizes).where(eq(spinPrizes.enabled, true)).orderBy(spinPrizes.sortOrder),
    db
      .select()
      .from(spinHistory)
      .where(eq(spinHistory.userId, userId))
      .orderBy(desc(spinHistory.createdAt))
      .limit(12),
    db
      .select({ id: minecraftAccounts.id })
      .from(minecraftAccounts)
      .where(eq(minecraftAccounts.userId, userId))
      .limit(1),
  ]);

  const todayRows = await db
    .select({ id: spinHistory.id })
    .from(spinHistory)
    .where(and(eq(spinHistory.userId, userId), eq(spinHistory.spinDate, utcDate())))
    .limit(1);

  const midnight = new Date();
  const nextSpinAt = new Date(
    Date.UTC(midnight.getUTCFullYear(), midnight.getUTCMonth(), midnight.getUTCDate() + 1),
  );

  return {
    canSpin: todayRows.length === 0,
    nextSpinAt: todayRows.length === 0 ? null : nextSpinAt.toISOString(),
    prizes: prizes.map((prize) => ({
      id: prize.id,
      label: prize.label,
      coins: prize.coins,
      weight: prize.weight,
      color: prize.color,
      rarity: prize.rarity,
    })),
    history: historyRows.map((row) => ({
      id: row.id,
      prizeLabel: row.prizeLabel,
      coins: row.coins,
      createdAt: row.createdAt.toISOString(),
    })),
    linked: Boolean(account[0]),
    totalWeight: prizes.reduce((sum, prize) => sum + prize.weight, 0),
  };
}

/**
 * One spin per UTC day. The result is generated with crypto.randomInt before
 * the wheel animation starts; the browser never supplies or influences it.
 */
export async function performSpin(userId: string): Promise<{
  prize: SpinPrize;
  index: number;
  balance: number;
  spinId: string;
}> {
  const account = await db
    .select({ id: minecraftAccounts.id })
    .from(minecraftAccounts)
    .where(eq(minecraftAccounts.userId, userId))
    .limit(1);
  if (!account[0]) {
    throw new ApiError(409, "MINECRAFT_NOT_LINKED", "Link your Minecraft account before spinning.");
  }

  const prizes = await db
    .select()
    .from(spinPrizes)
    .where(eq(spinPrizes.enabled, true))
    .orderBy(spinPrizes.sortOrder);

  if (prizes.length < 2) {
    throw new ApiError(503, "SPIN_NOT_READY", "The prize wheel is not configured yet.");
  }

  const picked = weightedPick(prizes.map((prize) => ({ ...prize, weight: prize.weight })));
  if (!picked) throw new ApiError(503, "SPIN_NOT_READY", "The prize wheel is not configured yet.");

  const result = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(spinHistory)
      .values({
        userId,
        prizeId: picked.id,
        prizeLabel: picked.label,
        coins: picked.coins,
        spinDate: utcDate(),
      })
      .onConflictDoNothing()
      .returning();

    const spin = inserted[0];
    if (!spin) {
      throw new ApiError(409, "ALREADY_SPUN", "You have already spun today. Come back after 00:00 UTC.");
    }

    let balance: number;
    if (picked.coins > 0) {
      balance = await adjustCoins(tx, userId, picked.coins, "spin", {
        refType: "spin",
        refId: spin.id,
        note: `Daily spin — ${picked.label}`,
      });
    } else {
      const rows = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      balance = Number(rows[0]?.balance ?? 0);
    }

    return { balance, spinId: spin.id };
  });

  await audit({
    actorId: userId,
    action: "spin.completed",
    targetType: "spin",
    targetId: result.spinId,
    meta: { prize: picked.label, coins: picked.coins },
  });

  return {
    prize: {
      id: picked.id,
      label: picked.label,
      coins: picked.coins,
      weight: picked.weight,
      color: picked.color,
      rarity: picked.rarity,
    },
    index: prizes.findIndex((prize) => prize.id === picked.id),
    balance: result.balance,
    spinId: result.spinId,
  };
}
