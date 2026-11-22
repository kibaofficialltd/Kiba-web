import { db } from "../src/db";
import { banners } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding authentic KIBAOFFICIAL banners...");

  // Clear existing placeholder banners
  await db.delete(banners);

  const newBanners = [
    {
      title: "KIBAOFFICIAL SMP — Play · Earn · Enjoy",
      subtitle: "Daily Spin, Daily Kits, Player Shop & Perks on our cross-platform survival network.",
      imageUrl: "/banners/banner-main.jpg",
      linkUrl: "/store",
      buttonText: "Join Server",
      active: true,
      sortOrder: 1,
    },
    {
      title: "Limited Time Sale — 30% OFF",
      subtitle: "Grab ranks, coin bundles, and exclusive in-game items at 30% off.",
      imageUrl: "/banners/banner-sale.jpg",
      linkUrl: "/store",
      buttonText: "Shop Sale",
      active: true,
      sortOrder: 2,
    },
    {
      title: "Player Guide & Wiki",
      subtitle: "Learn how to play, tips & tricks, server commands, and features.",
      imageUrl: "/banners/banner-guide.jpg",
      linkUrl: "/guide",
      buttonText: "Read Guide",
      active: true,
      sortOrder: 3,
    },
    {
      title: "Leaderboard — Top Players",
      subtitle: "Compete for #1 in Money Top, Playtime Top, and seasonal ranks.",
      imageUrl: "/banners/banner-leaderboard.jpg",
      linkUrl: "/leaderboards",
      buttonText: "View Ranks",
      active: true,
      sortOrder: 4,
    },
    {
      title: "Join Our Community",
      subtitle: "Chat with fellow players, join the Discord, and make friends.",
      imageUrl: "/banners/banner-community.jpg",
      linkUrl: "/community",
      buttonText: "Join Discord",
      active: true,
      sortOrder: 5,
    },
  ];

  for (const b of newBanners) {
    await db.insert(banners).values(b);
    console.log(`Inserted banner: ${b.title}`);
  }

  console.log("All 5 banners successfully seeded!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed banners:", err);
  process.exit(1);
});
