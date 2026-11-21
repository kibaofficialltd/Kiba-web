import { getAdminOverview } from "@/lib/admin";
import { jsonOk, requireApiAdmin, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const admin = await requireApiAdmin();
  const overview = await getAdminOverview();
  return jsonOk({ overview });
});
