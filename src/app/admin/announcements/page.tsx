import { desc } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { AnnouncementManager } from "./announcement-manager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const rows = await db.select().from(announcements).orderBy(desc(announcements.publishedAt)).limit(100);

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Content</p>
        <h1 className="display-md">News & dispatches.</h1>
        <p className="mt-1 text-sm text-muted">
          Drafts stay hidden until published. Pinning surfaces a dispatch at the top of the news feed.
        </p>
      </header>

      <AnnouncementManager
        posts={rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt,
          body: row.body,
          category: row.category,
          coverImage: row.coverImage,
          pinned: row.pinned,
          published: row.published,
          publishedAt: row.publishedAt.toISOString(),
        }))}
      />
    </div>
  );
}
