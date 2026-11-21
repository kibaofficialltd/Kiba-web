import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Scenery } from "@/components/brand/scenery";
import { getBrandAssets } from "@/lib/brand-assets";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const assets = getBrandAssets();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Left: atmosphere */}
      <aside className="relative hidden overflow-hidden border-r border-line/60 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-ink-soft" />
        {assets.heroSrc ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${assets.heroSrc})` }}
          />
        ) : (
          <Scenery />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

        <div className="relative z-10 p-10">
          <Link href="/" aria-label="Back to home">
            <Logo src={assets.logoSrc} imgClassName="h-12 sm:h-14 w-auto" />
          </Link>
        </div>

        <div className="relative z-10 max-w-lg p-10">
          <p className="eyebrow mb-4">Season one</p>
          <h2 className="font-display text-4xl leading-tight text-parchment">
            Every legend starts with a single login.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-parchment-dim">
            Your portal account is the key to daily rewards, the coin store, leaderboards and
            events — across Java, Bedrock and cracked clients.
          </p>
          <div className="mt-8 flex gap-6 text-[0.66rem] uppercase tracking-[0.18em] text-muted">
            <span>{site.server.host}</span>
            <span className="text-moss">Cross-play</span>
          </div>
        </div>
      </aside>

      {/* Right: form */}
      <main className="relative flex min-h-dvh flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted transition hover:text-parchment lg:hidden">
            <ArrowLeft className="size-3.5" /> Back
          </Link>
          <Link href="/" className="hidden items-center gap-2 text-xs text-muted transition hover:text-parchment lg:inline-flex">
            <ArrowLeft className="size-3.5" /> Back to the network
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
