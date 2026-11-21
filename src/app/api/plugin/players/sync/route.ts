import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { minecraftAccounts } from "@/db/schema";
import { jsonOk, route, ApiError } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";
import { pluginStatsSchema } from "@/lib/validation";
import { upsertPlayerStats } from "@/lib/minecraft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  const { body } = await verifyPluginRequest(req);
  const parsed = pluginStatsSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid stats payload.", parsed.error.issues);
  }

  await db.transaction(async (tx) => {
    for (const player of parsed.data.players) {
      await upsertPlayerStats({
        ...player,
        uuid: player.uuid.toLowerCase(),
        lastSeenAt: player.lastSeenAt ? new Date(player.lastSeenAt) : new Date(),
      });
      await tx
        .update(minecraftAccounts)
        .set({ lastSeenAt: new Date(), username: player.username })
        .where(eq(minecraftAccounts.uuid, player.uuid.toLowerCase()));
    }
  });

  return jsonOk({ synced: parsed.data.players.length });
});

export const GET = route(async (req: NextRequest) => {
  await verifyPluginRequest(req);
  const query = new URL(req.url).searchParams;
  const uuid = (query.get("uuid") ?? "").toLowerCase();
  if (!uuid) throw new ApiError(400, "UUID_REQUIRED", "Pass ?uuid=");

  const rows = await db
    .select({ username: minecraftAccounts.username })
    .from(minecraftAccounts)
    .where(eq(minecraftAccounts.uuid, uuid))
    .limit(1);

  return jsonOk({ linked: Boolean(rows[0]), username: rows[0]?.username ?? null });
});
