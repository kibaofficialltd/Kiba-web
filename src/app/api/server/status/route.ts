import { jsonOk, route } from "@/lib/api";
import { getServerSnapshot } from "@/lib/server-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const snapshot = await getServerSnapshot();
  return jsonOk(snapshot);
});
