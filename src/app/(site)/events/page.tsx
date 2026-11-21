import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Gift, Trophy } from "lucide-react";
import { EventCard } from "@/components/cards";
import { Countdown } from "@/components/countdown";
import { Badge } from "@/components/ui/badge";
import { getEvents } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events & giveaways",
  description:
    "Build contests, PvP ladders, giveaways and community nights on KIBAOFFICIAL SMP. Registration is tied to your verified Minecraft profile.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await getEvents(50);
  const live = events.filter((event) => event.status === "active");
  const upcoming = events.filter((event) => event.status === "upcoming");
  const finished = events.filter((event) => event.status === "completed");

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow mb-2">Events & giveaways</p>
          <h1 className="display-xl">Something is always happening.</h1>
          <p className="lede mt-3">
            Build contests, PvP ladders and seasonal giveaways. Entry is free — registration ties
            your portal account to the event roster so prizes reach the right UUID.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="moss">
            <CalendarClock className="size-3" /> {upcoming.length} upcoming
          </Badge>
          {live.length > 0 ? <Badge tone="gold">{live.length} live</Badge> : null}
        </div>
      </header>

      {events.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted">
          No events scheduled yet. Join the Discord to hear about the next one first.
        </div>
      ) : (
        <div className="space-y-10">
          {live.length > 0 ? (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold">
                <span className="live-dot" /> Live now
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    countdown={
                      event.endsAt ? (
                        <span className="text-xs text-gold">
                          Ends in <Countdown target={event.endsAt.toISOString()} compact />
                        </span>
                      ) : (
                        <span className="text-xs text-moss">Live</span>
                      )
                    }
                    action={
                      <Link href={`/events/${event.slug}`} className="btn btn-gold btn-sm">
                        Enter now
                      </Link>
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {upcoming.length > 0 ? (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
                <CalendarClock className="size-3.5" /> Upcoming
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    countdown={
                      <span className="text-xs text-muted">
                        Starts in <Countdown target={event.startsAt.toISOString()} compact />
                      </span>
                    }
                    action={
                      <Link href={`/events/${event.slug}`} className="btn btn-ghost btn-sm">
                        Details <ArrowRight className="size-3.5" />
                      </Link>
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {finished.length > 0 ? (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
                <Trophy className="size-3.5" /> Archive
              </h2>
              <div className="panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Type</th>
                        <th>Finished</th>
                        <th>Winner</th>
                        <th className="text-right">Page</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finished.map((event) => (
                        <tr key={event.id}>
                          <td className="font-semibold text-parchment">{event.title}</td>
                          <td>
                            <Badge tone={event.type === "giveaway" ? "gold" : "moss"}>
                              {event.type === "giveaway" ? <Gift className="size-3" /> : null}
                              {event.type}
                            </Badge>
                          </td>
                          <td className="text-muted">{formatDate(event.endsAt ?? event.startsAt)}</td>
                          <td className="text-moss-bright">{event.winner ?? "—"}</td>
                          <td className="text-right">
                            <Link
                              href={`/events/${event.slug}`}
                              className="text-xs text-muted transition hover:text-parchment"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
