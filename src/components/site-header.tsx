"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Coins,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  ShoppingBag,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useCart } from "@/components/store/cart-provider";
import { site } from "@/lib/site";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { RankBadge } from "@/components/rank-badge";

export type HeaderUser = {
  username: string;
  role: string;
  balance: number;
  avatar: string;
};

export function SiteHeader({ logoSrc, user }: { logoSrc: string | null; user: HeaderUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || mobileOpen
          ? "border-b border-line/80 bg-ink/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link href="/" aria-label="KIBAOFFICIAL SMP home" className="relative z-10 flex items-center">
          <Logo src={logoSrc} imgClassName="h-9 sm:h-10 md:h-11 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              data-active={isActive(item.href)}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CartButton />
          {user ? (
            <div className="relative hidden lg:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 rounded-full border border-line bg-surface/60 py-1 pl-1 pr-3 transition hover:border-line-bright"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt="" className="size-8 rounded-full" width={32} height={32} />
                <span className="text-left">
                  <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold leading-tight text-parchment">
                    <span>{user.username}</span>
                    <RankBadge role={user.role} size="xs" />
                  </span>
                  <span className="flex items-center gap-1 text-[0.66rem] leading-tight text-gold">
                    <Coins className="size-2.5" /> {formatNumber(user.balance)}
                  </span>
                </span>
                <ChevronDown className={cx("size-3.5 text-muted transition", menuOpen && "rotate-180")} />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="panel absolute right-0 top-[calc(100%+0.6rem)] w-60 overflow-hidden p-1.5"
                >
                  <MenuLink href="/dashboard" icon={<LayoutDashboard className="size-4" />}>
                    Dashboard
                  </MenuLink>
                  <MenuLink href="/store" icon={<ShoppingBag className="size-4" />}>
                    Store
                  </MenuLink>
                  <MenuLink href="/dashboard/settings" icon={<Settings className="size-4" />}>
                    Account settings
                  </MenuLink>
                  {["admin", "owner", "moderator", "helper"].includes(user.role) ? (
                    <MenuLink href="/admin" icon={<Shield className="size-4" />}>
                      Admin panel
                    </MenuLink>
                  ) : null}
                  <div className="my-1 h-px bg-line/70" />
                  <button
                    type="button"
                    onClick={signOut}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-parchment"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" className="btn btn-quiet btn-sm">
                Player login
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm size-10 !p-0 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={cx(
          "fixed inset-x-0 top-[72px] z-40 h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-ink/97 backdrop-blur-xl transition-all duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <nav className="container-x flex flex-col gap-1 py-6" aria-label="Mobile">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center justify-between border-b border-line/60 py-3.5 font-display text-xl transition",
                isActive(item.href) ? "text-moss-bright" : "text-parchment",
              )}
            >
              {item.label}
              <span className="text-xs text-muted">0{site.nav.indexOf(item) + 1}</span>
            </Link>
          ))}
          <div className="mt-6">
            {user ? (
              <div className="grid gap-2">
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-line bg-surface/60 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.avatar} alt="" className="size-10 rounded-full" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{user.username}</p>
                      <RankBadge role={user.role} size="xs" />
                    </div>
                    <p className="flex items-center gap-1 text-xs text-gold">
                      <Coins className="size-3" /> {formatNumber(user.balance)} coins
                    </p>
                  </div>
                </div>
                <Link href="/dashboard" className="btn btn-primary btn-block">
                  Player dashboard
                </Link>
                <Link href="/store/cart" className="btn btn-ghost btn-block">
                  Cart
                </Link>
                <button type="button" onClick={signOut} className="btn btn-ghost btn-block">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link href="/login" className="btn btn-ghost btn-block">
                  Player login
                </Link>
                <Link href="/register" className="btn btn-primary btn-block">
                  Create account
                </Link>
              </div>
            )}
          </div>
          <p className="mt-8 text-xs text-muted">{site.server.host}</p>
        </nav>
      </div>
    </header>
  );
}

function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/store/cart"
      className="relative grid size-10 place-items-center rounded-lg border border-line bg-surface/60 text-parchment-dim transition hover:border-line-bright hover:text-parchment"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag className="size-4" />
      {ready && count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-bold leading-[18px] text-ink">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-parchment-dim transition hover:bg-white/5 hover:text-parchment"
    >
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}
