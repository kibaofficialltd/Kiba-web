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
          <GuideContentRenderer content={guide.content} />
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

/**
 * Lightweight, high-performance markdown parser for guide formatting.
 * Handles headings (#, ##, ###), lists (- ), bold (**), and inline code.
 */
function GuideContentRenderer({ content }: { content: string }) {
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-3 space-y-2 pl-5 list-disc text-parchment-dim text-sm leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineText(item)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // List item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
      continue;
    }

    flushList();

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-display text-lg font-bold text-parchment mt-6 mb-2">
          {parseInlineText(line.slice(4))}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-display text-xl sm:text-2xl font-bold text-gold-bright mt-8 mb-3 border-b border-line/60 pb-2">
          {parseInlineText(line.slice(3))}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="font-display text-2xl sm:text-3xl font-extrabold text-parchment mt-6 mb-3">
          {parseInlineText(line.slice(2))}
        </h2>,
      );
    } else {
      // Paragraph
      elements.push(
        <p key={i} className="text-sm sm:text-base text-parchment-dim leading-relaxed my-2.5">
          {parseInlineText(line)}
        </p>,
      );
    }
  }

  flushList();

  return <div className="prose-kiba space-y-1">{elements}</div>;
}

function parseInlineText(text: string): React.ReactNode {
  // Simple regex parser for inline code `...` and bold **...**
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={match.index} className="rounded bg-gold/15 px-1.5 py-0.5 font-mono text-[0.85em] text-gold-bright border border-gold/30">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-parchment">
          {token.slice(2, -2)}
        </strong>,
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
