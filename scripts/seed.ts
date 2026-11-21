import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "../src/db";
import {
  achievements,
  announcements,
  dailyRewards,
  events,
  minecraftAccounts,
  playerStats,
  productCategories,
  products,
  settings,
  spinPrizes,
  users,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/crypto";

/**
 * Seeds configuration and editorial content only.
 *
 * Player statistics and live counts are NEVER seeded: those must come from
 * KIBAOFFICIALCore. `SEED_DEMO=1` additionally creates demo portal accounts for
 * local testing and refuses to run in production.
 */

const demo = process.env.SEED_DEMO === "1" && process.env.NODE_ENV !== "production";

const categories = [
  { slug: "ranks", name: "Ranks", description: "Permanent rank upgrades with commands", icon: "crown", sortOrder: 1 },
  { slug: "keys", name: "Crate Keys", description: "Keys for server crates", icon: "key", sortOrder: 2 },
  { slug: "boosters", name: "Boosters", description: "Multipliers for coins and XP", icon: "coins", sortOrder: 3 },
  { slug: "cosmetics", name: "Cosmetics", description: "Capes, trails and particles", icon: "sparkles", sortOrder: 4 },
  { slug: "items", name: "Special Items", description: "Kits and curated gear", icon: "sword", sortOrder: 5 },
  { slug: "bundles", name: "Bundles", description: "Curated value packs", icon: "package", sortOrder: 6 },
  { slug: "seasonal", name: "Seasonal", description: "Limited seasonal releases", icon: "star", sortOrder: 7 },
  { slug: "exclusive", name: "Exclusive", description: "One-of-one rewards", icon: "trophy", sortOrder: 8 },
];

const productSeed = [
  {
    slug: "aurora-rank",
    name: "Aurora Rank",
    category: "ranks",
    tagline: "Stand out with the northern-light prefix and two extra sethomes.",
    description:
      "The Aurora rank unlocks a custom chat prefix, two additional sethomes, priority queue access during peak hours, and the Aurora particle trail.",
    priceCoins: 7500,
    compareAtCoins: 9000,
    badge: "Popular",
    featured: false,
    commands: [
      "lp user {player} parent add aurora",
      "kiba cosmetic give {player} trail_aurora",
      "broadcast &b{player} &7has joined the aurora ranks!",
    ],
    sortOrder: 10,
  },
  {
    slug: "ember-rank",
    name: "Ember Rank",
    category: "ranks",
    tagline: "Ember-forged prefix, four sethomes and a monthly key stipend.",
    description:
      "Ember is the middle tier of the KIBA ranks. It includes everything in Aurora plus a monthly crate key, ember chat colour and access to the ember lounge.",
    priceCoins: 15000,
    badge: "Best value",
    featured: true,
    commands: ["lp user {player} parent add ember", "crates key give {player} mythic 2", "broadcast &c{player} &7ascended to Ember."],
    sortOrder: 11,
  },
  {
    slug: "voidwalker-rank",
    name: "Voidwalker Rank",
    category: "ranks",
    tagline: "For players who have already built their empire.",
    description:
      "Voidwalker grants six sethomes, a personal warp, the void trail and a permanent 10% coin boost applied by KIBAOFFICIALCore.",
    priceCoins: 30000,
    featured: false,
    commands: ["lp user {player} parent add voidwalker", "kiba boost set {player} coins 0.10", "kiba warp grant {player} 1"],
    sortOrder: 12,
  },
  {
    slug: "sovereign-rank",
    name: "Sovereign Rank",
    category: "ranks",
    tagline: "The summit of the rank ladder. Limited to the season.",
    description:
      "Sovereign is the season capstone: ten sethomes, two personal warps, a 20% coin boost, a custom nickname colour and the Sovereign crown cosmetic.",
    priceCoins: 60000,
    compareAtCoins: 75000,
    badge: "Season capstone",
    featured: true,
    commands: [
      "lp user {player} parent add sovereign",
      "kiba boost set {player} coins 0.20",
      "kiba warp grant {player} 2",
      "kiba cosmetic give {player} crown_sovereign",
    ],
    sortOrder: 13,
  },
  {
    slug: "ancient-key-triple",
    name: "Ancient Crate Keys ×3",
    category: "keys",
    tagline: "Three rolls on the ancient crate.",
    description: "A bundle of three ancient crate keys, delivered instantly to your linked profile.",
    priceCoins: 1200,
    commands: ["crates key give {player} ancient 3"],
    sortOrder: 20,
  },
  {
    slug: "mythic-key",
    name: "Mythic Crate Key",
    category: "keys",
    tagline: "The rarest roll in the network.",
    description: "One mythic crate key. Contains exclusive cosmetics and high-tier gear.",
    priceCoins: 4500,
    featured: true,
    commands: ["crates key give {player} mythic 1"],
    sortOrder: 21,
  },
  {
    slug: "coin-booster-25",
    name: "Coin Booster +25%",
    category: "boosters",
    tagline: "A 24-hour coin multiplier for your whole session.",
    description: "Stacks with your rank boost for 24 hours. Applied by the core plugin on delivery.",
    priceCoins: 2000,
    commands: ["kiba boost temporary {player} coins 0.25 24h"],
    sortOrder: 30,
  },
  {
    slug: "aurora-cape",
    name: "Aurora Cape",
    category: "cosmetics",
    tagline: "A ribbon of green light that follows you.",
    description: "Purely cosmetic. Visible to Java and Bedrock players through the core plugin.",
    priceCoins: 3500,
    commands: ["kiba cosmetic give {player} cape_aurora"],
    sortOrder: 40,
  },
  {
    slug: "ember-trail",
    name: "Ember Trail",
    category: "cosmetics",
    tagline: "Leave a trail of dying embers.",
    description: "A particle trail rendered server-side, so Bedrock players see it too.",
    priceCoins: 2800,
    commands: ["kiba cosmetic give {player} trail_ember"],
    sortOrder: 41,
  },
  {
    slug: "crown-halo",
    name: "Crown Halo",
    category: "cosmetics",
    tagline: "A quiet halo for players who earned it.",
    description: "A floating crown above your head. Exclusive to the coin store.",
    priceCoins: 6000,
    badge: "Exclusive",
    commands: ["kiba cosmetic give {player} halo_crown"],
    sortOrder: 42,
  },
  {
    slug: "netherite-kit",
    name: "Enchanted Netherite Kit",
    category: "items",
    tagline: "A full netherite set, ready for the deep.",
    description: "One set of enchanted netherite armour and tools, delivered to your inventory when you are online.",
    priceCoins: 5000,
    perPlayerLimit: 2,
    commands: ["kit give {player} netherite_plus"],
    sortOrder: 50,
  },
  {
    slug: "builders-palette",
    name: "Builder's Palette",
    category: "items",
    tagline: "Ten thousand blocks, curated by the build team.",
    description: "A shulker of curated building blocks from the season palette.",
    priceCoins: 2200,
    commands: ["kit give {player} builders_palette"],
    sortOrder: 51,
  },
  {
    slug: "founders-bundle",
    name: "Founder's Bundle",
    category: "bundles",
    tagline: "Rank, keys, cape and a boost in one purchase.",
    description:
      "The complete founder package: Aurora rank, three ancient keys, the aurora cape and a 24-hour coin booster.",
    priceCoins: 12000,
    compareAtCoins: 15900,
    badge: "Save 25%",
    featured: true,
    commands: [
      "lp user {player} parent add aurora",
      "crates key give {player} ancient 3",
      "kiba cosmetic give {player} cape_aurora",
      "kiba boost temporary {player} coins 0.25 24h",
    ],
    sortOrder: 60,
  },
  {
    slug: "season-pass",
    name: "Season One Pass",
    category: "bundles",
    tagline: "Every seasonal cosmetic, one purchase.",
    description: "Grants the full season-one cosmetic set and a monthly mythic key for the duration of the season.",
    priceCoins: 9000,
    commands: ["kiba season grant {player} 1"],
    sortOrder: 61,
  },
  {
    slug: "winter-solstice-crate",
    name: "Winter Solstice Crate",
    category: "seasonal",
    tagline: "Limited to the solstice event.",
    description: "A seasonal crate with frost cosmetics and a chance at the solstice crown.",
    priceCoins: 3000,
    badge: "Limited",
    commands: ["crates key give {player} solstice 1"],
    sortOrder: 70,
  },
  {
    slug: "legend-trophy",
    name: "Legend Trophy",
    category: "exclusive",
    tagline: "A single trophy. A permanent name.",
    description:
      "One trophy per season, engraved with your username and placed in the spawn hall of legends.",
    priceCoins: 100000,
    stock: 1,
    perPlayerLimit: 1,
    badge: "1 of 1",
    commands: ["kiba trophy grant {player} legend_season_1"],
    sortOrder: 80,
  },
];

async function main() {
  console.log("Seeding KIBAOFFICIAL SMP…");

  /* --- Categories & products ---------------------------------------- */
  for (const category of categories) {
    await db
      .insert(productCategories)
      .values(category)
      .onConflictDoUpdate({
        target: productCategories.slug,
        set: { name: category.name, description: category.description, sortOrder: category.sortOrder, icon: category.icon },
      });
  }

  const categoryRows = await db.select().from(productCategories);
  const categoryMap = new Map(categoryRows.map((row) => [row.slug, row.id]));

  for (const item of productSeed) {
    await db
      .insert(products)
      .values({
        slug: item.slug,
        name: item.name,
        categoryId: categoryMap.get(item.category) ?? null,
        tagline: item.tagline,
        description: item.description,
        priceCoins: item.priceCoins,
        compareAtCoins: item.compareAtCoins ?? null,
        badge: item.badge ?? null,
        commands: item.commands,
        perPlayerLimit: item.perPlayerLimit ?? null,
        stock: item.stock ?? null,
        featured: item.featured ?? false,
        sortOrder: item.sortOrder,
      })
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          name: item.name,
          tagline: item.tagline,
          description: item.description,
          priceCoins: item.priceCoins,
          compareAtCoins: item.compareAtCoins ?? null,
          badge: item.badge ?? null,
          commands: item.commands,
          categoryId: categoryMap.get(item.category) ?? null,
          featured: item.featured ?? false,
          sortOrder: item.sortOrder,
        },
      });
  }

  /* --- Daily rewards ------------------------------------------------- */
  const rewards = [
    { dayNumber: 1, title: "Basic Kit", description: "Starter tools and food to begin the day.", coins: 100, commands: ["kit give {player} daily_basic"] },
    { dayNumber: 2, title: "500 Coins", description: "Straight to your balance.", coins: 500, commands: [] },
    { dayNumber: 3, title: "Rare Key", description: "One rare crate key.", coins: 0, commands: ["crates key give {player} rare 1"] },
    { dayNumber: 4, title: "Special Items", description: "A curated bundle of utility items.", coins: 200, commands: ["kit give {player} daily_special"] },
    { dayNumber: 5, title: "Premium Reward", description: "A premium cosmetic shard.", coins: 750, commands: ["kiba shard give {player} premium 1"] },
    { dayNumber: 6, title: "1,200 Coins", description: "A coin cache for the weekend.", coins: 1200, commands: [] },
    { dayNumber: 7, title: "Legendary Reward", description: "Legendary crate key and the weekly crown.", coins: 2500, commands: ["crates key give {player} legendary 1", "kiba cosmetic give {player} halo_weekly"] },
  ];

  for (const reward of rewards) {
    const existing = await db
      .select({ id: dailyRewards.id })
      .from(dailyRewards)
      .where(sql`${dailyRewards.dayNumber} = ${reward.dayNumber}`)
      .limit(1);
    if (!existing[0]) {
      await db.insert(dailyRewards).values({ ...reward, icon: "gift" });
    }
  }

  /* --- Daily spin ---------------------------------------------------- */
  const prizes = [
    { label: "50 Coins", coins: 50, weight: 26, color: "#3f5f49", rarity: "common" },
    { label: "120 Coins", coins: 120, weight: 22, color: "#466a52", rarity: "common" },
    { label: "250 Coins", coins: 250, weight: 18, color: "#527a5d", rarity: "uncommon" },
    { label: "500 Coins", coins: 500, weight: 12, color: "#6fae7b", rarity: "uncommon" },
    { label: "1,000 Coins", coins: 1000, weight: 8, color: "#8a8a4f", rarity: "rare" },
    { label: "2,000 Coins", coins: 2000, weight: 4, color: "#c9a961", rarity: "epic" },
    { label: "5,000 Coins", coins: 5000, weight: 1, color: "#e8ce8a", rarity: "legendary" },
  ];
  const prizeCount = await db.select({ id: spinPrizes.id }).from(spinPrizes).limit(1);
  if (prizeCount.length === 0) {
    await db.insert(spinPrizes).values(prizes.map((prize, index) => ({ ...prize, sortOrder: index })));
  }

  /* --- Announcements ------------------------------------------------- */
  const news = [
    {
      slug: "season-one-begins",
      title: "Season One begins: a new world, a clean ledger",
      category: "update" as const,
      excerpt: "The first KIBAOFFICIAL season is live. New terrain, a fresh economy and the opening of the rank ladder.",
      body: "## The world resets, the story starts\n\nSeason One is live across Java and Bedrock. The overworld has been regenerated with a larger biome spread, the end has been reset, and every coin balance begins from a clean ledger.\n\n### What changed\n\n- New spawn hub with the hall of legends\n- Rebalanced crate tables\n- Daily rewards now run on a seven-day streak\n- The coin store is open, priced entirely in coins\n\n### What carries over\n\nYour portal account, linked Minecraft profile and purchase history carry over. Nothing else is wiped without an announcement first.\n\nSee you in the world.",
      pinned: true,
    },
    {
      slug: "daily-spin-is-live",
      title: "The daily spin is live",
      category: "feature" as const,
      excerpt: "One free spin every 24 hours. Server-side randomness, instantly credited to your linked balance.",
      body: "## One spin a day\n\nThe spin wheel is now part of the player portal. Every linked account gets one free spin per UTC day.\n\n- Randomness is generated on the server with a cryptographic source — the browser cannot influence it\n- Coins are credited atomically to your ledger\n- The wheel animation is cosmetic; the result is decided before it starts\n\nLink your Minecraft account to unlock it.",
      pinned: false,
    },
    {
      slug: "bedrock-performance-pass",
      title: "Bedrock performance pass",
      category: "maintenance" as const,
      excerpt: "Floodgate tuning and chunk-send improvements for Bedrock players on mobile.",
      body: "## Smoother Bedrock sessions\n\nWe have tuned Floodgate and reduced chunk-send pressure for mobile Bedrock clients.\n\nIf you still see stutter, lower your render distance to 8 chunks and let us know in the support centre with your device model.",
      pinned: false,
    },
  ];

  for (const post of news) {
    await db
      .insert(announcements)
      .values({ ...post, published: true })
      .onConflictDoNothing({ target: announcements.slug });
  }

  /* --- Events -------------------------------------------------------- */
  const now = Date.now();
  const eventSeed = [
    {
      slug: "build-the-bastion",
      title: "Build the Bastion",
      description:
        "A 72-hour build contest. Claim a plot, build a fortress and submit it for community voting. The top three builds are preserved in the hall of legends.",
      type: "event" as const,
      status: "active" as const,
      startsAt: new Date(now - 2 * 86_400_000),
      endsAt: new Date(now + 3 * 86_400_000),
      prize: "15,000 coins + Sovereign rank for the winner",
      registrationOpen: true,
    },
    {
      slug: "smp-pvp-ladder",
      title: "SMP PvP Ladder",
      description:
        "A weekend ladder across the arena network. Best-of-three brackets, live standings on the leaderboard page.",
      type: "event" as const,
      status: "upcoming" as const,
      startsAt: new Date(now + 6 * 86_400_000),
      endsAt: new Date(now + 8 * 86_400_000),
      prize: "8,000 coins and a mythic key per finalist",
      registrationOpen: true,
    },
    {
      slug: "solstice-giveaway",
      title: "Solstice Giveaway",
      description:
        "Three winners receive the winter solstice crate bundle. Enter once from the events page.",
      type: "giveaway" as const,
      status: "upcoming" as const,
      startsAt: new Date(now + 10 * 86_400_000),
      prize: "3× Winter Solstice Crate",
      registrationOpen: true,
    },
  ];

  for (const event of eventSeed) {
    await db.insert(events).values(event).onConflictDoNothing({ target: events.slug });
  }

  /* --- Achievements -------------------------------------------------- */
  const achievementSeed = [
    { code: "first-steps", name: "First Steps", description: "Link your Minecraft account.", icon: "link", metric: "linked", threshold: 1 },
    { code: "coin-collector", name: "Coin Collector", description: "Hold 10,000 coins at once.", icon: "coins", metric: "balance", threshold: 10000 },
    { code: "veteran", name: "Veteran", description: "Play for 100 hours.", icon: "clock", metric: "playtime", threshold: 360000 },
    { code: "slayer", name: "Slayer", description: "Reach 1,000 mob kills.", icon: "swords", metric: "mobkills", threshold: 1000 },
    { code: "duelist", name: "Duelist", description: "Win 25 PvP encounters.", icon: "trophy", metric: "wins", threshold: 25 },
    { code: "streak-seven", name: "Sevenfold", description: "Claim seven daily rewards in a row.", icon: "gift", metric: "streak", threshold: 7 },
  ];
  for (const achievement of achievementSeed) {
    await db.insert(achievements).values(achievement).onConflictDoNothing({ target: achievements.code });
  }

  /* --- Settings ------------------------------------------------------ */
  for (const [key, value] of Object.entries({
    dailyRewardsEnabled: true,
    spinEnabled: true,
    storeEnabled: true,
    storeMinAccountAgeMinutes: 0,
    maintenanceMessage: "",
  })) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing({ target: settings.key });
  }

  /* --- Owner account ------------------------------------------------ */
  const ownerEmail = (process.env.SEED_ADMIN_EMAIL ?? "owner@kibaofficial.fun").toLowerCase();
  const ownerPassword = process.env.SEED_ADMIN_PASSWORD ?? "KibaOwner!2026";
  const existingOwner = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${ownerEmail}`)
    .limit(1);

  let ownerId = existingOwner[0]?.id;
  if (!ownerId) {
    const inserted = await db
      .insert(users)
      .values({
        email: ownerEmail,
        username: "KIBA",
        passwordHash: await hashPassword(ownerPassword),
        role: "owner",
        emailVerifiedAt: new Date(),
        balance: 0,
      })
      .returning({ id: users.id });
    ownerId = inserted[0]?.id;
    console.log(`  owner created: ${ownerEmail} / ${ownerPassword} (change this immediately)`);
  }

  if (ownerId && process.env.SEED_ADMIN_COINS === "1") {
    await db
      .update(users)
      .set({ balance: sql`${users.balance} + 100000` })
      .where(sql`${users.id} = ${ownerId}`);
    console.log("  owner credited 100,000 test coins");
  }

  /* --- Demo accounts (local only) ----------------------------------- */
  if (demo) {
    const demoUsers = [
      { username: "AetherWalker", mc: "AetherWalker", uuid: "d3adb33f-0001-4000-8000-000000000001", balance: 42000 },
      { username: "EmberFox", mc: "EmberFox", uuid: "d3adb33f-0002-4000-8000-000000000002", balance: 51500 },
      { username: "FrostByte", mc: "FrostByte", uuid: "d3adb33f-0003-4000-8000-000000000003", balance: 28750 },
    ];
    for (const entry of demoUsers) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${`${entry.username.toLowerCase()}@example.com`}`)
        .limit(1);
      if (existing[0]) continue;
      const inserted = await db
        .insert(users)
        .values({
          email: `${entry.username.toLowerCase()}@example.com`,
          username: entry.username,
          passwordHash: await hashPassword("DemoPlayer!2026"),
          role: "player",
          emailVerifiedAt: new Date(),
          balance: entry.balance,
        })
        .returning({ id: users.id });
      const id = inserted[0]?.id;
      if (!id) continue;
      await db.insert(minecraftAccounts).values({
        userId: id,
        username: entry.mc,
        uuid: entry.uuid,
        edition: "java",
        verified: true,
        lastSeenAt: new Date(),
      });
      await db.insert(playerStats).values({
        uuid: entry.uuid,
        username: entry.mc,
        playtimeSeconds: 60 * 60 * 30,
        firstJoinedAt: new Date(Date.now() - 40 * 86_400_000),
        lastSeenAt: new Date(),
      });
    }
    console.log("  demo accounts created (SEED_DEMO=1)");
  }

  console.log("Seed complete.");
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
