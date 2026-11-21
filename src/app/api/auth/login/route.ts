import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { assertSameOrigin, clientIp, jsonOk, parseBody, route } from "@/lib/api";
import { createSession, isStaff } from "@/lib/auth";
import { authenticate } from "@/lib/accounts";
import { loginSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const body = await parseBody(req, loginSchema);

  await enforceRateLimit(`login:ip:${ip}`, 20, 600, "Too many sign-in attempts. Try again shortly.");
  await enforceRateLimit(
    `login:id:${body.identifier.toLowerCase()}`,
    8,
    600,
    "Too many sign-in attempts for this account.",
  );

  const user = await authenticate(body.identifier, body.password);

  await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  await audit({ actorId: user.id, action: "auth.login", ip });

  return jsonOk({
    redirect: isStaff(user.role) ? "/admin" : "/dashboard",
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  });
});
