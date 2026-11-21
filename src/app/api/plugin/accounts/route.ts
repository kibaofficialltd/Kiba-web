import type { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { minecraftAccounts, users } from "@/db/schema";
import { ApiError, jsonOk, route } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  uuids: z.array(z.string().min(16).max(40)).max(100).optional(),
  usernames: z.array(z.string().min(3).max(16)).max(100).optional(),
});

/**
 * Lets the server read the website-authoritative coin balance for online
 * players. The website ledger is the single source of truth.
 *
 * Note: verifyPluginRequest consumes the raw body to verify the signature, so
 * the parsed JSON comes from its decoded payload — never from req.json() again.
 */
export const POST = route(async (req: NextRequest) => {
  const { body } = await verifyPluginRequest(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new ApiError(422, "VALIDATION_ERROR", message);
  }
  const data = parsed.data;
  const uuids = (data.uuids ?? []).map((u) => u.toLowerCase());
  const usernames = (data.usernames ?? []).map((u) => u.toLowerCase());

  if (uuids.length === 0 && usernames.length === 0) {
    return jsonOk({ accounts: [] });
  }

  const rows = await db
    .select({
      uuid: minecraftAccounts.uuid,
      username: minecraftAccounts.username,
      edition: minecraftAccounts.edition,
      balance: users.balance,
      websiteUsername: users.username,
    })
    .from(minecraftAccounts)
    .innerJoin(users, eq(users.id, minecraftAccounts.userId))
    .where(
      uuids.length > 0
        ? inArray(minecraftAccounts.uuid, uuids)
        : inArray(minecraftAccounts.username, data.usernames ?? []),
    )
    .limit(200);

  return jsonOk({ accounts: rows });
});
