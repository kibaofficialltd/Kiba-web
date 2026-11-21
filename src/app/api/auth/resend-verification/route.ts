import type { NextRequest } from "next/server";
import { ApiError, assertSameOrigin, clientIp, jsonOk, route } from "@/lib/api";
import { requireApiUser } from "@/lib/api";
import { createEmailToken } from "@/lib/tokens";
import { sendMail, verificationEmail } from "@/lib/mail";
import { enforceRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  if (user.emailVerifiedAt) return jsonOk({ alreadyVerified: true });

  await enforceRateLimit(`verify:resend:${user.id}`, 3, 3600, "Verification email already sent. Check your inbox.");

  const token = await createEmailToken(user.id, "verify_email", 24);
  const url = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const result = await sendMail({
    to: user.email,
    subject: "Verify your KIBAOFFICIAL SMP account",
    text: verificationEmail(user.username, url),
  });

  if (!result.delivered && env.isProd) {
    throw new ApiError(503, "MAIL_UNAVAILABLE", "Email delivery is temporarily unavailable.");
  }

  return jsonOk({
    sent: true,
    devVerifyUrl: !result.delivered && !env.isProd ? url : undefined,
  });
});
