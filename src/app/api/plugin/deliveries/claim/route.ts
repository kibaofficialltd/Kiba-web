import type { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { jsonOk, route } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Atomically leases queued deliveries to the plugin.
 * SKIP LOCKED makes this safe with multiple server instances, and stale leases
 * are reclaimed after two minutes so a crashed server cannot strand rewards.
 */
export const POST = route(async (req: NextRequest) => {
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

  return jsonOk({
    deliveries: result.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      minecraftUuid: row.minecraft_uuid,
      minecraftUsername: row.minecraft_username,
      commands: row.commands ?? [],
      payload: row.payload ?? {},
      attempt: Number(row.attempts ?? 1),
    })),
    count: result.rows.length,
  });
});
