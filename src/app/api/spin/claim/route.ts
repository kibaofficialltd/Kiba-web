import type { NextRequest } from "next/server";
import { assertSameOrigin, jsonOk, requireApiUser, route } from "@/lib/api";
import { requireVerifiedEmail } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { performSpin } from "@/lib/spin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await requireVerifiedEmail(user.id);
  await enforceRateLimit(`spin:${user.id}`, 10, 3600, "Too many spin attempts.");

  const result = await performSpin(user.id);
  return jsonOk(result);
});
