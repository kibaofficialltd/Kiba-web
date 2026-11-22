const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  isProd: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  pluginSecret: process.env.PLUGIN_SHARED_SECRET ?? "",
  pluginTolerance: Number(process.env.PLUGIN_TIMESTAMP_TOLERANCE ?? 300),
  pluginIpAllowlist: (process.env.PLUGIN_IP_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "KIBAOFFICIAL SMP <no-reply@kibaofficial.fun>",
  },
  server: {
    host: process.env.NEXT_PUBLIC_SERVER_HOST ?? "sg-sgp07.altare.global",
    port: Number(process.env.NEXT_PUBLIC_SERVER_PORT ?? 25449),
    bedrockPort: Number(process.env.NEXT_PUBLIC_SERVER_BEDROCK_PORT ?? 25449),
    version: process.env.NEXT_PUBLIC_SERVER_VERSION ?? "Java 1.16 - 26.x · Bedrock 1.21.x",
  },
  session: {
    cookie: process.env.SESSION_COOKIE_NAME ?? "kiba_session",
    days: Number(process.env.SESSION_DAYS ?? 30),
  },
  cronSecret: process.env.CRON_SECRET ?? "",
};

export const isSecureOrigin = env.isProd || env.appUrl.startsWith("https://");
