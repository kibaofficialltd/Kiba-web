import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, assertSameOrigin, clientIp, jsonOk, parseBody, route } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { createEmailToken } from "@/lib/tokens";
import { createUser, emailExists, usernameExists } from "@/lib/accounts";
import { registerSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendMail, verificationEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(`register:ip:${ip}`, 6, 3600, "Too many accounts created from this network.");

  const body = await parseBody(req, registerSchema);

  if (await emailExists(body.email)) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.", {
      email: "An account with this email already exists.",
    });
  }
  if (await usernameExists(body.username)) {
    throw new ApiError(409, "USERNAME_TAKEN", "That username is taken.", {
      username: "That username is taken.",
    });
  }

  const user = await createUser({
    email: body.email,
    username: body.username,
    password: body.password,
  });

  const token = await createEmailToken(user.id, "verify_email", 24);
  const verifyUrl = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const mail = await sendMail({
    to: user.email,
    subject: "Verify your KIBAOFFICIAL SMP account",
    text: verificationEmail(user.username, verifyUrl),
  });

  await createSession(user.id, {
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  await audit({
    actorId: user.id,
    action: "auth.register",
    targetType: "user",
    targetId: user.id,
    ip,
  });

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  return jsonOk({
    redirect: "/dashboard",
    emailSent: mail.delivered,
    // Development convenience only: never exposed in production builds.
    devVerifyUrl: !mail.delivered && !env.isProd ? verifyUrl : undefined,
  });
});
