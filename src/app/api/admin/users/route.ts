import { getAdminUsers } from "@/lib/admin";
import { jsonOk, requireApiAdmin, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const admin = await requireApiAdmin();
  const users = await getAdminUsers(200);
  return jsonOk({ users });
});
