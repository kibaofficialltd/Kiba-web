import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Coins,
  Dices,
  Gift,
  Link2,
  Receipt,
  Sparkles,
  Swords,
  Timer,
  Trophy,
} from "lucide-react";
import { db } from "@/db";
import { notifications as notificationsTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getLinkedAccount } from "@/lib/minecraft";
import { getRewardState } from "@/lib/rewards";
import { getSpinState } from "@/lib/spin";
import { getOrderHistory } from "@/lib/store";
import { formatCoins, formatDateTime, formatNumber, relativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [account, rewards, spin, orders, unread] = await Promise.all([
    getLinkedAccount(user.id),
    getRewardState(user.id),
    getSpinState(user.id),
    getOrderHistory(user.id, 4),
    db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, user.id), isNull(notificationsTable.readAt)))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(4),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Overview</p>
          <h1 className="display-md">Welcome back, {user.username}.</h1>
          <p className="mt-1 text-sm text-muted">
            {account
              ? `Signed in as ${account.username} · ${account.edition} edition`
              : "Link your Minecraft account to unlock rewards and the store."}
          </p>
        </div>
        {rewards.claimedToday && spin.canSpin === false ? (
          <Badge tone="moss">
            <CheckCircle2 className="size-3" /> Daily routine complete
          </Badge>
        ) : (
          <Badge tone="gold">
            <Sparkles className="size-3" /> Rewards available
          </Badge>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel grain relative overflow-hidden p-5 xl:col-span-2">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,169,97,0.14),transparent_60%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-gold/80">
                Coin balance
              </p>
              <p className="mt-1 flex items-center gap-2 font-display text-4xl text-gold-bright">
                <Coins className="size-6" /> {formatNumber(user.balance)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Every balance change is written to your ledger.
              </p>
            </div>
            <Link href="/store" className="btn btn-gold btn-sm">
              Spend <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Streak" value={`${rewards.currentStreak}d`} />
            <MiniStat label="Orders" value={formatNumber(orders.length)} />
            <MiniStat label="Spins" value={formatNumber(spin.history.length)} />
          </div>
        </div>

        <div className="panel flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-moss/10 text-moss">
              <Gift className="size-4" />
            </span>
            <Badge tone={rewards.claimedToday ? "moss" : "gold"}>
              {rewards.claimedToday ? "claimed" : "ready"}
            </Badge>
          </div>
          <div className="mt-4">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
              Daily reward
            </p>
            <p className="font-display text-xl">
              {rewards.claimedToday ? "Come back tomorrow" : `Day ${rewards.nextDayNumber} waiting`}
            </p>
            {rewards.claimedToday && rewards.nextClaimAt ? (
              <p className="mt-0.5 flex items-center gap-1 text-[0.68rem] text-muted">
                <Timer className="size-3" /> <Countdown target={rewards.nextClaimAt} compact />
              </p>
            ) : (
              <Link href="/dashboard/rewards" className="mt-1 inline-flex text-[0.68rem] text-moss hover:text-moss-bright">
                Claim now <ArrowRight className="ml-1 size-3" />
              </Link>
            )}
          </div>
        </div>

        <div className="panel flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-gold/10 text-gold">
              <Dices className="size-4" />
            </span>
            <Badge tone={spin.canSpin ? "gold" : "moss"}>
              {spin.canSpin ? "ready" : "spun"}
            </Badge>
          </div>
          <div className="mt-4">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
              Daily spin
            </p>
            <p className="font-display text-xl">
              {spin.canSpin ? "One spin available" : "Next spin tomorrow"}
            </p>
            {spin.canSpin ? (
              <Link href="/dashboard/spin" className="mt-1 inline-flex text-[0.68rem] text-gold hover:text-gold-bright">
                Spin the wheel <ArrowRight className="ml-1 size-3" />
              </Link>
            ) : spin.nextSpinAt ? (
              <p className="mt-0.5 flex items-center gap-1 text-[0.68rem] text-muted">
                <Timer className="size-3" /> <Countdown target={spin.nextSpinAt} compact />
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <span className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
              <Receipt className="size-3.5 text-moss" /> Recent purchases
            </span>
            <Link href="/dashboard/purchases" className="text-[0.64rem] text-muted hover:text-parchment">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted">No purchases yet.</p>
              <Link href="/store" className="btn btn-ghost btn-sm mt-3">
                Browse the store
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line/50">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-8 place-items-center rounded-md border border-line bg-ink/50 text-muted">
                    <Coins className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-parchment">
                      {order.items.map((item) => item.name).join(", ") || "Order"}
                    </p>
                    <p className="font-mono text-[0.62rem] text-muted">
                      {order.reference} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-gold-bright">
                    −{formatCoins(order.totalCoins)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <span className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
                <Bell className="size-3.5 text-gold" /> Unread
              </span>
              <Link href="/dashboard/notifications" className="text-[0.64rem] text-muted hover:text-parchment">
                All
              </Link>
            </div>
            {unread.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted">You are all caught up.</p>
            ) : (
              <ul className="divide-y divide-line/50">
                {unread.map((notification) => (
                  <li key={notification.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-parchment">{notification.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{notification.body}</p>
                    <p className="mt-1 text-[0.6rem] text-muted/70">
                      {relativeTime(notification.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-5">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
              Quick actions
            </p>
            <div className="mt-3 grid gap-2">
              <QuickLink href="/store" icon={<Coins className="size-4" />} label="Coin store" />
              <QuickLink href="/leaderboards" icon={<Trophy className="size-4" />} label="Leaderboards" />
              <QuickLink href="/dashboard/statistics" icon={<Swords className="size-4" />} label="My statistics" />
              <QuickLink href="/dashboard/link" icon={<Link2 className="size-4" />} label="Minecraft linking" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-ink/40 px-2 py-2">
      <p className="font-display text-base text-parchment">{value}</p>
      <p className="text-[0.55rem] uppercase tracking-[0.14em] text-muted">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg border border-line bg-ink/30 px-3 py-2 text-sm text-parchment-dim transition hover:border-moss/30 hover:text-parchment"
    >
      <span className="text-muted">{icon}</span>
      {label}
      <ArrowRight className="ml-auto size-3.5 text-muted" />
    </Link>
  );
}
