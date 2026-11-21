export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(value || 0));
}

export function formatCoins(value: number): string {
  return formatNumber(value);
}

export function formatPlaytime(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.max(0, Math.floor(seconds))}s`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(date) + " UTC";
}

export function relativeTime(value: Date | string | null | undefined): string {
  if (!value) return "never";
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [86_400_000 * 365, "year"],
    [86_400_000 * 30, "month"],
    [86_400_000 * 7, "week"],
    [86_400_000, "day"],
    [3_600_000, "hour"],
    [60_000, "minute"],
    [1_000, "second"],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [ms, unit] of units) {
    if (abs >= ms) return formatter.format(Math.round(-diff / ms), unit);
  }
  return "just now";
}

export function daysUntil(value: Date | string): number {
  const date = typeof value === "string" ? new Date(value) : value;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

/** UTC calendar date (YYYY-MM-DD) — reward/spin cooldowns use a single timezone. */
export function utcDate(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const tomorrow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
  );
  return Math.max(0, Math.floor((tomorrow - now.getTime()) / 1000));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

export function initials(name: string): string {
  return name
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
