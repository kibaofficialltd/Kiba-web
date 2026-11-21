import { getAuditLog } from "@/lib/admin";
import { jsonOk, requireApiAdmin, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const admin = await requireApiAdmin();
  const entries = await getAuditLog(200);
  return jsonOk({ entries });
});
