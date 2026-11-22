import Link from "next/link";
import {
  CalendarDays,
  Coins,
  Crown,
  Gift,
  Key,
  Package,
  Sparkles,
  Star,
  Swords,
  Ticket,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { formatCoins, formatDate } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/queries";
import { cx } from "@/lib/cx";

/* ----------------------------------------------------------- Product art */

const categoryIcons: Record<string, typeof Crown> = {
  ranks: Crown,
  keys: Key,
  coins: Coins,
  cosmetics: Sparkles,
  items: Swords,
  bundles: Package,
  seasonal: Star,
  exclusive: Trophy,
};

const categoryGradients: Record<string, string> = {
  ranks: "from-[#3a2f16] via-[#151c14] to-[#0a0f0c]",
  keys: "from-[#173331] via-[#101d18] to-[#0a0f0c]",
  coins: "from-[#3a3018] via-[#1a1a12] to-[#0a0f0c]",
  cosmetics: "from-[#2a1f35] via-[#171420] to-[#0a0f0c]",
  items: "from-[#33201c] via-[#1c1512] to-[#0a0f0c]",
  bundles: "from-[#1c2e35] via-[#121c20] to-[#0a0f0c]",
  seasonal: "from-[#253242] via-[#151c24] to-[#0a0f0c]",
  exclusive: "from-[#3a2a12] via-[#1e1810] to-[#0a0f0c]",
};

export function ProductArt({
  name,
  categorySlug,
  image,
  className,
  showName = false,
}: {
  name: string;
  categorySlug?: string | null;
  image?: string | null;
  className?: string;
  showName?: boolean;
}) {
  const Icon = categoryIcons[categorySlug ?? ""] ?? Package;
  const gradient = categoryGradients[categorySlug ?? ""] ?? "from-[#1b2a22] via-[#111a15] to-[#0a0f0c]";

  if (image) {
    return (
      <div className={cx("relative overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="size-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={cx(
        "grain relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        gradient,
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(233,228,216,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(233,228,216,0.5)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <Icon className="relative size-14 text-parchment/25" strokeWidth={1.1} />
      {showName ? (
        <span className="absolute bottom-3 left-0 right-0 truncate px-4 text-center font-display text-xs uppercase tracking-[0.18em] text-parchment/50">
          {name}
        </span>
      ) : null}
    </div>
  );
}

export function ProductCard({
  product,
  action,
}: {
  product: {
    slug: string;
    name: string;
    tagline: string;
    priceCoins: number;
    compareAtCoins?: number | null;
    badge?: string | null;
    image?: string | null;
    category?: string | null;
    categorySlug?: string | null;
  };
  action?: React.ReactNode;
}) {
  const discount =
    product.compareAtCoins && product.compareAtCoins > product.priceCoins
      ? Math.round(((product.compareAtCoins - product.priceCoins) / product.compareAtCoins) * 100)
      : null;

  return (
    <article className="panel panel-interactive group flex flex-col overflow-hidden">
      <Link href={`/store/${product.slug}`} className="relative block">
        <ProductArt
          name={product.name}
          categorySlug={product.categorySlug}
          image={product.image}
          className="aspect-square w-full object-cover"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.badge ? <Badge tone="gold">{product.badge}</Badge> : null}
          {discount ? <Badge tone="ember">−{discount}%</Badge> : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-moss">
          {product.category ?? "Store"}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-snug text-parchment">
          <Link href={`/store/${product.slug}`} className="transition hover:text-gold-bright">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{product.tagline}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="flex items-center gap-1.5 font-display text-xl text-gold-bright">
                <Coins className="size-4" /> {formatCoins(product.priceCoins)}
              </span>
              {product.compareAtCoins && product.compareAtCoins > product.priceCoins ? (
                <span className="text-xs text-muted line-through">
                  {formatCoins(product.compareAtCoins)}
                </span>
              ) : null}
            </div>
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">coins</p>
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------- Announcements */

export const announcementLabels: Record<string, string> = {
  update: "Server update",
  feature: "New feature",
  maintenance: "Maintenance",
  event: "Event",
  giveaway: "Giveaway",
  notice: "Notice",
};

export function AnnouncementCard({
  post,
  featured,
}: {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    coverImage: string | null;
    publishedAt: Date;
    author: string | null;
    pinned?: boolean;
  };
  featured?: boolean;
}) {
  return (
    <article className={cx("panel panel-interactive group flex flex-col overflow-hidden", featured && "md:flex-row")}>
      <div className={cx("relative overflow-hidden", featured ? "md:w-2/5" : "")}>
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt=""
            className={cx("w-full object-cover", featured ? "h-44 md:h-full" : "h-40")}
            loading="lazy"
          />
        ) : (
          <div
            className={cx(
              "grain flex w-full items-center justify-center bg-gradient-to-br from-[#1a2a21] via-[#111a15] to-[#0a0f0c]",
              featured ? "h-44 md:h-full" : "h-40",
            )}
          >
            <Ticket className="size-10 text-parchment/15" strokeWidth={1.2} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Badge tone="moss">{announcementLabels[post.category] ?? post.category}</Badge>
          {post.pinned ? <Badge tone="gold">Pinned</Badge> : null}
        </div>
        <h3 className="mt-3 font-display text-lg leading-snug">
          <Link href={`/news/${post.slug}`} className="transition group-hover:text-gold-bright">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
        <div className="mt-auto flex items-center gap-2 pt-4 text-[0.68rem] text-muted">
          <CalendarDays className="size-3" />
          {formatDate(post.publishedAt)}
          {post.author ? <span className="opacity-50">· {post.author}</span> : null}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------- Events */

export function EventCard({
  event,
  countdown,
  action,
}: {
  event: {
    slug: string;
    title: string;
    description: string;
    type: string;
    status: string;
    startsAt: Date;
    prize: string | null;
    winner: string | null;
  };
  countdown?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <article className="panel panel-interactive flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={event.type === "giveaway" ? "gold" : "moss"}>
          {event.type === "giveaway" ? <Gift className="size-3" /> : <Trophy className="size-3" />}
          {event.type}
        </Badge>
        <Badge tone={event.status === "active" ? "moss" : event.status === "completed" ? "sky" : "default"}>
          {event.status}
        </Badge>
      </div>
      <h3 className="mt-3 font-display text-lg leading-snug">
        <Link href={`/events/${event.slug}`} className="transition hover:text-gold-bright">
          {event.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{event.description}</p>
      {event.prize ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gold">
          <Trophy className="size-3" /> {event.prize}
        </p>
      ) : null}
      {event.winner ? (
        <p className="mt-2 text-xs text-moss-bright">Winner: {event.winner}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        {countdown}
        {action}
      </div>
    </article>
  );
}

/* --------------------------------------------------------- Leaderboard */

export function LeaderboardRow({ entry, metric }: { entry: LeaderboardEntry; metric: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line/50 px-4 py-3 last:border-0">
      <span className="w-7 font-mono text-xs text-muted">#{entry.rank}</span>
      <Avatar name={entry.username} size={30} />
      <div className="min-w-0 flex-1">
        {entry.href ? (
          <Link href={entry.href} className="block truncate text-sm font-semibold transition hover:text-moss-bright">
            {entry.username}
          </Link>
        ) : (
          <span className="block truncate text-sm font-semibold">{entry.username}</span>
        )}
      </div>
      <span className="font-mono text-sm tabular-nums text-parchment-dim">
        {entry.value.toLocaleString("en-IN")}
        <span className="ml-1 text-[0.6rem] uppercase text-muted">{metric}</span>
      </span>
    </div>
  );
}
