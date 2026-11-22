import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getGuideBySlug, getPublishedGuides } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";
import { GuideContentView } from "@/components/guide/guide-content-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return { title: "Guide Not Found" };

  return {
    title: `${guide.title} — KIBAOFFICIAL SMP Guide`,
    description: guide.excerpt || `Read the official guide on ${guide.title} for KIBAOFFICIAL SMP.`,
    alternates: { canonical: `/guide/${guide.slug}` },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) notFound();

  // Fetch 3 related guides in same category
  const allInCategory = await getPublishedGuides(guide.category);
  const related = allInCategory.filter((g) => g.id !== guide.id).slice(0, 3);

  return (
    <article className="py-12 sm:py-16">
      <div className="container-x max-w-4xl space-y-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-parchment transition">
            Home
          </Link>
          <ChevronRight className="size-3 text-muted/50" />
          <Link href="/guide" className="hover:text-parchment transition">
            Guides
          </Link>
          <ChevronRight className="size-3 text-muted/50" />
          <Link
            href={`/guide?category=${encodeURIComponent(guide.category)}`}
            className="hover:text-parchment transition"
          >
            {guide.category}
          </Link>
          <ChevronRight className="size-3 text-muted/50" />
          <span className="truncate text-parchment max-w-[200px] sm:max-w-xs">{guide.title}</span>
        </nav>

        {/* Header Block */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">
              <BookOpen className="size-3" /> {guide.category}
            </Badge>
            <span className="text-xs text-muted flex items-center gap-1">
              <Calendar className="size-3" /> Updated {formatDate(guide.updatedAt)}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-parchment leading-tight">
            {guide.title}
          </h1>

          {guide.excerpt ? (
            <p className="text-base sm:text-lg text-parchment-dim leading-relaxed border-l-2 border-gold/60 pl-4 py-1">
              {guide.excerpt}
            </p>
          ) : null}
        </header>

        {/* Featured Image (Optional) */}
        {guide.image ? (
          <div className="overflow-hidden rounded-2xl border border-line/80 shadow-2xl bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={guide.image}
              alt={guide.title}
              className="w-full max-h-[460px] object-cover object-center"
            />
          </div>
        ) : (
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        )}

        {/* Article Body Content */}
        <div className="panel p-6 sm:p-10 space-y-6">
          <GuideContentView content={guide.content} />
        </div>

        {/* Help & Support Footer Callout */}
        <div className="panel p-6 bg-ink-raised/50 border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-display text-base text-parchment flex items-center justify-center sm:justify-start gap-2">
              <HelpCircle className="size-4 text-gold" /> Questions about this guide?
            </h4>
            <p className="text-xs text-muted">
              Ask in the KIBAOFFICIAL Discord community or submit a player support ticket.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/support" className="btn btn-quiet btn-sm">
              Open Ticket
            </Link>
            <a
              href={site.socials.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold btn-sm inline-flex items-center gap-1"
            >
              Discord <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        {/* Related Guides in this Category */}
        {related.length > 0 ? (
          <section className="space-y-4 pt-6 border-t border-line/60">
            <h3 className="font-display text-xl text-parchment">
              More guides in {guide.category}
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/guide/${item.slug}`}
                  className="panel p-4 hover:border-gold/40 transition group space-y-2 block"
                >
                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-gold">
                    {item.category}
                  </p>
                  <h4 className="font-display text-sm font-semibold text-parchment group-hover:text-gold-bright transition line-clamp-2">
                    {item.title}
                  </h4>
                  {item.excerpt ? (
                    <p className="text-xs text-muted line-clamp-2">{item.excerpt}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Back Link */}
        <div className="pt-2">
          <Link href="/guide" className="btn btn-quiet btn-sm inline-flex items-center gap-1.5">
            <ArrowLeft className="size-3.5" /> Back to all guides
          </Link>
        </div>
      </div>
    </article>
  );
}
