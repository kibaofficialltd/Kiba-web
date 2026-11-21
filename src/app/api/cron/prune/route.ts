import type { NextRequest } from "next/server";
import { jsonOk, route } from "@/lib/api";
import { constantTimeEqual } from "@/lib/crypto";
import { env } from "@/lib/env";
import { pruneExpired } from "@/lib/settings";
import { ApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  if (!env.cronSecret) {
    throw new ApiError(503, "CRON_DISABLED", "Set CRON_SECRET to enable the housekeeping endpoint.");
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !constantTimeEqual(token, env.cronSecret)) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid cron credentials.");
  }

  await pruneExpired();
  return jsonOk({ pruned: true, at: new Date().toISOString() });
});
