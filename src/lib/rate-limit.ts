import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ApiError } from "@/lib/api";

/**
 * Fixed-window rate limiting backed by Postgres so it survives across
 * serverless instances. Keys look like `login:1.2.3.4`.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const rows = await db.execute<{ count: number; window_start: Date }>(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - (${windowSeconds} || ' seconds')::interval THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - (${windowSeconds} || ' seconds')::interval THEN now()
        ELSE rate_limits.window_start
      END
    RETURNING count, window_start
  `);

  const row = rows.rows[0];
  const count = Number(row?.count ?? 1);
  const started = row?.window_start ? new Date(row.window_start).getTime() : Date.now();
  const retryAfter = Math.max(0, Math.ceil((started + windowSeconds * 1000 - Date.now()) / 1000));
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  message = "Too many attempts. Please wait a moment.",
): Promise<void> {
  const result = await consumeRateLimit(key, limit, windowSeconds);
  if (!result.allowed) {
    throw new ApiError(429, "RATE_LIMITED", message, { retryAfter: result.retryAfter });
  }
}
