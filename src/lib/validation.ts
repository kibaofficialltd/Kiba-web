import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(20, "Username must be 20 characters or fewer.")
  .regex(/^[A-Za-z0-9_]+$/, "Only letters, numbers and underscores are allowed.");

export const minecraftNameSchema = z
  .string()
  .trim()
  .min(3, "Minecraft username must be at least 3 characters.")
  .max(16, "Minecraft usernames are at most 16 characters.")
  .regex(/^[A-Za-z0-9_]+$/, "Invalid Minecraft username.");

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Password is too long.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: z.email("Enter a valid email address.").max(160),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptRules: z.literal(true, { message: "You must accept the server rules." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username.").max(160),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const linkStartSchema = z.object({
  minecraftName: minecraftNameSchema,
  edition: z.enum(["java", "bedrock"]),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid("Invalid product."),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(20),
});

export const ticketSchema = z.object({
  category: z.enum(["general", "bug", "purchase", "player_report", "ban_appeal", "other"]),
  subject: z.string().trim().min(6, "Add a short subject.").max(140),
  message: z.string().trim().min(30, "Please give us at least 30 characters of detail.").max(6000),
  serverName: z.string().trim().max(16).optional(),
});

export const ticketReplySchema = z.object({
  message: z.string().trim().min(2).max(6000),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(4).max(160),
  slug: z.string().trim().min(3).max(80).optional(),
  excerpt: z.string().trim().max(300).default(""),
  body: z.string().trim().min(1).max(40000),
  category: z.enum(["update", "feature", "maintenance", "event", "giveaway", "notice"]),
  coverImage: z.string().trim().max(400).optional().or(z.literal("")),
  pinned: z.boolean().default(false),
  published: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  categoryId: z.uuid().nullable().optional(),
  tagline: z.string().trim().max(160).default(""),
  description: z.string().trim().max(8000).default(""),
  priceCoins: z.number().int().min(1).max(100_000_000),
  compareAtCoins: z.number().int().min(0).max(100_000_000).nullable().optional(),
  badge: z.string().trim().max(30).optional().or(z.literal("")),
  commands: z.array(z.string().max(300)).max(20).default([]),
  perPlayerLimit: z.number().int().min(1).max(100).nullable().optional(),
  stock: z.number().int().min(0).max(1_000_000).nullable().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  image: z.string().trim().max(400).optional().or(z.literal("")),
});

export const eventSchema = z.object({
  title: z.string().trim().min(4).max(160),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(8000).default(""),
  type: z.enum(["event", "giveaway"]).default("event"),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).default("upcoming"),
  startsAt: z.string().min(10),
  endsAt: z.string().optional().or(z.literal("")),
  registrationOpen: z.boolean().default(true),
  prize: z.string().trim().max(300).optional().or(z.literal("")),
  winner: z.string().trim().max(64).optional().or(z.literal("")),
});

export const coinGrantSchema = z.object({
  userId: z.uuid(),
  amount: z.number().int().min(-1_000_000).max(1_000_000),
  note: z.string().trim().min(3).max(200),
});

export const rewardDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(31),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
  coins: z.number().int().min(0).max(1_000_000),
  commands: z.array(z.string().max(300)).max(20).default([]),
  enabled: z.boolean().default(true),
});

export const spinPrizeSchema = z.object({
  label: z.string().trim().min(1).max(60),
  coins: z.number().int().min(0).max(1_000_000),
  weight: z.number().int().min(1).max(1000),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]).default("common"),
  enabled: z.boolean().default(true),
});

export const profileSettingsSchema = z.object({
  username: usernameSchema,
});

/* --- Plugin-facing payloads ------------------------------------------ */

export const pluginLinkVerifySchema = z.object({
  code: z.string().trim().min(4).max(16),
  username: minecraftNameSchema,
  uuid: z.string().trim().min(16).max(40),
  edition: z.enum(["java", "bedrock"]),
  xuid: z.string().trim().max(64).optional(),
});

export const pluginHeartbeatSchema = z.object({
  online: z.boolean(),
  motd: z.string().max(300).optional(),
  version: z.string().max(80).optional(),
  playersOnline: z.number().int().min(0).max(100000),
  maxPlayers: z.number().int().min(0).max(100000),
  javaPlayers: z.number().int().min(0).max(100000).default(0),
  bedrockPlayers: z.number().int().min(0).max(100000).default(0),
  uptimeSeconds: z.number().int().min(0).default(0),
  tps: z.string().max(30).optional(),
  host: z.string().max(120).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  players: z
    .array(
      z.object({
        uuid: z.string().min(16).max(40),
        username: minecraftNameSchema,
        edition: z.enum(["java", "bedrock"]).default("java"),
      }),
    )
    .max(500)
    .optional(),
});

export const pluginStatsSchema = z.object({
  players: z
    .array(
      z.object({
        uuid: z.string().min(16).max(40),
        username: minecraftNameSchema,
        rank: z.string().max(40).default("Member"),
        playtimeSeconds: z.number().int().min(0).default(0),
        kills: z.number().int().min(0).default(0),
        deaths: z.number().int().min(0).default(0),
        mobKills: z.number().int().min(0).default(0),
        killstreak: z.number().int().min(0).default(0),
        bestKillstreak: z.number().int().min(0).default(0),
        wins: z.number().int().min(0).default(0),
        losses: z.number().int().min(0).default(0),
        blocksBroken: z.number().int().min(0).default(0),
        blocksPlaced: z.number().int().min(0).default(0),
        lastSeenAt: z.string().datetime().optional(),
      }),
    )
    .max(500),
});

export const pluginDeliveryResultSchema = z.object({
  deliveryId: z.uuid(),
  success: z.boolean(),
  error: z.string().max(500).optional(),
});
