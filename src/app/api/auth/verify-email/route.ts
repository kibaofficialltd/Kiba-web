import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, clientIp, jsonOk, parseBody, route } from "@/lib/api";
import { consumeEmailToken } from "@/lib/tokens";
import { markEmailVerified } from "@/lib/accounts";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(10).max(200) });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const { token } = await parseBody(req, schema);
  const userId = await consumeEmailToken(token, "verify_email");
  await markEmailVerified(userId);
  await audit({ actorId: userId, action: "auth.email_verified", ip: clientIp(req) });
  return jsonOk({ verified: true });
});
