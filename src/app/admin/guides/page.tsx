import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { guides } from "@/db/schema";
import { GuideManager } from "./guide-manager";

export const metadata: Metadata = {
  title: "Guide Management — Staff Console",
};

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const rows = await db
    .select({
      id: guides.id,
      slug: guides.slug,
      title: guides.title,
      category: guides.category,
      excerpt: guides.excerpt,
      content: guides.content,
      image: guides.image,
      published: guides.published,
      sortOrder: guides.sortOrder,
      updatedAt: guides.updatedAt,
    })
    .from(guides)
    .orderBy(asc(guides.sortOrder), desc(guides.createdAt));

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Documentation & Wiki</p>
        <h1 className="display-md">Player Guides & Tutorials.</h1>
        <p className="mt-1 text-sm text-muted">
          Create, edit, and organize player guides, tutorial wiki pages, and server documentation.
          Images are optional and full markdown formatting is supported.
        </p>
      </header>

      <GuideManager initialGuides={rows} />
    </div>
  );
}
