import type { NextRequest } from "next/server";
import { clientIp, jsonOk, parseBody, route, assertSameOrigin } from "@/lib/api";
import { findUserByIdentifier } from "@/lib/accounts";
import { createEmailToken } from "@/lib/tokens";
import { sendMail, resetEmail } from "@/lib/mail";
import { enforceRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const { email } = await parseBody(req, forgotPasswordSchema);

  await enforceRateLimit(`pwreset:ip:${ip}`, 5, 3600, "Too many reset requests. Try again later.");
  await enforceRateLimit(`pwreset:email:${email.toLowerCase()}`, 3, 3600, "A reset link was already sent.");

  const user = await findUserByIdentifier(email);
  let devResetUrl: string | undefined;

  if (user) {
    const token = await createEmailToken(user.id, "reset_password", 1);
    const url = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const result = await sendMail({
      to: user.email,
      subject: "Reset your KIBAOFFICIAL SMP password",
      text: resetEmail(user.username, url),
    });
    if (!result.delivered && !env.isProd) devResetUrl = url;
  }

  // Always report success so the endpoint cannot be used to enumerate accounts.
  return jsonOk({ sent: true, devResetUrl });
});
