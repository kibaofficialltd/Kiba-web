import { jsonOk, route, requireApiUser } from "@/lib/api";
import { getSpinState } from "@/lib/spin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireApiUser();
  return jsonOk(await getSpinState(user.id));
});
