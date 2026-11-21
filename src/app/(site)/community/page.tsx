import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Coins,
  Compass,
  Globe2,
  MessageCircle,
  Radio,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/panel";
import { Avatar } from "@/components/avatar";
import { AnnouncementCard, EventCard, LeaderboardRow } from "@/components/cards";
import { Countdown } from "@/components/countdown";
import { LiveServerStatus } from "@/components/server/live-status";
import { getServerSnapshot } from "@/lib/server-status";
import {
  getLeaderboard,
  getNetworkPulse,
  getPublishedAnnouncements,
  getUpcomingEvents,
} from "@/lib/queries";
import { site } from "@/lib/site";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community",
  description:
    "The KIBAOFFICIAL SMP community: Discord, socials, live server pulse, top players and the events calendar.",
  alternates: { canonical: "/community" },
};

const socials = [
  { key: "discord", label: "Discord", body: "Announcements, build showcases, event nights and support." },
  { key: "whatsapp", label: "WhatsApp", body: "Regional chat for quick questions and squad forming." },
  { key: "instagram", label: "Instagram", body: "Builds, screenshots and season recaps." },
  { key: "youtube", label: "YouTube", body: "Trailers, guides and event VODs." },
] as const;

export default async function CommunityPage() {
  const [snapshot, pulse, news, events, richest] = await Promise.all([
    getServerSnapshot(),
    getNetworkPulse(),
    getPublishedAnnouncements(3),
    getUpcomingEvents(3),
    getLeaderboard("richest", 5),
  ]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(111,174,123,0.1),transparent_60%)]" />
        <div className="container-x relative py-14 sm:py-16">
          <div className="max-w-3xl">
            <Badge tone="moss">
              <Users className="size-3" /> Community hub
            </Badge>
            <h1 className="display-xl mt-4 text-balance">
              Built by players.
              <span className="block text-moss-bright">Kept alive by them.</span>
            </h1>
            <p className="lede mt-5">
              The world is only half the story. Build nights, tournaments, giveaways and the
              occasional 3 a.m. nether run happen here — across Java, Bedrock and cracked clients.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={site.socials.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                <MessageCircle className="size-4" /> Join the Discord
              </Link>
              <Link href="/events" className="btn btn-ghost btn-lg">
                <CalendarDays className="size-4" /> Events calendar
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="panel flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-moss/10 text-moss">
                <Users className="size-4" />
              </span>
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
                  Registered
                </p>
                <p className="font-display text-xl">{formatNumber(pulse.registered)}</p>
              </div>
            </div>
            <div className="panel flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-sky/10 text-sky">
                <ShieldCheckIcon />
              </span>
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
                  Linked profiles
                </p>
                <p className="font-display text-xl">{formatNumber(pulse.linked)}</p>
              </div>
            </div>
            <div className="panel flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-gold/10 text-gold">
                <Trophy className="size-4" />
              </span>
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">
                  Tracked on server
                </p>
                <p className="font-display text-xl">{formatNumber(pulse.trackedPlayers)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <SectionHeading
              eyebrow="Where we talk"
              title="Pick your channel."
              description="Every social links back to the same network. Discord is the fastest way to reach staff."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {socials.map((social) => (
                <a
                  key={social.key}
                  href={site.socials[social.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="panel panel-interactive group flex flex-col p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg text-parchment">{social.label}</span>
                    <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-moss-bright" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{social.body}</p>
                  <p className="mt-4 truncate text-[0.62rem] font-mono text-muted/60">
                    {site.socials[social.key].replace(/^https?:\/\//, "")}
                  </p>
                </a>
              ))}
            </div>

            <div className="panel mt-4 flex flex-wrap items-center gap-4 p-5">
              <span className="grid size-10 place-items-center rounded-lg border border-line bg-ink/60 text-gold">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base">Want your build featured?</p>
                <p className="mt-0.5 text-xs text-muted">
                  Post screenshots in Discord with your in-game name. We feature builds in news
                  dispatches and on the socials.
                </p>
              </div>
              <Link href="/support" className="btn btn-ghost btn-sm">
                Contact staff
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <LiveServerStatus initial={snapshot} />

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <span className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
                  <Radio className="size-3.5 text-moss" /> Live pulse
                </span>
                <Link href="/leaderboards" className="text-[0.62rem] text-muted hover:text-parchment">
                  Standings
                </Link>
              </div>
              <div className="grid grid-cols-2 divide-x divide-line/60 text-center">
                <div className="p-4">
                  <p className="font-display text-2xl text-parchment">{snapshot.playersOnline}</p>
                  <p className="text-[0.55rem] uppercase tracking-[0.16em] text-muted">Online now</p>
                </div>
                <div className="p-4">
                  <p className="font-display text-2xl text-parchment">{formatNumber(pulse.linked)}</p>
                  <p className="text-[0.55rem] uppercase tracking-[0.16em] text-muted">Verified</p>
                </div>
              </div>
              <div className="border-t border-line/60 px-4 py-3 text-[0.66rem] text-muted">
                <p className="flex items-center gap-1.5">
                  <Globe2 className="size-3" /> Java {site.server.host}:{site.server.port}
                </p>
                <p className="mt-1 flex items-center gap-1.5">
                  <Compass className="size-3" /> Bedrock port {site.server.bedrockPort}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-y border-line/60 bg-ink-soft/40">
        <div className="container-x grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading
              eyebrow="Dispatches"
              title="Latest from the team."
              action={
                <Link href="/news" className="btn btn-ghost btn-sm">
                  All news <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            <div className="mt-6 grid gap-3">
              {news.length > 0 ? (
                news.map((post) => <AnnouncementCard key={post.id} post={post} />)
              ) : (
                <div className="panel p-8 text-center text-sm text-muted">No dispatches yet.</div>
              )}
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="Standings" title="Richest players." />
            <div className="panel mt-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                <span className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-parchment">
                  <Coins className="size-3.5 text-gold" /> Coin balances
                </span>
                <Link href="/leaderboards" className="text-[0.62rem] text-muted hover:text-parchment">
                  View all
                </Link>
              </div>
              {richest.length > 0 ? (
                richest.map((entry) => (
                  <LeaderboardRow key={entry.username} entry={entry} metric="coins" />
                ))
              ) : (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  No linked profiles yet.
                </p>
              )}
            </div>

            <div className="mt-4 panel p-5">
              <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
                <CheckCircle2 className="size-3.5 text-moss" /> House rules
              </p>
              <ul className="mt-3 space-y-2 text-xs text-parchment-dim">
                <li>Respect every player, on every platform.</li>
                <li>No cheats, x-ray or exploit abuse.</li>
                <li>No griefing outside agreed PvP zones.</li>
                <li>Staff decisions are final — appeals go to support.</li>
              </ul>
              <Link href="/rules" className="btn btn-quiet btn-sm mt-4 w-full">
                Read the full rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="Next up"
            title="Show up. Compete. Repeat."
            action={
              <Link href="/events" className="btn btn-ghost btn-sm">
                All events <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  countdown={<Countdown target={event.startsAt.toISOString()} compact />}
                  action={
                    <Link href={`/events/${event.slug}`} className="btn btn-ghost btn-sm">
                      Details
                    </Link>
                  }
                />
              ))
            ) : (
              <div className="panel col-span-full p-8 text-center text-sm text-muted">
                The next event is being prepared.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-x pb-14">
        <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <Avatar name="KIBA" size={40} />
            <div>
              <p className="font-display text-base">Still have a question?</p>
              <p className="text-xs text-muted">Open a ticket and a human will answer.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/support" className="btn btn-primary btn-sm">
              Open support
            </Link>
            <Link href="/rules" className="btn btn-ghost btn-sm">
              Rules
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
