/**
 * Brand constants shared by server and client components.
 * Values are public by design; nothing secret belongs here.
 */
export const site = {
  name: "KIBAOFFICIAL",
  suffix: "SMP",
  tagline: "YOUR ADVENTURE. YOUR LEGACY.",
  description:
    "Explore, survive, build your empire and become a legend in KIBAOFFICIAL SMP — a cross-platform Minecraft survival network for Java, Bedrock and cracked players.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  server: {
    host: process.env.NEXT_PUBLIC_SERVER_HOST ?? "sg-sgp07.altare.global",
    port: Number(process.env.NEXT_PUBLIC_SERVER_PORT ?? 25449),
    bedrockPort: Number(process.env.NEXT_PUBLIC_SERVER_BEDROCK_PORT ?? 25449),
    version: process.env.NEXT_PUBLIC_SERVER_VERSION ?? "Java 1.16 - 26.x · Bedrock 1.21.x",
  },
  socials: {
    discord: process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/UFFn3hmBCF",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://chat.whatsapp.com/CL77NhYJRAj0if3WsgViDP?s=cl&p=a&mlu=4&ilr=4&iam=2",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/kiba_official_ig?rpxt=bjA4NnRvZGE4OXZ4",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://youtube.com/@kiba_official_yt?si=q694OfjU-Ik3OGPT",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/store", label: "Store" },
    { href: "/guide", label: "Guide" },
    { href: "/leaderboards", label: "Leaderboards" },
    { href: "/community", label: "Community" },
    { href: "/events", label: "Events" },
    { href: "/rules", label: "Rules" },
    { href: "/support", label: "Support" },
  ],
} as const;

export const serverAddress = `${site.server.host}:${site.server.port}`;
export const bedrockAddress = `${site.server.host}:${site.server.bedrockPort}`;
