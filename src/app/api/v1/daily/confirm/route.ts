import type { NextRequest } from "next/server";
import { jsonOk, route } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  await verifyPluginRequest(req);
  return jsonOk({ success: true, confirmed: true });
});
