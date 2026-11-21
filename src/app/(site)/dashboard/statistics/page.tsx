import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowRight, Blocks, CalendarDays, Coins, Crosshair, Link2, Skull, Swords, Timer, Trophy } from "lucide-react";
import { db } from "@/db";
import { playerStats } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getLinkedAccount } from "@/lib/minecraft";
import { getPublicPlayer } from "@/lib/queries";
import { formatDate, formatNumber, formatPlaytime, relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "My statistics" };
export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const account = await getLinkedAccount(user.id);
  if (!account) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <Link2 className="mx-auto size-8 text-muted/50" />
        <h1 className="display-md mt-4">No stats without a link.</h1>
        <p className="mt-2 text-sm text-muted">
          Statistics are tied to your Minecraft UUID. Link your account and the core plugin will
          start syncing playtime, kills and builds.
        </p>
        <Link href="/dashboard/link" className="btn btn-primary mt-6">
          Link Minecraft <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  const [rows, profile] = await Promise.all([
    db.select().from(playerStats).where(eq(playerStats.uuid, account.uuid)).limit(1),
    getPublicPlayer(account.username),
  ]);
  const stats = rows[0] ?? null;
  const kd = stats ? (stats.kills + 1) / (stats.deaths + 1) : 0;
  const winRate =
    stats && stats.wins + stats.losses > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Statistics</p>
          <h1 className="display-md">Your record on the network.</h1>
          <p className="mt-1 text-sm text-muted">
            Synced from KIBAOFFICIALCore for <span className="text-parchment">{account.username}</span>
            {stats?.updatedAt ? ` · last sync ${relativeTime(stats.updatedAt)}` : ""}.
          </p>
        </div>
        {profile ? (
          <Link href={`/player/${encodeURIComponent(account.username)}`} className="btn btn-ghost btn-sm">
            Public profile <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={<Timer className="size-4" />} label="Playtime" value={formatPlaytime(stats?.playtimeSeconds ?? 0)} tone="sky" />
        <Stat icon={<Swords className="size-4" />} label="PvP kills" value={formatNumber(stats?.kills ?? 0)} note={`${formatNumber(stats?.deaths ?? 0)} deaths`} tone="ember" />
        <Stat icon={<Crosshair className="size-4" />} label="K/D ratio" value={kd.toFixed(2)} tone="moss" />
        <Stat icon={<Skull className="size-4" />} label="Mob kills" value={formatNumber(stats?.mobKills ?? 0)} tone="moss" />
        <Stat icon={<Trophy className="size-4" />} label="Wins" value={formatNumber(stats?.wins ?? 0)} note={`${winRate.toFixed(0)}% win rate`} tone="gold" />
        <Stat icon={<Swords className="size-4" />} label="Best killstreak" value={formatNumber(stats?.bestKillstreak ?? 0)} note={`current ${formatNumber(stats?.killstreak ?? 0)}`} tone="gold" />
        <Stat icon={<Blocks className="size-4" />} label="Blocks placed" value={formatNumber(stats?.blocksPlaced ?? 0)} tone="sky" />
        <Stat icon={<Blocks className="size-4" />} label="Blocks broken" value={formatNumber(stats?.blocksBroken ?? 0)} tone="sky" />
        <Stat icon={<Coins className="size-4" />} label="Coin balance" value={formatNumber(user.balance)} note="portal ledger" tone="gold" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-lg">Rankings</h2>
          <p className="mt-1 text-xs text-muted">
            Derived from synced server statistics — not from the browser.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <RankRow label="Richest" value={profile ? `#${profile.ranks.richest}` : "—"} />
            <RankRow label="PvP kills" value={profile ? `#${profile.ranks.kills}` : "—"} />
            <RankRow label="Playtime" value={profile ? `#${profile.ranks.playtime}` : "—"} />
          </dl>
          <Link href="/leaderboards" className="btn btn-ghost btn-sm mt-5 w-full">
            <Trophy className="size-3.5" /> Leaderboards
          </Link>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg">Profile facts</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <RankRow label="Edition" value={account.edition} />
            <RankRow label="Rank" value={stats?.rank ?? "Member"} />
            <RankRow label="First joined" value={stats?.firstJoinedAt ? formatDate(stats.firstJoinedAt) : "—"} />
            <RankRow label="Last seen" value={stats?.lastSeenAt ? relativeTime(stats.lastSeenAt) : "—"} />
            <RankRow label="UUID" value={account.uuid.slice(0, 8) + "…"} mono />
          </dl>
          <p className="mt-4 flex items-start gap-2 text-[0.66rem] leading-relaxed text-muted">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
            If a number looks stale, the server has not pushed a heartbeat recently. The site
            deliberately shows the last real value instead of guessing.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({
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
    tone === "gold" ? "text-gold" : tone === "sky" ? "text-sky" : tone === "ember" ? "text-ember" : "text-moss";
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

function RankRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/40 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-parchment-dim" : "text-parchment-dim"}>{value}</dd>
    </div>
  );
}
