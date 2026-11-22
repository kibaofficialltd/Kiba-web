import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Compass,
  FileQuestion,
  HelpCircle,
  Layers,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getGuideCategories, getPublishedGuides } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { cx } from "@/lib/cx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Player Guides & Wiki — KIBAOFFICIAL SMP",
  description:
    "Official player guides, tutorials, command references, and survival mechanics for the KIBAOFFICIAL SMP network.",
  alternates: { canonical: "/guide" },
};

const categoryIcons: Record<string, typeof BookOpen> = {
  "Getting Started": Compass,
  "Economy & Coins": Sparkles,
  "Land Protection": Shield,
  "Ranks & Perks": Layers,
};

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const [{ category, q }, categories] = await Promise.all([
    searchParams,
    getGuideCategories(),
  ]);

  const allGuides = await getPublishedGuides(category);

  const query = q?.toLowerCase().trim();
  const guides = query
    ? allGuides.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.excerpt.toLowerCase().includes(query) ||
          g.category.toLowerCase().includes(query),
      )
    : allGuides;

  return (
    <div className="py-12 sm:py-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-line/60 pb-12 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,97,0.08),transparent_60%)]" />
        <div className="container-x relative">
          <Badge tone="gold">
            <BookOpen className="size-3" /> Documentation & Guides
          </Badge>

          <h1 className="display-xl mt-4 text-balance">
            Master the world.
            <span className="block text-gold-bright">Survival knowledge & tutorials.</span>
          </h1>

          <p className="lede mt-5 max-w-2xl text-pretty">
            Everything you need to know about KIBAOFFICIAL SMP — from linking your Minecraft account
            and claiming land, to mastering the coin economy and in-game commands.
          </p>

          {/* Search bar */}
          <form method="GET" action="/guide" className="mt-8 max-w-xl">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <div className="relative flex items-center">
              <Search className="absolute left-4 size-4 text-muted pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search guides, commands, mechanics..."
                className="w-full rounded-xl border border-line/80 bg-ink-raised/80 py-3.5 pl-11 pr-24 text-sm text-parchment shadow-lg backdrop-blur-md placeholder:text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
              <button
                type="submit"
                className="absolute right-2 btn btn-gold btn-sm px-4"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Link
              href="/guide"
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                !category
                  ? "border-gold/50 bg-gold/15 text-gold-bright shadow-[0_0_12px_rgba(201,169,97,0.2)]"
                  : "border-line/70 bg-ink/40 text-muted hover:border-gold/30 hover:text-parchment",
              )}
            >
              All Guides ({allGuides.length})
            </Link>

            {categories.map((cat) => {
              const active = category === cat;
              return (
                <Link
                  key={cat}
                  href={`/guide?category=${encodeURIComponent(cat)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className={cx(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-gold/50 bg-gold/15 text-gold-bright shadow-[0_0_12px_rgba(201,169,97,0.2)]"
                      : "border-line/70 bg-ink/40 text-muted hover:border-gold/30 hover:text-parchment",
                  )}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guide Grid */}
      <section className="container-x mt-10 sm:mt-12">
        {guides.length === 0 ? (
          <div className="panel p-12 text-center space-y-3">
            <FileQuestion className="size-10 text-muted/50 mx-auto" />
            <h3 className="font-display text-lg text-parchment">No guides found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {q
                ? `No articles match "${q}". Try a different keyword or view all categories.`
                : "No guides have been published in this category yet."}
            </p>
            <Link href="/guide" className="btn btn-quiet btn-sm mt-2 inline-flex">
              Reset filter
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((item) => {
              const Icon = categoryIcons[item.category] ?? BookOpen;

              return (
                <article
                  key={item.id}
                  className="panel panel-interactive group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:border-gold/40 shadow-lg"
                >
                  <Link href={`/guide/${item.slug}`} className="relative block">
                    {item.image ? (
                      /* Optional Image Support */
                      <div className="relative aspect-video w-full overflow-hidden border-b border-line/60 bg-ink">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.title}
                          className="size-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                      </div>
                    ) : (
                      /* Optional Fallback Art when image is omitted */
                      <div className="relative aspect-video w-full overflow-hidden border-b border-line/60 bg-gradient-to-br from-[#1b2a22] via-[#111a15] to-[#0a0f0c] flex items-center justify-center">
                        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(233,228,216,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(233,228,216,0.5)_1px,transparent_1px)] [background-size:20px_20px]" />
                        <Icon className="size-12 text-gold/30 transition group-hover:scale-110 group-hover:text-gold/50" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <span className="rounded-full border border-gold/30 bg-ink/80 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-gold-bright backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between space-y-4">
                    <div className="space-y-2">
                      <h2 className="font-display text-lg font-bold text-parchment leading-snug group-hover:text-gold-bright transition">
                        <Link href={`/guide/${item.slug}`}>{item.title}</Link>
                      </h2>

                      {item.excerpt ? (
                        <p className="line-clamp-2 text-xs text-muted leading-relaxed">
                          {item.excerpt}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-line/50 pt-3 text-[0.68rem] text-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3 text-muted/60" />
                        {formatDate(item.updatedAt)}
                      </span>
                      <Link
                        href={`/guide/${item.slug}`}
                        className="inline-flex items-center gap-1 font-semibold text-gold hover:text-gold-bright transition"
                      >
                        Read guide <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Community Help Callout */}
      <section className="container-x mt-16 sm:mt-20">
        <div className="panel p-6 sm:p-8 bg-gradient-to-r from-ink-raised via-ink to-ink-raised border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-display text-xl text-parchment flex items-center justify-center sm:justify-start gap-2">
              <HelpCircle className="size-5 text-gold" /> Need more help with commands or survival?
            </h3>
            <p className="text-xs text-muted max-w-xl">
              Our staff and community members are active 24/7 in Discord to help answer questions,
              assist with claims, and resolve issues.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/support" className="btn btn-ghost btn-sm">
              Open Support Ticket
            </Link>
            <a
              href="https://discord.gg/UFFn3hmBCF"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold btn-sm"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
