import type { NextRequest } from "next/server";
import { jsonOk, route, requireApiUser } from "@/lib/api";
import { getClaimHistory } from "@/lib/rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const user = await requireApiUser();
  const limit = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 20)));
  const history = await getClaimHistory(user.id, limit);
  return jsonOk({ history });
});
