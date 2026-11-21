import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyRewards,
  minecraftAccounts,
  rewardClaims,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import { adjustCoins, queueDelivery } from "@/lib/coins";
import { utcDate } from "@/lib/format";
import { audit } from "@/lib/audit";

export type RewardDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  coins: number;
  commands: string[];
  icon: string;
  enabled: boolean;
};

export type ClaimRecord = {
  id: string;
  dayNumber: number;
  streak: number;
  coins: number;
  status: "pending" | "delivered" | "failed";
  claimDate: string;
  createdAt: string;
  deliveredAt: string | null;
  error: string | null;
};

export type RewardState = {
  days: RewardDay[];
  claimedToday: boolean;
  currentStreak: number;
  nextDayNumber: number;
  nextClaimAt: string | null;
  lastClaim: ClaimRecord | null;
  history: ClaimRecord[];
  linked: boolean;
  today: string;
};

function serializeClaim(row: typeof rewardClaims.$inferSelect): ClaimRecord {
  return {
    id: row.id,
    dayNumber: row.dayNumber,
    streak: row.streak,
    coins: row.coins,
    status: row.status,
    claimDate: row.claimDate,
    createdAt: row.createdAt.toISOString(),
    deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : null,
    error: row.error,
  };
}

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextUtcMidnight(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );
}

export async function getRewardState(userId: string): Promise<RewardState> {
  const [days, historyRows, account, lastRows] = await Promise.all([
    db.select().from(dailyRewards).where(eq(dailyRewards.enabled, true)).orderBy(dailyRewards.dayNumber),
    db
      .select()
      .from(rewardClaims)
      .where(eq(rewardClaims.userId, userId))
      .orderBy(desc(rewardClaims.createdAt))
      .limit(20),
    db
      .select({ id: minecraftAccounts.id })
      .from(minecraftAccounts)
      .where(eq(minecraftAccounts.userId, userId))
      .limit(1),
    db
      .select()
      .from(rewardClaims)
      .where(and(eq(rewardClaims.userId, userId), eq(rewardClaims.claimDate, utcDate())))
      .limit(1),
  ]);

  const todayClaim = lastRows[0] ?? null;
  const last = historyRows.find((row) => row.status !== "failed") ?? null;

  let streak = 0;
  if (last) {
    if (last.claimDate === utcDate()) streak = last.streak;
    else if (last.claimDate === yesterdayUtc()) streak = last.streak;
    else streak = 0;
  }

  const claimedToday = Boolean(todayClaim);
  const nextStreak = claimedToday ? streak : last?.claimDate === yesterdayUtc() ? last.streak + 1 : 1;
  const cycleLength = Math.max(1, days.length);
  const nextDayNumber = days.length > 0 ? ((nextStreak - 1) % cycleLength) + 1 : 1;

  return {
    days: days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
      coins: day.coins,
      commands: day.commands,
      icon: day.icon,
      enabled: day.enabled,
    })),
    claimedToday,
    currentStreak: streak,
    nextDayNumber,
    nextClaimAt: claimedToday ? nextUtcMidnight().toISOString() : null,
    lastClaim: historyRows[0] ? serializeClaim(historyRows[0]) : null,
    history: historyRows.map(serializeClaim),
    linked: Boolean(account[0]),
    today: utcDate(),
  };
}

/**
 * Claims today's reward. Everything that matters happens inside one
 * transaction: eligibility, coin credit, ledger row and plugin delivery.
 */
export async function claimDailyReward(userId: string): Promise<{
  claim: ClaimRecord;
  balance: number;
  delivered: boolean;
}> {
  const accountRows = await db
    .select()
    .from(minecraftAccounts)
    .where(eq(minecraftAccounts.userId, userId))
    .limit(1);
  const account = accountRows[0];
  if (!account) {
    throw new ApiError(409, "MINECRAFT_NOT_LINKED", "Link your Minecraft account before claiming rewards.");
  }

  const state = await getRewardState(userId);
  if (state.days.length === 0) {
    throw new ApiError(503, "NO_REWARDS", "The reward calendar is not configured yet.");
  }
  if (state.claimedToday) {
    throw new ApiError(409, "ALREADY_CLAIMED", "You have already claimed today's reward.", {
      nextClaimAt: state.nextClaimAt,
    });
  }

  const day = state.days.find((item) => item.dayNumber === state.nextDayNumber) ?? state.days[0]!;
  const claimDate = utcDate();

  const result = await db.transaction(async (tx) => {
    // The unique index on (user_id, claim_date) is the final guard against
    // double-clicks or parallel requests.
    const inserted = await tx
      .insert(rewardClaims)
      .values({
        userId,
        dayNumber: day.dayNumber,
        streak: state.currentStreak + 1,
        claimDate,
        coins: day.coins,
        status: "pending",
      })
      .onConflictDoNothing()
      .returning();

    const claim = inserted[0];
    if (!claim) {
      throw new ApiError(409, "ALREADY_CLAIMED", "You have already claimed today's reward.");
    }

    let balance = 0;
    if (day.coins > 0) {
      balance = await adjustCoins(tx, userId, day.coins, "daily_reward", {
        refType: "reward_claim",
        refId: claim.id,
        note: `Day ${day.dayNumber} — ${day.title}`,
      });
    } else {
      const rows = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      balance = Number(rows[0]?.balance ?? 0);
    }

    let delivered = true;
    let status: "pending" | "delivered" = "delivered";

    if (day.commands.length > 0) {
      delivered = false;
      status = "pending";
      const deliveryId = await queueDelivery(tx, {
        kind: "daily_reward",
        minecraftUuid: account.uuid,
        minecraftUsername: account.username,
        commands: day.commands.map((command) =>
          command.replaceAll("{player}", account.username).replaceAll("{uuid}", account.uuid),
        ),
        idempotencyKey: `reward:${claim.id}`,
        payload: { claimId: claim.id, dayNumber: day.dayNumber },
      });

      await tx
        .update(rewardClaims)
        .set({ deliveryId, status: "pending" })
        .where(eq(rewardClaims.id, claim.id));

      return {
        claim: { ...serializeClaim(claim), status: "pending" as const },
        balance,
        delivered,
      };
    }

    await tx
      .update(rewardClaims)
      .set({ status, deliveredAt: new Date() })
      .where(eq(rewardClaims.id, claim.id));

    return {
      claim: { ...serializeClaim(claim), status: "delivered" as const, deliveredAt: new Date().toISOString() },
      balance,
      delivered,
    };
  });

  await audit({
    actorId: userId,
    action: "rewards.claimed",
    targetType: "reward_claim",
    targetId: result.claim.id,
    meta: { day: day.dayNumber, coins: day.coins },
  });

  return result;
}

export async function getClaimHistory(userId: string, limit = 20): Promise<ClaimRecord[]> {
  const rows = await db
    .select()
    .from(rewardClaims)
    .where(eq(rewardClaims.userId, userId))
    .orderBy(desc(rewardClaims.createdAt))
    .limit(limit);
  return rows.map(serializeClaim);
}
