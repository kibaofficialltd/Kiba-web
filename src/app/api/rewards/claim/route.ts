import type { NextRequest } from "next/server";
import { assertSameOrigin, jsonOk, requireApiUser, route, clientIp } from "@/lib/api";
import { requireVerifiedEmail } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { claimDailyReward } from "@/lib/rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await requireVerifiedEmail(user.id);
  await enforceRateLimit(`rewards:claim:${user.id}`, 8, 3600, "Too many claim attempts.");
  void clientIp(req);

  const result = await claimDailyReward(user.id);
  return jsonOk(result);
});
