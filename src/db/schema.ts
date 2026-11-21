import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", [
  "player",
  "helper",
  "moderator",
  "admin",
  "owner",
]);

export const userStatus = pgEnum("user_status", ["active", "suspended"]);
export const edition = pgEnum("edition", ["java", "bedrock"]);
export const claimStatus = pgEnum("claim_status", ["pending", "delivered", "failed"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "processing",
  "delivered",
  "failed",
  "refunded",
  "cancelled",
]);
export const deliveryStatus = pgEnum("delivery_status", [
  "queued",
  "claimed",
  "delivered",
  "failed",
  "cancelled",
]);
export const ticketStatus = pgEnum("ticket_status", [
  "open",
  "pending",
  "resolved",
  "closed",
]);
export const ticketPriority = pgEnum("ticket_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);
export const announcementCategory = pgEnum("announcement_category", [
  "update",
  "feature",
  "maintenance",
  "event",
  "giveaway",
  "notice",
]);
export const eventType = pgEnum("event_type", ["event", "giveaway"]);
export const eventStatus = pgEnum("event_status", [
  "upcoming",
  "active",
  "completed",
  "cancelled",
]);
export const notificationType = pgEnum("notification_type", [
  "system",
  "reward",
  "purchase",
  "event",
  "ticket",
]);
export const transactionReason = pgEnum("transaction_reason", [
  "daily_reward",
  "spin",
  "purchase",
  "admin_grant",
  "refund",
  "event",
  "adjustment",
]);
export const emailTokenType = pgEnum("email_token_type", [
  "verify_email",
  "reset_password",
]);

/* ------------------------------------------------------------------ */
/* Accounts & security                                                 */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("player"),
    status: userStatus("status").notNull().default("active"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(sql`lower(${t.email})`),
    uniqueIndex("users_username_uq").on(sql`lower(${t.username})`),
    index("users_role_idx").on(t.role),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const emailTokens = pgTable(
  "email_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: emailTokenType("type").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("email_tokens_hash_uq").on(t.tokenHash),
    index("email_tokens_user_idx").on(t.userId),
  ],
);

export const emergencyOutbox = pgTable("emergency_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Minecraft identity                                                  */
/* ------------------------------------------------------------------ */

export const minecraftAccounts = pgTable(
  "minecraft_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    uuid: text("uuid").notNull(),
    edition: edition("edition").notNull(),
    xuid: text("xuid"),
    verified: boolean("verified").notNull().default(false),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("mc_user_uq").on(t.userId),
    uniqueIndex("mc_uuid_uq").on(t.uuid),
    index("mc_username_idx").on(sql`lower(${t.username})`),
  ],
);

export const linkCodes = pgTable(
  "link_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("link_codes_code_uq").on(t.code)],
);

export const playerStats = pgTable(
  "player_stats",
  {
    uuid: text("uuid").primaryKey(),
    username: text("username").notNull(),
    rank: text("rank").notNull().default("Member"),
    playtimeSeconds: bigint("playtime_seconds", { mode: "number" }).notNull().default(0),
    kills: integer("kills").notNull().default(0),
    deaths: integer("deaths").notNull().default(0),
    mobKills: integer("mob_kills").notNull().default(0),
    killstreak: integer("killstreak").notNull().default(0),
    bestKillstreak: integer("best_killstreak").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    blocksBroken: integer("blocks_broken").notNull().default(0),
    blocksPlaced: integer("blocks_placed").notNull().default(0),
    firstJoinedAt: timestamp("first_joined_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ps_kills_idx").on(t.kills),
    index("ps_playtime_idx").on(t.playtimeSeconds),
    index("ps_beststreak_idx").on(t.bestKillstreak),
    index("ps_mobkills_idx").on(t.mobKills),
    index("ps_wins_idx").on(t.wins),
  ],
);

/* ------------------------------------------------------------------ */
/* Server telemetry                                                    */
/* ------------------------------------------------------------------ */

export const serverStatus = pgTable("server_status", {
  id: integer("id").primaryKey().default(1),
  online: boolean("online").notNull().default(false),
  motd: text("motd"),
  version: text("version"),
  playersOnline: integer("players_online").notNull().default(0),
  maxPlayers: integer("max_players").notNull().default(0),
  javaPlayers: integer("java_players").notNull().default(0),
  bedrockPlayers: integer("bedrock_players").notNull().default(0),
  uptimeSeconds: bigint("uptime_seconds", { mode: "number" }).notNull().default(0),
  tps: text("tps"),
  host: text("host"),
  port: integer("port"),
  lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const onlinePlayers = pgTable(
  "online_players",
  {
    uuid: text("uuid").primaryKey(),
    username: text("username").notNull(),
    edition: edition("edition").notNull().default("java"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("online_players_name_idx").on(sql`lower(${t.username})`)],
);


/* ------------------------------------------------------------------ */
/* Daily rewards & spin                                                */
/* ------------------------------------------------------------------ */

export const dailyRewards = pgTable("daily_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  coins: bigint("coins", { mode: "number" }).notNull().default(0),
  commands: jsonb("commands").$type<string[]>().notNull().default([]),
  icon: text("icon").notNull().default("gift"),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rewardClaims = pgTable(
  "reward_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    streak: integer("streak").notNull().default(1),
    claimDate: date("claim_date").notNull(),
    coins: bigint("coins", { mode: "number" }).notNull().default(0),
    status: claimStatus("status").notNull().default("pending"),
    deliveryId: uuid("delivery_id"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("reward_claims_day_uq").on(t.userId, t.claimDate),
    index("reward_claims_user_idx").on(t.userId, t.createdAt),
  ],
);

export const spinPrizes = pgTable("spin_prizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  coins: bigint("coins", { mode: "number" }).notNull().default(0),
  weight: integer("weight").notNull().default(1),
  color: text("color").notNull().default("#4faf7a"),
  rarity: text("rarity").notNull().default("common"),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const spinHistory = pgTable(
  "spin_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prizeId: uuid("prize_id").references(() => spinPrizes.id, {
      onDelete: "set null",
    }),
    prizeLabel: text("prize_label").notNull(),
    coins: bigint("coins", { mode: "number" }).notNull().default(0),
    spinDate: date("spin_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("spin_user_date_uq").on(t.userId, t.spinDate),
    index("spin_user_idx").on(t.userId, t.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Coin ledger                                                         */
/* ------------------------------------------------------------------ */

export const coinTransactions = pgTable(
  "coin_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    delta: bigint("delta", { mode: "number" }).notNull(),
    balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
    reason: transactionReason("reason").notNull(),
    refType: text("ref_type"),
    refId: text("ref_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coin_tx_user_idx").on(t.userId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("package"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    categoryId: uuid("category_id").references(() => productCategories.id, {
      onDelete: "set null",
    }),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    priceCoins: bigint("price_coins", { mode: "number" }).notNull(),
    compareAtCoins: bigint("compare_at_coins", { mode: "number" }),
    image: text("image"),
    badge: text("badge"),
    commands: jsonb("commands").$type<string[]>().notNull().default([]),
    perPlayerLimit: integer("per_player_limit"),
    stock: integer("stock"),
    active: boolean("active").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    index("products_cat_idx").on(t.categoryId),
    index("products_active_idx").on(t.active, t.sortOrder),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: orderStatus("status").notNull().default("pending"),
    totalCoins: bigint("total_coins", { mode: "number" }).notNull(),
    itemCount: integer("item_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
  },
  (t) => [
    uniqueIndex("orders_ref_uq").on(t.reference),
    index("orders_user_idx").on(t.userId, t.createdAt),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    unitCoins: bigint("unit_coins", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    commands: jsonb("commands").$type<string[]>().notNull().default([]),
    deliveryStatus: deliveryStatus("delivery_status").notNull().default("queued"),
    deliveryId: uuid("delivery_id"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/* ------------------------------------------------------------------ */
/* Plugin delivery queue                                               */
/* ------------------------------------------------------------------ */

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    minecraftUuid: text("minecraft_uuid"),
    minecraftUsername: text("minecraft_username"),
    commands: jsonb("commands").$type<string[]>().notNull().default([]),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    status: deliveryStatus("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    idempotencyKey: text("idempotency_key").notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("deliveries_idem_uq").on(t.idempotencyKey),
    index("deliveries_status_idx").on(t.status, t.createdAt),
  ],
);

export const pluginNonces = pgTable(
  "plugin_nonces",
  {
    nonce: text("nonce").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("plugin_nonces_created_idx").on(t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    category: announcementCategory("category").notNull().default("update"),
    coverImage: text("cover_image"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    pinned: boolean("pinned").notNull().default(false),
    published: boolean("published").notNull().default(true),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("announcements_slug_uq").on(t.slug),
    index("announcements_pub_idx").on(t.published, t.publishedAt),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    coverImage: text("cover_image"),
    type: eventType("type").notNull().default("event"),
    status: eventStatus("status").notNull().default("upcoming"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    registrationOpen: boolean("registration_open").notNull().default(true),
    prize: text("prize"),
    winner: text("winner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("events_slug_uq").on(t.slug),
    index("events_status_idx").on(t.status, t.startsAt),
  ],
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("event_reg_uq").on(t.eventId, t.userId)],
);

/* ------------------------------------------------------------------ */
/* Support                                                             */
/* ------------------------------------------------------------------ */

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull().default("general"),
    subject: text("subject").notNull(),
    status: ticketStatus("status").notNull().default("open"),
    priority: ticketPriority("priority").notNull().default("normal"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tickets_ref_uq").on(t.reference),
    index("tickets_user_idx").on(t.userId, t.createdAt),
    index("tickets_status_idx").on(t.status),
  ],
);

export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    isStaff: boolean("is_staff").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_messages_ticket_idx").on(t.ticketId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Engagement                                                          */
/* ------------------------------------------------------------------ */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull().default("system"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("trophy"),
  metric: text("metric"),
  threshold: bigint("threshold", { mode: "number" }),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_achievements_uq").on(t.userId, t.achievementId)],
);

/* ------------------------------------------------------------------ */
/* Ops                                                                 */
/* ------------------------------------------------------------------ */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  },
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Relations (for typed joins where useful)                            */
/* ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ one, many }) => ({
  minecraft: one(minecraftAccounts, {
    fields: [users.id],
    references: [minecraftAccounts.userId],
  }),
  orders: many(orders),
  claims: many(rewardClaims),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
