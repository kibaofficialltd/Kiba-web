import type { NextRequest } from "next/server";
import { getAdminTickets } from "@/lib/admin";
import { jsonOk, requireApiAdmin, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const admin = await requireApiAdmin();
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  const tickets = await getAdminTickets(status ?? undefined);
  return jsonOk({ tickets });
});
