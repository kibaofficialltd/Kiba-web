import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

const DEFAULTS = {
  dailyRewardsEnabled: true,
  spinEnabled: true,
  storeEnabled: true,
  storeMinAccountAgeMinutes: 0,
  maintenanceMessage: "",
} as const;

export type SettingKey = keyof typeof DEFAULTS;

export async function getSetting<K extends SettingKey>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (!rows[0]) return DEFAULTS[key];
  return rows[0].value as (typeof DEFAULTS)[K];
}

export async function getSettings(): Promise<Record<SettingKey, unknown>> {
  const rows = await db.select().from(settings);
  const merged: Record<string, unknown> = { ...DEFAULTS };
  for (const row of rows) merged[row.key] = row.value;
  return merged;
}

export async function setSetting(key: SettingKey, value: unknown): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export const settingDefaults = DEFAULTS;

/** Housekeeping: prune expired sessions, tokens, nonces and rate windows. */
export async function pruneExpired(): Promise<void> {
  await db.execute(sql`
    DELETE FROM sessions WHERE expires_at < now();
    DELETE FROM email_tokens WHERE expires_at < now() - interval '1 day';
    DELETE FROM link_codes WHERE expires_at < now() - interval '1 day';
    DELETE FROM plugin_nonces WHERE created_at < now() - interval '1 hour';
    DELETE FROM rate_limits WHERE window_start < now() - interval '1 day';
  `);
}

export { and, eq, sql };
