"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Coins,
  Dices,
  Gift,
  LayoutDashboard,
  Link2,
  Receipt,
  Settings,
  Shield,
  Swords,
} from "lucide-react";
import { cx } from "@/lib/cx";

const groups = [
  {
    label: "Account",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badgeKey: "notifications" as const },
    ],
  },
  {
    label: "Rewards",
    items: [
      { href: "/dashboard/rewards", label: "Daily rewards", icon: Gift },
      { href: "/dashboard/spin", label: "Daily spin", icon: Dices },
    ],
  },
  {
    label: "Player",
    items: [
      { href: "/dashboard/statistics", label: "Statistics", icon: Swords },
      { href: "/dashboard/purchases", label: "My purchases", icon: Receipt },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/dashboard/link", label: "Minecraft linking", icon: Link2 },
      { href: "/dashboard/settings", label: "Account settings", icon: Settings },
    ],
  },
];

export function DashboardNav({
  notifications,
  staff,
}: {
  notifications: number;
  staff: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Dashboard" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-muted/70">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "border border-moss/25 bg-moss/10 text-parchment"
                        : "border border-transparent text-muted hover:bg-white/[0.03] hover:text-parchment",
                    )}
                  >
                    <item.icon
                      className={cx("size-4", active ? "text-moss-bright" : "text-muted group-hover:text-parchment-dim")}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badgeKey && notifications > 0 ? (
                      <span className="rounded-full bg-gold px-1.5 py-0.5 text-[0.6rem] font-bold text-ink">
                        {notifications > 9 ? "9+" : notifications}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {staff ? (
        <div>
          <p className="mb-2 px-3 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-muted/70">
            Staff
          </p>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-lg border border-gold/20 bg-gold/[0.06] px-3 py-2 text-sm text-gold-bright transition hover:bg-gold/10"
          >
            <Shield className="size-4" /> Admin panel
          </Link>
        </div>
      ) : null}

      <div className="border-t border-line/60 pt-4">
        <Link
          href="/store"
          className="flex items-center justify-between rounded-lg border border-line bg-ink/40 px-3 py-2.5 text-xs text-parchment-dim transition hover:border-gold/40"
        >
          <span className="flex items-center gap-2">
            <Coins className="size-4 text-gold" /> Spend coins
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">Store</span>
        </Link>
      </div>
    </nav>
  );
}

export function DashboardMobileNav({ notifications, staff }: { notifications: number; staff: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/rewards", label: "Rewards" },
    { href: "/dashboard/spin", label: "Spin" },
    { href: "/dashboard/statistics", label: "Stats" },
    { href: "/dashboard/purchases", label: "Purchases" },
    { href: "/dashboard/link", label: "Linking" },
    { href: "/dashboard/settings", label: "Settings" },
    ...(notifications > 0 ? [{ href: "/dashboard/notifications", label: `Alerts (${notifications})` }] : []),
    ...(staff ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="-mx-4 mb-6 overflow-x-auto border-b border-line/60 px-4 lg:hidden">
      <div className="flex gap-1.5 pb-3">
        {items.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-moss/40 bg-moss/10 text-moss-bright"
                  : "border-line text-muted hover:text-parchment",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
