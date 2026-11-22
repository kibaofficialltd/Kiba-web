import "server-only";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  banners,
  eventRegistrations,
  events,
  guides,
  minecraftAccounts,
  playerStats,
  productCategories,
  products,
  users,
} from "@/db/schema";

/* ---------------------------------------------------------------- News */

export async function getPublishedAnnouncements(limit = 6) {
  return db
    .select({
      id: announcements.id,
      slug: announcements.slug,
      title: announcements.title,
      excerpt: announcements.excerpt,
      category: announcements.category,
      coverImage: announcements.coverImage,
      pinned: announcements.pinned,
      publishedAt: announcements.publishedAt,
      author: users.username,
    })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .where(eq(announcements.published, true))
    .orderBy(desc(announcements.pinned), desc(announcements.publishedAt))
    .limit(limit);
}

export async function getAnnouncementBySlug(slug: string) {
  const rows = await db
    .select({
      id: announcements.id,
      slug: announcements.slug,
      title: announcements.title,
      excerpt: announcements.excerpt,
      body: announcements.body,
      category: announcements.category,
      coverImage: announcements.coverImage,
      pinned: announcements.pinned,
      publishedAt: announcements.publishedAt,
      author: users.username,
    })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .where(and(eq(announcements.slug, slug), eq(announcements.published, true)))
    .limit(1);
  return rows[0] ?? null;
}

/* --------------------------------------------------------------- Store */

export async function getProducts() {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      tagline: products.tagline,
      description: products.description,
      priceCoins: products.priceCoins,
      compareAtCoins: products.compareAtCoins,
      image: products.image,
      badge: products.badge,
      featured: products.featured,
      stock: products.stock,
      perPlayerLimit: products.perPlayerLimit,
      category: productCategories.name,
      categorySlug: productCategories.slug,
      categoryIcon: productCategories.icon,
    })
    .from(products)
    .leftJoin(productCategories, eq(productCategories.id, products.categoryId))
    .where(eq(products.active, true))
    .orderBy(products.sortOrder, products.name);
}

export async function getFeaturedProducts(limit = 3) {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      tagline: products.tagline,
      priceCoins: products.priceCoins,
      compareAtCoins: products.compareAtCoins,
      badge: products.badge,
      image: products.image,
      category: productCategories.name,
      categorySlug: productCategories.slug,
    })
    .from(products)
    .leftJoin(productCategories, eq(productCategories.id, products.categoryId))
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .orderBy(products.sortOrder)
    .limit(limit);
}

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      tagline: products.tagline,
      description: products.description,
      priceCoins: products.priceCoins,
      compareAtCoins: products.compareAtCoins,
      image: products.image,
      badge: products.badge,
      commands: products.commands,
      perPlayerLimit: products.perPlayerLimit,
      stock: products.stock,
      active: products.active,
      category: productCategories.name,
      categorySlug: productCategories.slug,
    })
    .from(products)
    .leftJoin(productCategories, eq(productCategories.id, products.categoryId))
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCategories() {
  return db
    .select()
    .from(productCategories)
    .where(eq(productCategories.active, true))
    .orderBy(productCategories.sortOrder);
}

/* --------------------------------------------------------------- Events */

export async function getEvents(limit = 20) {
  return db.select().from(events).orderBy(desc(events.startsAt)).limit(limit);
}

export async function getUpcomingEvents(limit = 4) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "upcoming"), gte(events.startsAt, sql`now() - interval '1 day'`)))
    .orderBy(events.startsAt)
    .limit(limit);
}

export async function getEventBySlug(slug: string) {
  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getEventRegistrationCount(eventId: string) {
  const rows = await db
    .select({ value: count() })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));
  return Number(rows[0]?.value ?? 0);
}

/* --------------------------------------------------------- Leaderboards */

export type LeaderboardCategory =
  | "richest"
  | "playtime"
  | "kills"
  | "killstreak"
  | "mobkills"
  | "wins"
  | "pvp";

export type LeaderboardEntry = {
  rank: number;
  username: string;
  uuid: string | null;
  value: number;
  label: string;
  href: string | null;
};

const statColumns = {
  playtime: playerStats.playtimeSeconds,
  kills: playerStats.kills,
  killstreak: playerStats.bestKillstreak,
  mobkills: playerStats.mobKills,
  wins: playerStats.wins,
} as const;

export async function getLeaderboard(category: LeaderboardCategory, limit = 25): Promise<LeaderboardEntry[]> {
  if (category === "richest") {
    const rows = await db
      .select({
        username: minecraftAccounts.username,
        uuid: minecraftAccounts.uuid,
        balance: users.balance,
        accountName: users.username,
      })
      .from(users)
      .innerJoin(minecraftAccounts, eq(minecraftAccounts.userId, users.id))
      .orderBy(desc(users.balance))
      .limit(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      uuid: row.uuid,
      value: row.balance,
      label: "coins",
      href: `/player/${encodeURIComponent(row.username)}`,
    }));
  }

  if (category === "pvp") {
    const rows = await db
      .select({
        username: playerStats.username,
        uuid: playerStats.uuid,
        kills: playerStats.kills,
        deaths: playerStats.deaths,
        ratio: sql<number>`(${playerStats.kills}::float + 1) / (${playerStats.deaths} + 1)`,
      })
      .from(playerStats)
      .orderBy(desc(sql`(${playerStats.kills}::float + 1) / (${playerStats.deaths} + 1)`), desc(playerStats.kills))
      .limit(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      uuid: row.uuid,
      value: Number(row.ratio),
      label: `${row.kills}K / ${row.deaths}D`,
      href: `/player/${encodeURIComponent(row.username)}`,
    }));
  }

  const column = statColumns[category];
  const rows = await db
    .select({
      username: playerStats.username,
      uuid: playerStats.uuid,
      value: column,
    })
    .from(playerStats)
    .orderBy(desc(column))
    .limit(limit);

  return rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    uuid: row.uuid,
    value: Number(row.value),
    label: category,
    href: `/player/${encodeURIComponent(row.username)}`,
  }));
}

/* --------------------------------------------------------------- Public profile */

export async function getPublicPlayer(username: string) {
  const accRows = await db
    .select({
      accountId: minecraftAccounts.id,
      username: minecraftAccounts.username,
      uuid: minecraftAccounts.uuid,
      edition: minecraftAccounts.edition,
      linkedAt: minecraftAccounts.linkedAt,
      websiteUsername: users.username,
      role: users.role,
      balance: users.balance,
    })
    .from(minecraftAccounts)
    .innerJoin(users, eq(users.id, minecraftAccounts.userId))
    .where(sql`lower(${minecraftAccounts.username}) = ${username.toLowerCase()}`)
    .limit(1);

  const account = accRows[0];
  if (!account) return null;

  const statRows = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.uuid, account.uuid))
    .limit(1);
  const stats = statRows[0] ?? null;

  const [richer, betterKills, betterPlaytime] = await Promise.all([
    db
      .select({ value: count() })
      .from(users)
      .where(sql`${users.balance} > ${account.balance} AND exists (select 1 from minecraft_accounts m where m.user_id = ${users.id})`),
    stats
      ? db.select({ value: count() }).from(playerStats).where(sql`${playerStats.kills} > ${stats.kills}`)
      : Promise.resolve([{ value: 0 }]),
    stats
      ? db
          .select({ value: count() })
          .from(playerStats)
          .where(sql`${playerStats.playtimeSeconds} > ${stats.playtimeSeconds}`)
      : Promise.resolve([{ value: 0 }]),
  ]);

  return {
    account,
    stats,
    ranks: {
      richest: Number(richer[0]?.value ?? 0) + 1,
      kills: Number(betterKills[0]?.value ?? 0) + 1,
      playtime: Number(betterPlaytime[0]?.value ?? 0) + 1,
    },
  };
}

/* --------------------------------------------------------------- Network pulse */

export async function getNetworkPulse() {
  const [registered, linked, tracked, active] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(minecraftAccounts),
    db.select({ value: count() }).from(playerStats),
    db.select({ value: count() }).from(events).where(eq(events.status, "active")),
  ]);
  return {
    registered: Number(registered[0]?.value ?? 0),
    linked: Number(linked[0]?.value ?? 0),
    trackedPlayers: Number(tracked[0]?.value ?? 0),
    activeEvents: Number(active[0]?.value ?? 0),
  };
}

/* --------------------------------------------------------------- Banners */

export async function getActiveBanners() {
  return db
    .select({
      id: banners.id,
      title: banners.title,
      subtitle: banners.subtitle,
      imageUrl: banners.imageUrl,
      linkUrl: banners.linkUrl,
      buttonText: banners.buttonText,
      sortOrder: banners.sortOrder,
    })
    .from(banners)
    .where(eq(banners.active, true))
    .orderBy(asc(banners.sortOrder), desc(banners.createdAt));
}

/* --------------------------------------------------------------- Guides */

export async function getPublishedGuides(category?: string) {
  const query = db
    .select({
      id: guides.id,
      slug: guides.slug,
      title: guides.title,
      category: guides.category,
      excerpt: guides.excerpt,
      image: guides.image,
      sortOrder: guides.sortOrder,
      updatedAt: guides.updatedAt,
    })
    .from(guides)
    .where(
      category
        ? and(eq(guides.published, true), eq(guides.category, category))
        : eq(guides.published, true),
    )
    .orderBy(asc(guides.sortOrder), desc(guides.updatedAt));

  return query;
}

export async function getGuideBySlug(slug: string) {
  const rows = await db
    .select()
    .from(guides)
    .where(and(eq(guides.slug, slug), eq(guides.published, true)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getGuideCategories() {
  const rows = await db
    .select({ category: guides.category })
    .from(guides)
    .where(eq(guides.published, true))
    .groupBy(guides.category);

  return rows.map((r) => r.category);
}

