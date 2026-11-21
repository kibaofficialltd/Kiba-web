import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { getCurrentUser, isAdmin, isStaff } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/avatar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user.role)) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-ink">
      <header className="border-b border-line/70 bg-ink-soft/60">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-gold/30 bg-gold/[0.08] text-gold">
              <Shield className="size-4" />
            </span>
            <div>
              <p className="font-display text-sm text-parchment">KIBAOFFICIAL Admin</p>
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted">{user.role} console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn btn-quiet btn-sm">
              <ArrowLeft className="size-3.5" /> Player view
            </Link>
            <Avatar name={user.username} size={32} />
          </div>
        </div>
      </header>

      <div className="container-x grid gap-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <AdminNav admin={isAdmin(user.role)} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2 lg:hidden">
            <AdminMobileNav admin={isAdmin(user.role)} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function AdminMobileNav({ admin }: { admin: boolean }) {
  const items = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/tickets", label: "Tickets" },
    ...(admin
      ? [
          { href: "/admin/users", label: "Players" },
          { href: "/admin/products", label: "Products" },
          { href: "/admin/announcements", label: "News" },
          { href: "/admin/events", label: "Events" },
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/audit", label: "Audit" },
        ]
      : []),
  ];
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs text-muted"
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}
