import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { BannerManager } from "./banner-manager";

export const metadata: Metadata = {
  title: "Banner Management — Staff Console",
};

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const rows = await db
    .select({
      id: banners.id,
      title: banners.title,
      subtitle: banners.subtitle,
      imageUrl: banners.imageUrl,
      linkUrl: banners.linkUrl,
      buttonText: banners.buttonText,
      active: banners.active,
      sortOrder: banners.sortOrder,
    })
    .from(banners)
    .orderBy(asc(banners.sortOrder), desc(banners.createdAt));

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Showcase & Marketing</p>
        <h1 className="display-md">Top Website Banners.</h1>
        <p className="mt-1 text-sm text-muted">
          Manage the autoscrolling promotional banners featured at the top of the homepage.
          Banners use a 3:1 rectangle ratio (1920 × 640 px recommended).
        </p>
      </header>

      <BannerManager initialBanners={rows} />
    </div>
  );
}
