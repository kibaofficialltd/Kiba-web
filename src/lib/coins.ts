import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { coinTransactions, deliveries, transactionReason, users } from "@/db/schema";
import { ApiError } from "@/lib/api";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = Tx | typeof db;

/**
 * Atomically adjusts a user's coin balance and writes a ledger row.
 * The UPDATE is guarded so a debit can never take a balance below zero, even
 * under concurrent checkouts.
 */
export async function adjustCoins(
  tx: DbExecutor,
  userId: string,
  delta: number,
  reason: (typeof transactionReason.enumValues)[number],
  opts: { refType?: string; refId?: string; note?: string } = {},
): Promise<number> {
  if (!Number.isInteger(delta)) {
    throw new ApiError(400, "INVALID_AMOUNT", "Coin amount must be a whole number.");
  }

  const updated = await tx
    .update(users)
    .set({ balance: sql`${users.balance} + ${delta}`, updatedAt: new Date() })
    .where(delta < 0 ? sql`${users.id} = ${userId} AND ${users.balance} + ${delta} >= 0` : sql`${users.id} = ${userId}`)
    .returning({ balance: users.balance });

  const row = updated[0];
  if (!row) {
    throw new ApiError(402, "INSUFFICIENT_COINS", "You do not have enough coins for this purchase.");
  }

  await tx.insert(coinTransactions).values({
    userId,
    delta,
    balanceAfter: row.balance,
    reason,
    refType: opts.refType ?? null,
    refId: opts.refId ?? null,
    note: opts.note ?? null,
  });

  return row.balance;
}

export type DeliveryInput = {
  kind: string;
  minecraftUuid: string | null;
  minecraftUsername: string | null;
  commands: string[];
  idempotencyKey: string;
  payload?: Record<string, unknown>;
};

/** Queues a command bundle for KIBAOFFICIALCore to pull. Idempotent by key. */
export async function queueDelivery(tx: DbExecutor, input: DeliveryInput): Promise<string | null> {
  const inserted = await tx
    .insert(deliveries)
    .values({
      kind: input.kind,
      minecraftUuid: input.minecraftUuid,
      minecraftUsername: input.minecraftUsername,
      commands: input.commands,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload ?? null,
    })
    .onConflictDoNothing({ target: deliveries.idempotencyKey })
    .returning({ id: deliveries.id });

  return inserted[0]?.id ?? null;
}
