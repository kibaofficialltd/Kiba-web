import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Pin, UserRound } from "lucide-react";
import { Prose } from "@/components/prose";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCard, announcementLabels } from "@/components/cards";
import { getAnnouncementBySlug, getPublishedAnnouncements } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getAnnouncementBySlug(slug);
  if (!post) return { title: "Dispatch not found" };
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    alternates: { canonical: `/news/${post.slug}` },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getAnnouncementBySlug(slug);
  if (!post) notFound();

  const others = (await getPublishedAnnouncements(20))
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="container-x py-10 sm:py-14">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-parchment"
      >
        <ArrowLeft className="size-3.5" /> All dispatches
      </Link>

      <article className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="moss">{announcementLabels[post.category] ?? post.category}</Badge>
          {post.pinned ? (
            <Badge tone="gold">
              <Pin className="size-3" /> Pinned
            </Badge>
          ) : null}
        </div>

        <h1 className="display-lg mt-4 text-balance">{post.title}</h1>
        <p className="lede mt-3 text-pretty">{post.excerpt}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line/60 py-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" /> {post.author ?? "KIBA staff"}
          </span>
        </div>

        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt=""
            className="mt-6 w-full rounded-xl border border-line object-cover"
            loading="lazy"
          />
        ) : null}

        <div className="mt-8">
          <Prose content={post.body} />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-soft/60 p-5">
          <div>
            <p className="font-display text-base">Discuss this dispatch</p>
            <p className="text-xs text-muted">Questions and feedback belong in the community.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/community" className="btn btn-ghost btn-sm">
              Community
            </Link>
            <Link href="/support" className="btn btn-primary btn-sm">
              Open a ticket
            </Link>
          </div>
        </div>
      </article>

      {others.length > 0 ? (
        <section className="mx-auto mt-12 max-w-5xl">
          <h2 className="mb-4 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
            More dispatches
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <AnnouncementCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
