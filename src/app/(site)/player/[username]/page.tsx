import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Blocks,
  CalendarDays,
  Coins,
  Crosshair,
  Crown,
  Globe2,
  Skull,
  Swords,
  Timer,
  Trophy,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { getPublicPlayer } from "@/lib/queries";
import { formatCoins, formatDate, formatNumber, formatPlaytime, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const player = await getPublicPlayer(username);
  if (!player) return { title: "Player not found" };
  return {
    title: `${player.account.username} · Player profile`,
    description: `Stats, ranks and balance for ${player.account.username} on KIBAOFFICIAL SMP.`,
    alternates: { canonical: `/player/${player.account.username}` },
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const player = await getPublicPlayer(decodeURIComponent(username));
  if (!player) notFound();

  const { account, stats, ranks } = player;
  const kd = stats ? (stats.kills + 1) / (stats.deaths + 1) : 0;
  const winRate =
    stats && stats.wins + stats.losses > 0
      ? (stats.wins / (stats.wins + stats.losses)) * 100
      : 0;

  return (
    <div className="container-x py-10 sm:py-14">
      <section className="panel grain relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(111,174,123,0.12),transparent_60%)]" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar name={account.username} size={96} className="rounded-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="moss">
                <Globe2 className="size-3" /> {account.edition}
              </Badge>
              {stats?.rank ? <Badge tone="gold">{stats.rank}</Badge> : null}
              {account.role !== "player" ? <Badge tone="sky">{account.role}</Badge> : null}
            </div>
            <h1 className="display-xl mt-2 break-words">{account.username}</h1>
            <p className="mt-1 text-xs text-muted">
              Linked {formatDate(account.linkedAt)} · last seen{" "}
              {stats?.lastSeenAt ? relativeTime(stats.lastSeenAt) : "not yet"}
            </p>
            <p className="mt-2 break-all font-mono text-[0.66rem] text-muted/70">{account.uuid}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-auto">
            <RankChip label="Richest" value={`#${ranks.richest}`} icon={<Coins className="size-3.5" />} />
            <RankChip label="Kills" value={`#${ranks.kills}`} icon={<Swords className="size-3.5" />} />
            <RankChip label="Playtime" value={`#${ranks.playtime}`} icon={<Timer className="size-3.5" />} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <section className="panel p-5">
          <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
            Balance
          </h2>
          <p className="mt-1 flex items-center gap-2 font-display text-3xl text-gold-bright">
            <Coins className="size-5" /> {formatCoins(account.balance)}
          </p>
          <p className="mt-1 text-xs text-muted">coins on the network ledger</p>

          <div className="mt-5 space-y-2 border-t border-line/60 pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">First joined</span>
              <span className="text-parchment-dim">
                {stats?.firstJoinedAt ? formatDate(stats.firstJoinedAt) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Portal account</span>
              <span className="text-parchment-dim">{account.websiteUsername}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Profile synced</span>
              <span className="text-parchment-dim">
                {stats?.updatedAt ? relativeTime(stats.updatedAt) : "never"}
              </span>
            </div>
          </div>

          <Link href="/leaderboards" className="btn btn-ghost btn-sm mt-5 w-full">
            <Trophy className="size-3.5" /> Full leaderboards
          </Link>
        </section>

        <section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Timer className="size-4" />}
              label="Playtime"
              value={stats ? formatPlaytime(stats.playtimeSeconds) : "—"}
              tone="sky"
            />
            <StatCard
              icon={<Swords className="size-4" />}
              label="PvP kills"
              value={stats ? formatNumber(stats.kills) : "—"}
              note={stats ? `${formatNumber(stats.deaths)} deaths` : undefined}
              tone="ember"
            />
            <StatCard
              icon={<Crosshair className="size-4" />}
              label="K/D ratio"
              value={stats ? kd.toFixed(2) : "—"}
              tone="moss"
            />
            <StatCard
              icon={<Skull className="size-4" />}
              label="Mob kills"
              value={stats ? formatNumber(stats.mobKills) : "—"}
              tone="moss"
            />
            <StatCard
              icon={<Crown className="size-4" />}
              label="Best killstreak"
              value={stats ? formatNumber(stats.bestKillstreak) : "—"}
              tone="gold"
            />
            <StatCard
              icon={<Trophy className="size-4" />}
              label="Wins"
              value={stats ? formatNumber(stats.wins) : "—"}
              note={stats ? `${winRate.toFixed(0)}% win rate` : undefined}
              tone="gold"
            />
            <StatCard
              icon={<Blocks className="size-4" />}
              label="Blocks placed"
              value={stats ? formatNumber(stats.blocksPlaced) : "—"}
              tone="sky"
            />
            <StatCard
              icon={<Blocks className="size-4" />}
              label="Blocks broken"
              value={stats ? formatNumber(stats.blocksBroken) : "—"}
              tone="sky"
            />
            <StatCard
              icon={<CalendarDays className="size-4" />}
              label="Games played"
              value={stats ? formatNumber(stats.wins + stats.losses) : "—"}
              tone="moss"
            />
          </div>

          {!stats || stats.updatedAt < new Date(Date.now() - 7 * 86_400_000) ? (
            <p className="mt-3 text-[0.68rem] text-muted">
              Statistics shown are the last values reported by KIBAOFFICIALCore. The plugin syncs
              on a schedule and whenever a player leaves the server.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function RankChip({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-ink/50 px-3 py-2 text-center">
      <span className="mx-auto text-muted">{icon}</span>
      <p className="mt-1 font-display text-base text-parchment">{value}</p>
      <p className="text-[0.55rem] uppercase tracking-[0.12em] text-muted">{label}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  tone: "moss" | "gold" | "sky" | "ember";
}) {
  const color =
    tone === "gold"
      ? "text-gold"
      : tone === "sky"
        ? "text-sky"
        : tone === "ember"
          ? "text-ember"
          : "text-moss";
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl text-parchment">{value}</p>
      {note ? <p className="text-[0.62rem] text-muted">{note}</p> : null}
    </div>
  );
}
