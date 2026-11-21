import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Coins, Gift, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/panel";
import { getCategories, getProducts } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { cx } from "@/lib/cx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coin store",
  description:
    "Spend coins on ranks, crate keys, boosters and cosmetics for KIBAOFFICIAL SMP. Coins are earned by playing — there is no real-money checkout.",
  alternates: { canonical: "/store" },
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, products, categories, user] = await Promise.all([
    searchParams,
    getProducts(),
    getCategories(),
    getCurrentUser(),
  ]);

  const active = categories.find((item) => item.slug === category);
  const filtered = active ? products.filter((product) => product.categorySlug === active.slug) : products;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,97,0.08),transparent_60%)]" />
        <div className="container-x relative py-14 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <Badge tone="gold">
                <Coins className="size-3" /> Coin store
              </Badge>
              <h1 className="display-xl mt-4 text-balance">
                Earned in the world.
                <span className="block text-moss-bright">Spent on the world.</span>
              </h1>
              <p className="lede mt-5 max-w-2xl">
                Every item here is priced in coins — the same balance you see in-game. No payment
                gateway, no card details, no surprise charges. Purchases are delivered by
                KIBAOFFICIALCore to your verified UUID.
              </p>
            </div>

            <div className="panel grain p-5">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">
                Your balance
              </p>
              {user ? (
                <>
                  <p className="mt-1 flex items-center gap-2 font-display text-3xl text-gold-bright">
                    <Coins className="size-5" /> {formatNumber(user.balance)}
                  </p>
                  <p className="mt-1 text-xs text-muted">coins available right now</p>
                  <div className="mt-4 flex gap-2">
                    <Link href="/dashboard/rewards" className="btn btn-ghost btn-sm flex-1">
                      <Gift className="size-3.5" /> Daily reward
                    </Link>
                    <Link href="/dashboard/spin" className="btn btn-gold btn-sm flex-1">
                      <Sparkles className="size-3.5" /> Spin
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 font-display text-2xl text-parchment">Sign in to spend</p>
                  <p className="mt-1 text-xs text-muted">
                    Your coin balance is tied to your portal account and verified UUID.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link href="/login?next=/store" className="btn btn-primary btn-sm flex-1">
                      Sign in
                    </Link>
                    <Link href="/register" className="btn btn-ghost btn-sm flex-1">
                      Register
                    </Link>
                  </div>
                </>
              )}
              <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-3 text-[0.66rem] text-muted">
                <ShieldCheck className="size-3.5 text-moss" />
                Server-validated checkout · atomic ledger
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap items-center gap-2" role="navigation" aria-label="Store categories">
            <Link
              href="/store"
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                !active
                  ? "border-moss/40 bg-moss/10 text-moss-bright"
                  : "border-line text-muted hover:border-line-bright hover:text-parchment",
              )}
            >
              All items
            </Link>
            {categories.map((item) => (
              <Link
                key={item.slug}
                href={`/store?category=${item.slug}`}
                className={cx(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                  active?.slug === item.slug
                    ? "border-moss/40 bg-moss/10 text-moss-bright"
                    : "border-line text-muted hover:border-line-bright hover:text-parchment",
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {active ? (
            <div className="mb-8">
              <SectionHeading
                eyebrow="Category"
                title={active.name}
                description={active.description}
                action={
                  <Link href="/store" className="btn btn-quiet btn-sm">
                    Clear filter
                  </Link>
                }
              />
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="panel p-10 text-center">
              <Layers className="mx-auto size-8 text-muted/50" />
              <p className="mt-3 font-display text-lg">Nothing in this category yet.</p>
              <p className="mt-1 text-sm text-muted">
                The store is curated by hand — new items appear with each season.
              </p>
              <Link href="/store" className="btn btn-ghost btn-sm mt-5">
                Back to all items
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  action={
                    <Link href={`/store/${product.slug}`} className="btn btn-ghost btn-sm">
                      View <ArrowRight className="size-3.5" />
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section border-t border-line/60 bg-ink-soft/40">
        <div className="container-x grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Coins come from play",
              body: "Daily rewards, the daily spin, events and in-game activity feed the same ledger. You cannot buy coins with money.",
            },
            {
              title: "Delivered by the core",
              body: "Checkout queues a signed command bundle. KIBAOFFICIALCore pulls it and applies it to your UUID, online or offline.",
            },
            {
              title: "Every coin audited",
              body: "Each credit and debit writes a ledger row with a reason and reference. Staff can trace any balance back to its source.",
            },
          ].map((item) => (
            <div key={item.title} className="panel p-5">
              <h2 className="font-display text-base">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
