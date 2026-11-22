"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  FileText,
  Gauge,
  Image as ImageIcon,
  LifeBuoy,
  Package,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { cx } from "@/lib/cx";

const groups = [
  {
    label: "Operations",
    adminOnly: false,
    items: [
      { href: "/admin", label: "Overview", icon: Gauge },
      { href: "/admin/tickets", label: "Support tickets", icon: LifeBuoy },
    ],
  },
  {
    label: "Community",
    adminOnly: true,
    items: [
      { href: "/admin/banners", label: "Top Banners", icon: ImageIcon },
      { href: "/admin/users", label: "Players", icon: Users },
      { href: "/admin/products", label: "Store products", icon: Package },
      { href: "/admin/announcements", label: "Announcements", icon: FileText },
      { href: "/admin/guides", label: "Guides & Wiki", icon: BookOpen },
      { href: "/admin/events", label: "Events", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    adminOnly: true,
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText },
    ],
  },
] as const;

export function AdminNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Admin" className="space-y-5">
      {groups.map((group) => {
        if (group.adminOnly && !admin) return null;
        return (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-muted/60">
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
                        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm transition",
                        active
                          ? "border-gold/25 bg-gold/[0.08] text-parchment"
                          : "border-transparent text-muted hover:bg-white/[0.03] hover:text-parchment",
                      )}
                    >
                      <item.icon className={cx("size-4", active ? "text-gold" : "text-muted")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="rounded-lg border border-gold/20 bg-gold/[0.04] p-3 text-[0.66rem] leading-relaxed text-muted">
        <p className="flex items-center gap-1.5 font-semibold text-gold">
          <Shield className="size-3" /> Staff actions are audited
        </p>
        <p className="mt-1">Every role change, balance adjustment and ticket reply is logged.</p>
      </div>
    </nav>
  );
}
