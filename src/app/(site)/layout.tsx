import type { Metadata } from "next";
import { getBrandAssets } from "@/lib/brand-assets";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/store/cart-provider";

export const metadata: Metadata = {};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [assets, user] = await Promise.all([Promise.resolve(getBrandAssets()), getCurrentUser()]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-moss focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
      >
        Skip to content
      </a>
      {assets.hasCustomFonts ? (
        <link rel="stylesheet" href="/brand/fonts/fonts.css" precedence="default" />
      ) : null}
      <CartProvider>
        <SiteHeader
          logoSrc={assets.logoSrc}
          user={
            user
              ? {
                  username: user.username,
                  role: user.role,
                  balance: user.balance,
                  avatar: `/api/avatar/${encodeURIComponent(user.username)}?size=64`,
                }
              : null
          }
        />
        <main id="main" className="min-h-dvh pt-[72px]">
          {children}
        </main>
      </CartProvider>
      <SiteFooter logoSrc={assets.logoSrc} />
    </>
  );
}
