import type { NextRequest } from "next/server";
import { assertSameOrigin, clientIp, jsonOk, route, requireApiUser } from "@/lib/api";
import { requireVerifiedEmail } from "@/lib/guards";
import { issueLinkCode, latestLinkCode, getLinkedAccount } from "@/lib/minecraft";
import { enforceRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireApiUser();
  const [account, pending] = await Promise.all([getLinkedAccount(user.id), latestLinkCode(user.id)]);

  return jsonOk({
    linked: Boolean(account),
    account,
    pendingCode:
      pending && pending.expiresAt > new Date()
        ? { code: pending.code, expiresAt: pending.expiresAt.toISOString() }
        : null,
  });
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await requireVerifiedEmail(user.id);
  await enforceRateLimit(`link:start:${user.id}`, 6, 3600, "Too many link codes requested. Try again later.");

  const existing = await getLinkedAccount(user.id);
  if (existing) {
    return jsonOk({ linked: true, account: existing });
  }

  const { code, expiresAt } = await issueLinkCode(user.id, 15);
  await audit({
    actorId: user.id,
    action: "minecraft.link_code_issued",
    ip: clientIp(req),
  });

  return jsonOk({ code, expiresAt: expiresAt.toISOString() });
});
