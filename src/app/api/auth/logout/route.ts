import type { NextRequest } from "next/server";
import { assertSameOrigin, clientIp, jsonOk, route } from "@/lib/api";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await audit({ actorId: user.id, action: "auth.logout", ip: clientIp(req) });
  }
  return jsonOk({ signedOut: true });
});
