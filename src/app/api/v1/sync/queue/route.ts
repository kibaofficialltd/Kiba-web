import type { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { jsonOk, route } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleQueue(req: NextRequest) {
  await verifyPluginRequest(req);

  const result = await db.execute<{
    id: string;
    kind: string;
    minecraft_uuid: string | null;
    minecraft_username: string | null;
    commands: string[];
    payload: Record<string, unknown> | null;
    attempts: number;
  }>(sql`
    UPDATE deliveries
    SET status = 'claimed', attempts = attempts + 1, claimed_at = now()
    WHERE id IN (
      SELECT id FROM deliveries
      WHERE status = 'queued'
         OR (status = 'claimed' AND claimed_at < now() - interval '2 minutes')
      ORDER BY created_at ASC
      LIMIT 25
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, kind, minecraft_uuid, minecraft_username, commands, payload, attempts
  `);

  const queue = result.rows.map((row) => {
    const isDaily = row.kind === "daily_reward" || row.kind === "daily";
    if (isDaily) {
      return {
        type: "DAILY_CLAIM",
        transactionId: row.id,
        playerUuid: row.minecraft_uuid ?? "",
        category: (row.payload?.category as string) || "daily",
      };
    }

    return {
      type: "PURCHASE",
      transactionId: row.id,
      playerUuid: row.minecraft_uuid ?? "",
      category: (row.payload?.category as string) || "store",
      itemId: (row.payload?.itemId as string) || (row.payload?.slug as string) || "item",
      quantity: Number(row.payload?.quantity) || 1,
      amount: Number(row.payload?.coins) || 0,
      currency: "COINS",
    };
  });

  return jsonOk({
    success: true,
    queue,
  });
}

export const GET = route(handleQueue);
export const POST = route(handleQueue);
