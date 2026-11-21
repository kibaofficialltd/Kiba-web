import { jsonOk, route, requireApiUser } from "@/lib/api";
import { getRewardState } from "@/lib/rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireApiUser();
  const state = await getRewardState(user.id);
  return jsonOk(state);
});
