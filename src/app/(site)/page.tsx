import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Blocks,
  CalendarClock,
  CheckCircle2,
  Coins,
  Compass,
  Crosshair,
  Crown,
  Gift,
  Globe2,
  Layers,
  ShieldCheck,
  Sparkles,
  Store,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { Scenery } from "@/components/brand/scenery";
import { Logo } from "@/components/brand/logo";
import { CopyIp } from "@/components/copy-ip";
import { LivePlayerCount, LiveServerStatus } from "@/components/server/live-status";
import { AnimatedNumber } from "@/components/animated-number";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/panel";
import {
  AnnouncementCard,
  EventCard,
  LeaderboardRow,
  ProductCard,
} from "@/components/cards";
import { BannerCarousel } from "@/components/banner-carousel";
import { Countdown } from "@/components/countdown";
import { getServerSnapshot } from "@/lib/server-status";
import { getBrandAssets } from "@/lib/brand-assets";
import {
  getActiveBanners,
  getFeaturedProducts,
  getLeaderboard,
  getNetworkPulse,
  getPublishedAnnouncements,
  getUpcomingEvents,
} from "@/lib/queries";
import { site, serverAddress, bedrockAddress } from "@/lib/site";
import { formatCoins } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${site.name} ${site.suffix} — Your Adventure. Your Legacy.`,
  description: site.description,
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: Globe2,
    title: "Java, Bedrock & cracked",
    body: "One network, every device. Floodgate handles Bedrock while server-side identity verification keeps cracked logins secure.",
  },
  {
    icon: Coins,
    title: "A real player economy",
    body: "Coins are earned in-game and through the portal. Every credit and debit is written to an auditable ledger — no fake balances.",
  },
  {
    icon: Gift,
    title: "Daily rewards & spins",
    body: "Seven-day streak rewards and a daily wheel, validated server-side. Rewards are delivered by KIBAOFFICIALCore, never by the browser.",
  },
  {
    icon: Swords,
    title: "Seasons that matter",
    body: "PvP ladders, build contests and giveaways with real standings pulled straight from the server every heartbeat.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Create your portal account",
    body: "Register with an email and password. Sessions are HTTP-only and passwords are hashed with scrypt.",
    href: "/register",
    cta: "Create account",
  },
  {
    step: "02",
    title: "Link your Minecraft profile",
    body: "Generate a one-time code, run /link <code> in-game and KIBAOFFICIALCore verifies your UUID.",
    href: "/dashboard/link",
    cta: "Link account",
  },
  {
    step: "03",
    title: "Claim, trade, compete",
    body: "Unlock daily rewards, the coin store, leaderboards and events tied to your verified identity.",
    href: "/leaderboards",
    cta: "See leaderboards",
  },
] as const;

export default async function HomePage() {
  const [snapshot, assets, pulse, products, news, events, richest, banners] = await Promise.all([
    getServerSnapshot(),
    Promise.resolve(getBrandAssets()),
    getNetworkPulse(),
    getFeaturedProducts(3),
    getPublishedAnnouncements(3),
    getUpcomingEvents(3),
    getLeaderboard("richest", 5),
    getActiveBanners(),
  ]);

  return (
    <>
      {/* ============================== TOP SHOWCASE BANNER ============================== */}
      <section className="container-x relative pt-24 pb-4 sm:pt-28 sm:pb-6">
        <BannerCarousel banners={banners} />
      </section>

      {/* ============================== HERO ============================== */}
      <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden pb-20 pt-8">
        {assets.heroSrc ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${assets.heroSrc})` }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" aria-hidden="true" />
          </>
        ) : (
          <Scenery />
        )}

        <div className="container-x relative z-10 grid gap-12 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <Reveal>
              <p className="eyebrow mb-5">Cross-play survival · Season one</p>
            </Reveal>

            <Reveal delay={60}>
              <div>
                {assets.logoSrc ? (
                  <div className="mb-4 max-w-[320px] sm:max-w-[420px] lg:max-w-[480px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assets.logoSrc}
                      alt="KIBAOFFICIAL SMP"
                      className="w-full h-auto object-contain filter drop-shadow-[0_0_35px_rgba(245,158,11,0.28)]"
                    />
                  </div>
                ) : (
                  <h1 className="display-xl text-parchment">
                    KIBA<span className="text-moss-bright">OFFICIAL</span>
                    <span className="mt-1 block text-[0.52em] tracking-[0.34em] text-parchment/70">SMP</span>
                  </h1>
                )}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-6 flex items-center gap-4">
                <span className="h-px w-10 bg-gold/60" />
                <p className="font-display text-sm tracking-[0.3em] text-gold-bright">
                  YOUR ADVENTURE. YOUR LEGACY.
                </p>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <p className="lede mt-6 max-w-xl text-pretty">
                Explore, survive, build your empire and become a legend in KIBAOFFICIAL SMP.
                A handcrafted world for Java, Bedrock and cracked players — with one account,
                one economy, one story.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="sky">
                  <Globe2 className="size-3" /> Java edition
                </Badge>
                <Badge tone="moss">
                  <Layers className="size-3" /> Bedrock edition
                </Badge>
                <Badge tone="gold">
                  <ShieldCheck className="size-3" /> Cracked support
                </Badge>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <CopyIp value={serverAddress} size="lg" showValue />
                <Link
                  href={site.socials.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-lg"
                >
                  Join community <ArrowRight className="size-4" />
                </Link>
                <Link href="#network" className="btn btn-quiet btn-lg">
                  Explore server
                </Link>
              </div>
            </Reveal>

            <Reveal delay={360}>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
                <LivePlayerCount initial={snapshot} />
                <span className="hidden h-4 w-px bg-line sm:block" />
                <span className="inline-flex items-center gap-2">
                  <Users className="size-4" />
                  <AnimatedNumber value={pulse.linked} className="text-parchment" /> linked profiles
                </span>
                <span className="hidden h-4 w-px bg-line sm:block" />
                <span className="inline-flex items-center gap-2">
                  <Compass className="size-4" /> {site.server.version}
                </span>
              </div>
            </Reveal>
          </div>

          {/* Server list card */}
          <Reveal delay={260} className="lg:justify-self-end">
            <div className="hero-card panel grain w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-2.5">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-muted">
                  Server list
                </span>
                <span className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-moss-bright">
                  <span className="live-dot" data-offline={!snapshot.online} />
                  {snapshot.online ? "Online" : "Offline"}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="grid size-14 shrink-0 place-items-center rounded-lg border border-line bg-ink/70 p-1.5 overflow-hidden">
                    <Logo src={assets.logoSrc} showSub={false} imgClassName="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base text-parchment">
                      KIBAOFFICIAL SMP
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {snapshot.motd || "Survive · Build · Conquer"}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[0.65rem] text-muted">
                      <span className="inline-flex items-center gap-1 text-moss-bright">
                        <span className="size-1.5 rounded-full bg-moss-bright" /> {snapshot.javaPlayers} Java
                      </span>
                      <span className="inline-flex items-center gap-1 text-sky">
                        <span className="size-1.5 rounded-full bg-sky" /> {snapshot.bedrockPlayers} Bedrock
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-parchment">
                      {snapshot.playersOnline}
                      <span className="text-muted">/{snapshot.maxPlayers || "—"}</span>
                    </p>
                    <div className="mt-1.5 flex justify-end gap-0.5">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <span
                          key={bar}
                          className={`w-1 rounded-sm ${snapshot.online ? "bg-moss-bright" : "bg-line"}`}
                          style={{ height: 4 + bar * 2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 text-[0.7rem]">
                  <div className="rounded-md border border-line bg-ink/40 px-3 py-2">
                    <p className="text-[0.55rem] uppercase tracking-[0.16em] text-muted">Java address</p>
                    <p className="mt-0.5 truncate font-mono text-parchment">{serverAddress}</p>
                  </div>
                  <div className="rounded-md border border-line bg-ink/40 px-3 py-2">
                    <p className="text-[0.55rem] uppercase tracking-[0.16em] text-muted">Bedrock address</p>
                    <p className="mt-0.5 truncate font-mono text-parchment">{bedrockAddress}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[0.65rem] text-muted">
                  <span>{snapshot.version}</span>
                  <span className="font-mono">
                    {snapshot.online ? `${snapshot.tps ?? "—"} TPS` : "awaiting heartbeat"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-line/70 text-center">
                {[
                  { label: "Registered", value: pulse.registered },
                  { label: "Linked", value: pulse.linked },
                  { label: "Tracked", value: pulse.trackedPlayers },
                ].map((item) => (
                  <div key={item.label} className="border-r border-line/70 px-2 py-3 last:border-0">
                    <p className="font-display text-lg text-parchment">{item.value.toLocaleString("en-IN")}</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.16em] text-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-muted/70 md:flex">
          <span>Scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-moss/60 to-transparent" />
        </div>
      </section>

      {/* ============================ NETWORK ============================ */}
      <section id="network" className="section relative">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="The network"
              title="Every world. One live pulse."
              description="Player counts, uptime and platform splits are streamed from KIBAOFFICIALCore. If the bridge stops, the site says so instead of inventing numbers."
              action={
                <Link href="/leaderboards" className="btn btn-ghost btn-sm">
                  View leaderboards <ArrowRight className="size-3.5" />
                </Link>
              }
            />
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Reveal>
              <LiveServerStatus initial={snapshot} />
            </Reveal>

            <Reveal delay={80}>
              <div className="grid h-full grid-rows-3 gap-4">
                {[
                  {
                    icon: Users,
                    label: "Registered players",
                    value: pulse.registered,
                    note: "portal accounts",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Verified profiles",
                    value: pulse.linked,
                    note: "UUID-verified links",
                  },
                  {
                    icon: Trophy,
                    label: "Tracked on server",
                    value: pulse.trackedPlayers,
                    note: "stat profiles synced",
                  },
                ].map((item) => (
                  <div key={item.label} className="panel flex items-center gap-4 px-5 py-4">
                    <div className="grid size-10 place-items-center rounded-lg border border-line bg-ink/60 text-moss">
                      <item.icon className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
                        {item.label}
                      </p>
                      <p className="font-display text-2xl text-parchment">
                        <AnimatedNumber value={item.value} />
                      </p>
                    </div>
                    <p className="text-right text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className="section relative border-y border-line/50 bg-ink-soft/40">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Why KIBA"
              title="Built like a world, not a landing page."
              description="Four pillars that shape the network — and the systems behind them are already running."
            />
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 70}>
                <article className="panel panel-interactive group h-full p-6">
                  <div className="mb-5 grid size-11 place-items-center rounded-lg border border-line bg-ink/60 text-moss transition group-hover:border-moss/40 group-hover:text-moss-bright">
                    <feature.icon className="size-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-display text-lg leading-snug">{feature.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{feature.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== STORE ============================== */}
      <section className="section">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Coin store"
              title="Ranks, keys and cosmetics — earned, not gambled."
              description="Everything in the store is priced in coins. Coins come from play, daily rewards and events. No payment gateway, no surprise charges."
              action={
                <Link href="/store" className="btn btn-ghost btn-sm">
                  Browse store <Store className="size-4" />
                </Link>
              }
            />
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.length > 0 ? (
              products.map((product, index) => (
                <Reveal key={product.id} delay={index * 70}>
                  <ProductCard product={product} />
                </Reveal>
              ))
            ) : (
              <div className="panel col-span-full p-8 text-center text-sm text-muted">
                The store is being restocked. Check back shortly.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================== LEADERBOARD ========================== */}
      <section className="section border-y border-line/50 bg-ink-soft/40">
        <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="eyebrow mb-3">Standings</p>
            <h2 className="display-lg text-balance">The richest players on the network.</h2>
            <p className="lede mt-4">
              Balances are read from the same ledger the server uses. Every coin earned,
              spent or rewarded is recorded — so the podium is always real.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/leaderboards" className="btn btn-primary">
                All leaderboards <ArrowRight className="size-4" />
              </Link>
              <Link href="/store" className="btn btn-ghost">
                <Coins className="size-4" /> Earn coins
              </Link>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <span className="flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-parchment">
                  <Crown className="size-3.5 text-gold" /> Richest players
                </span>
                <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">Coins</span>
              </div>
              {richest.length > 0 ? (
                richest.map((entry) => (
                  <LeaderboardRow key={entry.username} entry={entry} metric="coins" />
                ))
              ) : (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  No linked profiles yet. Be the first name on the board.
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ GET STARTED ======================== */}
      <section className="section">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Getting started"
              title="Three steps from spectator to legend."
              align="center"
            />
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.step} delay={index * 90}>
                <div className="panel relative h-full p-6">
                  <span className="font-display text-3xl text-line">{step.step}</span>
                  <h3 className="mt-3 font-display text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                  <Link
                    href={step.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-moss transition hover:text-moss-bright"
                  >
                    {step.cta} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-moss" /> No premium account needed
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-moss" /> Bedrock via Floodgate
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-moss" /> Rewards delivered in-game
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== EVENTS =========================== */}
      <section className="section border-y border-line/50 bg-ink-soft/40">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="What's next"
              title="Events, giveaways and the next chapter."
              description="Compete for the podium, join build nights and enter giveaways — registration is tied to your verified profile."
              action={
                <Link href="/events" className="btn btn-ghost btn-sm">
                  <CalendarClock className="size-4" /> All events
                </Link>
              }
            />
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.length > 0 ? (
              events.map((event, index) => (
                <Reveal key={event.id} delay={index * 70}>
                  <EventCard
                    event={event}
                    countdown={<Countdown target={event.startsAt.toISOString()} compact />}
                    action={
                      <Link
                        href={`/events/${event.slug}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Details
                      </Link>
                    }
                  />
                </Reveal>
              ))
            ) : (
              <div className="panel col-span-full p-8 text-center text-sm text-muted">
                The next event is being prepared. Join the Discord for the announcement.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =============================== NEWS =========================== */}
      <section className="section">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Dispatches"
              title="News from the world."
              action={
                <Link href="/news" className="btn btn-ghost btn-sm">
                  All news <ArrowRight className="size-3.5" />
                </Link>
              }
            />
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {news.length > 0 ? (
              news.map((post, index) => (
                <Reveal key={post.id} delay={index * 70}>
                  <AnnouncementCard post={post} />
                </Reveal>
              ))
            ) : (
              <div className="panel col-span-full p-8 text-center text-sm text-muted">
                No dispatches yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================ COMMUNITY ========================= */}
      <section className="section pt-0">
        <div className="container-x">
          <Reveal>
            <div className="panel grain relative overflow-hidden px-6 py-12 text-center sm:px-12">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(111,174,123,0.12),transparent_65%)]" />
              <div className="relative">
                <Badge tone="moss" className="mx-auto">
                  <Sparkles className="size-3" /> The community
                </Badge>
                <h2 className="display-lg mt-4 text-balance">
                  Build your empire. Bring your friends.
                </h2>
                <p className="lede mx-auto mt-4 max-w-xl">
                  Announcements, build showcases, event nights and support — the fastest place to
                  reach the team is Discord.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={site.socials.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg"
                  >
                    Join Discord <ArrowRight className="size-4" />
                  </Link>
                  <CopyIp value={serverAddress} variant="ghost" size="lg" label="Copy server IP" />
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Globe2 className="size-3.5" /> {serverAddress}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Crosshair className="size-3.5" /> {formatCoins(pulse.linked)} verified players
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Blocks className="size-3.5" /> Cross-play ready
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "KIBAOFFICIAL SMP",
            url: process.env.APP_URL,
            sameAs: Object.values(site.socials),
            description: site.description,
          }),
        }}
      />
    </>
  );
}
