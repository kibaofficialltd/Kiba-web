import "server-only";
import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { pluginNonces } from "@/db/schema";
import { constantTimeEqual, hmacSha256 } from "@/lib/crypto";
import { env } from "@/lib/env";
import { ApiError, clientIp } from "@/lib/api";

/**
 * Authenticates a request from KIBAOFFICIALCore.
 *
 * Headers:
 *   x-kiba-timestamp : unix seconds
 *   x-kiba-nonce     : unique per request
 *   x-kiba-signature : hex HMAC-SHA256(secret, `${timestamp}.${nonce}.${rawBody}`)
 *
 * Protections: shared secret, timestamp window, single-use nonce (replay
 * protection), optional IP allowlist.
 */
export async function verifyPluginRequest(
  req: NextRequest,
): Promise<{ body: unknown; raw: string; ip: string }> {
  if (!env.pluginSecret || env.pluginSecret.length < 32) {
    throw new ApiError(503, "PLUGIN_NOT_CONFIGURED", "Plugin bridge is not configured.");
  }

  const ip = clientIp(req);
  if (env.pluginIpAllowlist.length > 0 && !env.pluginIpAllowlist.includes(ip)) {
    throw new ApiError(403, "IP_NOT_ALLOWED", "Source IP is not allowlisted.");
  }

  const timestamp = req.headers.get("x-kiba-timestamp") ?? "";
  const nonce = req.headers.get("x-kiba-nonce") ?? "";
  const signature = req.headers.get("x-kiba-signature") ?? "";

  if (!timestamp || !nonce || !signature) {
    throw new ApiError(401, "SIGNATURE_MISSING", "Missing plugin authentication headers.");
  }

  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > env.pluginTolerance) {
    throw new ApiError(401, "STALE_REQUEST", "Request timestamp is outside the allowed window.");
  }

  const raw = await req.text();
  const expected1 = hmacSha256(env.pluginSecret, `${timestamp}.${nonce}.${raw}`);
  const expected2 = hmacSha256(env.pluginSecret, `${raw}:${timestamp}:${nonce}`);
  const expected3 = hmacSha256(env.pluginSecret, `${raw ? raw : ""}:${timestamp}:${nonce}`);
  const sig = signature.toLowerCase();
  if (
    !constantTimeEqual(expected1, sig) &&
    !constantTimeEqual(expected2, sig) &&
    !constantTimeEqual(expected3, sig)
  ) {
    throw new ApiError(401, "BAD_SIGNATURE", "Request signature is invalid.");
  }

  if (nonce.length < 8 || nonce.length > 128) {
    throw new ApiError(401, "BAD_NONCE", "Invalid nonce.");
  }
  const inserted = await db
    .insert(pluginNonces)
    .values({ nonce })
    .onConflictDoNothing()
    .returning({ nonce: pluginNonces.nonce });
  if (inserted.length === 0) {
    throw new ApiError(409, "REPLAY_DETECTED", "This request has already been processed.");
  }

  // Opportunistic cleanup keeps the nonce table small without a cron dependency.
  if (Math.random() < 0.05) {
    await db.execute(sql`DELETE FROM plugin_nonces WHERE created_at < now() - interval '1 hour'`);
  }

  let body: unknown = {};
  if (raw.trim()) {
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "INVALID_JSON", "Body must be valid JSON.");
    }
  }

  return { body, raw, ip };
}
