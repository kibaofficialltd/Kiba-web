import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  clientIp,
  jsonOk,
  parseBody,
  requireApiAdmin,
  route,
} from "@/lib/api";
import { adjustCoins } from "@/lib/coins";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  role: z.enum(["player", "helper", "moderator", "admin", "owner"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  coinDelta: z.number().int().min(-1_000_000).max(1_000_000).optional(),
  note: z.string().trim().max(300).optional(),
});

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);

  if (id === admin.id && body.status === "suspended") {
    throw new ApiError(400, "SELF_SUSPEND", "You cannot suspend your own account.");
  }

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) throw new ApiError(404, "USER_NOT_FOUND", "Player not found.");

  // Only an owner can mint admins or owners; admins cannot touch an owner.
  if ((body.role === "admin" || body.role === "owner") && admin.role !== "owner") {
    throw new ApiError(403, "OWNER_REQUIRED", "Only the owner can assign admin or owner roles.");
  }
  if (target.role === "owner" && admin.role !== "owner") {
    throw new ApiError(403, "OWNER_PROTECTED", "Only the owner can modify an owner account.");
  }
  if (id === admin.id && body.role && body.role !== admin.role) {
    throw new ApiError(400, "SELF_ROLE", "You cannot change your own role.");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.role) patch.role = body.role;
  if (body.status) patch.status = body.status;

  if (Object.keys(patch).length > 1) {
    await db.update(users).set(patch).where(eq(users.id, id));
  }

  let balance: number | null = null;
  if (body.coinDelta && body.coinDelta !== 0) {
    balance = await db.transaction(async (tx) =>
      adjustCoins(tx, id, body.coinDelta!, body.coinDelta! > 0 ? "admin_grant" : "adjustment", {
        refType: "admin",
        refId: admin.id,
        note: body.note || `Adjusted by ${admin.username}`,
      }),
    );
  }

  await audit({
    actorId: admin.id,
    action: "admin.user_updated",
    targetType: "user",
    targetId: id,
    meta: {
      role: body.role,
      status: body.status,
      coinDelta: body.coinDelta,
      note: body.note,
      ip: clientIp(req),
    },
  });

  return jsonOk({ updated: true, balance });
});
