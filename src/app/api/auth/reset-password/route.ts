import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { assertSameOrigin, clientIp, jsonOk, parseBody, route } from "@/lib/api";
import { consumeEmailToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/crypto";
import { resetPasswordSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const body = await parseBody(req, resetPasswordSchema);
  const userId = await consumeEmailToken(body.token, "reset_password");

  const passwordHash = await hashPassword(body.password);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Invalidate every existing session after a credential change.
  await db.delete(sessions).where(eq(sessions.userId, userId));

  await audit({ actorId: userId, action: "auth.password_reset", ip: clientIp(req) });
  return jsonOk({ reset: true, redirect: "/login" });
});
