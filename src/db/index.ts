import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and start PostgreSQL.",
  );
}

/**
 * A single pool per process. Next.js hot-reloads modules in development, so we
 * cache the pool on globalThis to avoid exhausting Postgres connections.
 */
const globalForDb = globalThis as unknown as {
  __kibaPool?: Pool;
};

const pool =
  globalForDb.__kibaPool ??
  new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

/**
 * The host is memory-constrained and Postgres may be briefly restarted by the
 * OOM killer / watchdog. Retry transient connection failures instead of
 * surfacing them as 500s to users.
 */
const RETRYABLE = (err: unknown): boolean => {
  const msg = String((err as { message?: string })?.message ?? err);
  return /terminat|connection|ECONNREFUSED|timeout|reset|closed/i.test(msg);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const originalQuery = pool.query.bind(pool);
const originalConnect = pool.connect.bind(pool);

pool.query = (async (...args: unknown[]) => {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await (originalQuery as (...a: unknown[]) => Promise<unknown>)(...args);
    } catch (err) {
      lastErr = err;
      if (attempt === 2 || !RETRYABLE(err)) throw err;
      await sleep(250 * (attempt + 1));
    }
  }
  throw lastErr;
}) as typeof pool.query;

pool.connect = (async (...args: unknown[]) => {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await (originalConnect as (...a: unknown[]) => Promise<unknown>)(...args);
    } catch (err) {
      lastErr = err;
      if (attempt === 2 || !RETRYABLE(err)) throw err;
      await sleep(250 * (attempt + 1));
    }
  }
  throw lastErr;
}) as typeof pool.connect;

// Swallow idle-client errors so a dropped connection doesn't crash the process.
pool.on("error", (err) => {
  console.error("[db] idle client error:", err?.message ?? err);
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.__kibaPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool, schema };

/** Run a set of statements inside a single transaction. */
export async function transaction<T>(
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}
