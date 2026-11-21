import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Pin, Radio } from "lucide-react";
import { AnnouncementCard } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { getPublishedAnnouncements } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & announcements",
  description:
    "Server updates, feature releases, maintenance windows and event announcements from the KIBAOFFICIAL SMP team.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const posts = await getPublishedAnnouncements(50);
  const pinned = posts.filter((post) => post.pinned);
  const rest = posts.filter((post) => !post.pinned);

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Dispatches</p>
          <h1 className="display-xl">News from the world.</h1>
          <p className="lede mt-3 max-w-2xl">
            Updates, feature drops and maintenance notices straight from the team. Nothing here is
            auto-generated — if it is published, a human wrote it.
          </p>
        </div>
        <Badge tone="moss">
          <Radio className="size-3" /> {posts.length} dispatch{posts.length === 1 ? "" : "es"}
        </Badge>
      </header>

      {posts.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted">
          No dispatches yet. The first one usually lands with the season.
        </div>
      ) : (
        <>
          {pinned.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold">
                <Pin className="size-3.5" /> Pinned
              </h2>
              <div className="grid gap-4">
                {pinned.map((post) => (
                  <AnnouncementCard key={post.id} post={post} featured />
                ))}
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section>
              <h2 className="mb-4 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
                All dispatches
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <AnnouncementCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <div className="panel mt-10 flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm text-muted">
          Want announcements the moment they land? Discord gets them first.
        </p>
        <Link href="/community" className="btn btn-ghost btn-sm">
          Community hub <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
