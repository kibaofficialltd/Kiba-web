import type { NextRequest } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { ApiError, assertSameOrigin, clientIp, jsonOk, parseBody, route, requireApiUser } from "@/lib/api";
import { verifyPassword, hashPassword, sha256 } from "@/lib/crypto";
import { changePasswordSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const body = await parseBody(req, changePasswordSchema);

  const rows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const current = rows[0];
  if (!current || !(await verifyPassword(body.currentPassword, current.passwordHash))) {
    throw new ApiError(400, "WRONG_PASSWORD", "Your current password is incorrect.", {
      currentPassword: "Incorrect password.",
    });
  }

  const passwordHash = await hashPassword(body.newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));

  // Keep this device signed in, revoke all other sessions.
  const jar = await cookies();
  const token = jar.get(env.session.cookie)?.value;
  if (token) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, user.id), ne(sessions.tokenHash, sha256(token))));
  }

  await audit({ actorId: user.id, action: "auth.password_changed", ip: clientIp(req) });
  return jsonOk({ changed: true });
});
