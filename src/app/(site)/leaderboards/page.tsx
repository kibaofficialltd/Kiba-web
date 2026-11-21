import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Swords, Timer, Trophy } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { getLeaderboard, type LeaderboardCategory } from "@/lib/queries";
import { formatNumber, formatPlaytime } from "@/lib/format";
import { cx } from "@/lib/cx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboards",
  description:
    "Live KIBAOFFICIAL SMP standings — richest players, playtime, PvP kills, killstreaks, mob kills and wins. Read directly from the server's synced statistics.",
  alternates: { canonical: "/leaderboards" },
};

const tabs: Array<{ id: LeaderboardCategory; label: string; blurb: string }> = [
  { id: "richest", label: "Richest", blurb: "Coin balances on the portal ledger" },
  { id: "playtime", label: "Playtime", blurb: "Time survived on the network" },
  { id: "kills", label: "PvP kills", blurb: "Player kills recorded by the core" },
  { id: "killstreak", label: "Killstreak", blurb: "Best uninterrupted kill streak" },
  { id: "mobkills", label: "Mob kills", blurb: "Hostile and passive mob kills" },
  { id: "wins", label: "Wins", blurb: "Arena and event victories" },
  { id: "pvp", label: "K/D", blurb: "Kill-to-death ratio, ties broken by kills" },
];

function isCategory(value: string | undefined): value is LeaderboardCategory {
  return tabs.some((tab) => tab.id === value);
}

function metricValue(category: LeaderboardCategory, value: number, label: string): string {
  if (category === "playtime") return formatPlaytime(value);
  if (category === "pvp") return value.toFixed(2);
  if (category === "richest") return formatNumber(value);
  return formatNumber(value);
}

const podiumStyles = [
  "border-gold/40 bg-gold/[0.05]",
  "border-line-bright/60 bg-white/[0.025]",
  "border-[#8a6a3f]/40 bg-[#8a6a3f]/[0.05]",
];

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: raw } = await searchParams;
  const category: LeaderboardCategory = isCategory(raw) ? raw : "richest";
  const entries = await getLeaderboard(category, 25);
  const activeTab = tabs.find((tab) => tab.id === category)!;
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="mb-8">
        <p className="eyebrow mb-2">Standings</p>
        <h1 className="display-xl text-balance">The names that matter.</h1>
        <p className="lede mt-4 max-w-2xl">
          {activeTab.blurb}. Statistics are pushed by KIBAOFFICIALCore and update with each
          heartbeat — when the server is offline, these standings are the last synced snapshot.
        </p>
      </header>

      <div className="mb-8 overflow-x-auto">
        <div className="flex min-w-max gap-1.5" role="tablist" aria-label="Leaderboard category">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/leaderboards?category=${tab.id}`}
              role="tab"
              aria-selected={tab.id === category}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                tab.id === category
                  ? "border-moss/40 bg-moss/10 text-moss-bright"
                  : "border-line text-muted hover:border-line-bright hover:text-parchment",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="panel p-10 text-center">
          <Trophy className="mx-auto size-8 text-muted/40" />
          <h2 className="mt-3 font-display text-xl">No standings yet.</h2>
          <p className="mt-1 text-sm text-muted">
            {category === "richest"
              ? "Link your Minecraft account and start earning coins to claim the first spot."
              : "The server has not synced statistics for this category yet. Check back after the next heartbeat."}
          </p>
          <Link href="/dashboard/link" className="btn btn-primary btn-sm mt-5">
            Link your account
          </Link>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="grid gap-3 sm:grid-cols-3">
            {podium.map((entry, index) => (
              <div
                key={entry.username}
                className={cx(
                  "panel relative overflow-hidden p-5",
                  podiumStyles[index],
                  index === 0 && "sm:order-2",
                  index === 1 && "sm:order-1",
                  index === 2 && "sm:order-3",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
                    {index === 0 ? <Crown className="size-3.5 text-gold" /> : <Trophy className="size-3.5" />}
                    Rank {entry.rank}
                  </span>
                  {index === 0 ? <Badge tone="gold">Leader</Badge> : null}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar name={entry.username} size={index === 0 ? 56 : 46} />
                  <div className="min-w-0">
                    <Link
                      href={entry.href ?? "#"}
                      className="block truncate font-display text-lg text-parchment transition hover:text-gold-bright"
                    >
                      {entry.username}
                    </Link>
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                      {entry.label}
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-display text-3xl text-gold-bright">
                  {metricValue(category, entry.value, entry.label)}
                </p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="panel mt-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <span className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-parchment">
                {category === "pvp" || category === "kills" ? (
                  <Swords className="size-3.5 text-ember" />
                ) : category === "playtime" ? (
                  <Timer className="size-3.5 text-sky" />
                ) : (
                  <Crown className="size-3.5 text-gold" />
                )}
                {activeTab.label}
              </span>
              <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                Top {entries.length}
              </span>
            </div>

            {rest.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-16">Rank</th>
                      <th>Player</th>
                      <th className="text-right">Score</th>
                      <th className="hidden text-right sm:table-cell">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry) => (
                      <tr key={`${entry.rank}-${entry.username}`}>
                        <td className="font-mono text-xs text-muted">#{entry.rank}</td>
                        <td>
                          <Link
                            href={entry.href ?? "#"}
                            className="flex items-center gap-2.5 text-sm font-semibold transition hover:text-moss-bright"
                          >
                            <Avatar name={entry.username} size={26} />
                            <span className="truncate">{entry.username}</span>
                          </Link>
                        </td>
                        <td className="text-right font-mono tabular-nums text-parchment">
                          {metricValue(category, entry.value, entry.label)}
                        </td>
                        <td className="hidden text-right text-xs text-muted sm:table-cell">
                          {entry.label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-center text-[0.68rem] text-muted">
            Showing {entries.length} of the top players. Statistics are reported by
            KIBAOFFICIALCore — never generated by the website.
          </p>
        </>
      )}
    </div>
  );
}
