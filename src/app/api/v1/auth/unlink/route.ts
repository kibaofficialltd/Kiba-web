import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { minecraftAccounts } from "@/db/schema";
import { jsonOk, route, ApiError } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  const { body } = await verifyPluginRequest(req);
  const data = (body ?? {}) as { playerUuid?: string; uuid?: string };
  const uuid = (data.playerUuid ?? data.uuid ?? "").toLowerCase().trim();

  if (!uuid) {
    throw new ApiError(422, "VALIDATION_ERROR", "Missing playerUuid.");
  }

  await db.delete(minecraftAccounts).where(eq(minecraftAccounts.uuid, uuid));

  return jsonOk({ success: true, unlinked: true });
});
