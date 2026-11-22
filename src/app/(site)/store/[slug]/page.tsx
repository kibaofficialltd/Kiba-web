import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Coins, Layers, Package, ShieldCheck, Timer, Zap } from "lucide-react";
import { ProductArt, ProductCard } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, getProducts } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getLinkedAccount } from "@/lib/minecraft";
import { formatCoins, formatNumber } from "@/lib/format";
import { AddToCart } from "./add-to-cart";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.tagline || product.description.slice(0, 160),
    alternates: { canonical: `/store/${product.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [user, related] = await Promise.all([getCurrentUser(), getProducts()]);
  const account = user ? await getLinkedAccount(user.id) : null;
  const siblings = related
    .filter((item) => item.id !== product.id && item.categorySlug === product.categorySlug)
    .slice(0, 4);

  const outOfStock = product.stock !== null && product.stock <= 0;
  const discount =
    product.compareAtCoins && product.compareAtCoins > product.priceCoins
      ? Math.round(((product.compareAtCoins - product.priceCoins) / product.compareAtCoins) * 100)
      : null;

  return (
    <div className="container-x py-10 sm:py-14">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/store" className="inline-flex items-center gap-1.5 transition hover:text-parchment">
          <ArrowLeft className="size-3.5" /> Store
        </Link>
        <span aria-hidden="true">/</span>
        {product.categorySlug ? (
          <Link href={`/store?category=${product.categorySlug}`} className="transition hover:text-parchment">
            {product.category}
          </Link>
        ) : (
          <span>{product.category ?? "Item"}</span>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-parchment-dim">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel overflow-hidden">
          <ProductArt
            name={product.name}
            categorySlug={product.categorySlug}
            image={product.image}
            className="aspect-square w-full"
            showName
          />
          <div className="grid grid-cols-3 divide-x divide-line/60 border-t border-line/60 text-center">
            <Feature icon={<Zap className="size-3.5" />} label="Instant delivery" />
            <Feature icon={<ShieldCheck className="size-3.5" />} label="UUID verified" />
            <Feature icon={<Timer className="size-3.5" />} label="Claim on join" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="moss">{product.category ?? "Store"}</Badge>
            {product.badge ? <Badge tone="gold">{product.badge}</Badge> : null}
            {discount ? <Badge tone="ember">−{discount}%</Badge> : null}
            {outOfStock ? <Badge tone="ember">Out of stock</Badge> : null}
          </div>

          <h1 className="display-lg mt-3 text-balance">{product.name}</h1>
          <p className="lede mt-3 text-pretty">{product.tagline}</p>

          <div className="mt-6 flex flex-wrap items-end gap-4 border-y border-line/60 py-5">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="flex items-center gap-2 font-display text-3xl text-gold-bright">
                  <Coins className="size-5" /> {formatCoins(product.priceCoins)}
                </span>
                {product.compareAtCoins && product.compareAtCoins > product.priceCoins ? (
                  <span className="text-sm text-muted line-through">
                    {formatCoins(product.compareAtCoins)}
                  </span>
                ) : null}
              </div>
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">coins</p>
            </div>

            <div className="ml-auto text-right text-xs text-muted">
              {user ? (
                <>
                  <p className="text-[0.6rem] uppercase tracking-[0.16em]">Your balance</p>
                  <p className="font-mono text-base text-parchment">{formatNumber(user.balance)}</p>
                  {!account ? <p className="mt-0.5 text-gold">Link required</p> : null}
                </>
              ) : (
                <p>Sign in to purchase</p>
              )}
            </div>
          </div>

          <div className="prose-kiba mt-6 text-sm">
            <p>{product.description}</p>
          </div>

          <div className="mt-4 space-y-2 text-xs text-muted">
            {product.perPlayerLimit !== null ? (
              <p className="flex items-center gap-2">
                <Layers className="size-3.5" /> Limited to {product.perPlayerLimit} per player.
              </p>
            ) : null}
            {product.stock !== null ? (
              <p className="flex items-center gap-2">
                <Package className="size-3.5" />
                {product.stock > 0 ? `${product.stock} remaining this season.` : "Sold out."}
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-moss" /> Coins are deducted only after every
              check passes.
            </p>
          </div>

          <div className="mt-6">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceCoins: product.priceCoins,
                categorySlug: product.categorySlug,
                image: product.image,
                stock: product.stock,
              }}
              disabled={outOfStock || !product.active}
              signedIn={Boolean(user)}
            />
          </div>

          <div className="mt-6 rounded-xl border border-gold/20 bg-gold/[0.04] p-4 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-gold">No real money changes hands.</p>
            <p className="mt-1">
              The store is a coin sink. If your purchase cannot be delivered because your link was
              removed, contact support — the order stays on record and staff can re-queue it.
            </p>
          </div>
        </div>
      </div>

      {siblings.length > 0 ? (
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">More in {product.category}</p>
              <h2 className="display-md">Pairs well with.</h2>
            </div>
            <Link href={`/store?category=${product.categorySlug}`} className="btn btn-ghost btn-sm">
              View category
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siblings.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="px-2 py-3">
      <span className="mx-auto grid size-7 place-items-center rounded-md bg-ink/60 text-moss">{icon}</span>
      <p className="mt-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-muted">{label}</p>
    </div>
  );
}
