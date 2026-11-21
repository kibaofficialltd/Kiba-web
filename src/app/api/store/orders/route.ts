import { jsonOk, requireApiUser, route } from "@/lib/api";
import { getOrderHistory } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireApiUser();
  const orders = await getOrderHistory(user.id, 50);
  return jsonOk({ orders });
});
