import { redirect } from "next/navigation";
import Link from "next/link";
import { and, count, eq, isNull } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, Coins } from "lucide-react";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getLinkedAccount } from "@/lib/minecraft";
import { DashboardMobileNav, DashboardNav } from "@/components/dashboard/sidebar";
import { RankBadge } from "@/components/rank-badge";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const [account, unreadRows] = await Promise.all([
    getLinkedAccount(user.id),
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
  ]);
  const unread = Number(unreadRows[0]?.value ?? 0);

  return (
    <div className="container-x py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[92px] space-y-6">
            <div className="panel p-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.username} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-display text-base text-parchment">{user.username}</p>
                  <p className="truncate text-[0.66rem] uppercase tracking-[0.14em] text-muted">
                    {account ? `${account.edition} · linked` : "unlinked account"}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-gold/20 bg-gold/[0.05] px-3 py-2.5">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-gold/80">
                  Coin balance
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 font-display text-xl text-gold-bright">
                  <Coins className="size-4" /> {formatNumber(user.balance)}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <RankBadge role={user.role} size="sm" />
              </div>
            </div>

            <DashboardNav notifications={unread} staff={isStaff(user.role)} />
          </div>
        </aside>

        <div className="min-w-0">
          <DashboardMobileNav notifications={unread} staff={isStaff(user.role)} />

          {!account ? (
            <Banner
              icon={<AlertTriangle className="size-4" />}
              tone="moss"
              title="Link your Minecraft account"
              action={{ href: "/dashboard/link", label: "Link now" }}
            >
              Verify your in-game identity to unlock daily rewards, the coin store and leaderboards.
            </Banner>
          ) : (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-[0.66rem] text-muted">
              <CheckCircle2 className="size-3.5 text-moss" />
              Linked as <span className="font-semibold text-parchment">{account.username}</span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase">
                {account.edition}
              </span>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

function Banner({
  icon,
  title,
  children,
  action,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action: { href: string; label: string };
  tone: "gold" | "moss";
}) {
  return (
    <div
      className={
        tone === "gold"
          ? "mb-5 flex flex-wrap items-start gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3"
          : "mb-5 flex flex-wrap items-start gap-3 rounded-xl border border-moss/25 bg-moss/[0.06] px-4 py-3"
      }
    >
      <span className={tone === "gold" ? "mt-0.5 text-gold" : "mt-0.5 text-moss-bright"}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-parchment">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{children}</p>
      </div>
      <Link href={action.href} className="btn btn-ghost btn-sm">
        {action.label}
      </Link>
    </div>
  );
}
