import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, CalendarClock, CheckCircle2, Gift, Trophy, Users } from "lucide-react";
import { db } from "@/db";
import { eventRegistrations } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { Prose } from "@/components/prose";
import { getCurrentUser } from "@/lib/auth";
import { getEventBySlug, getEventRegistrationCount } from "@/lib/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { EventRegistration } from "./event-registration";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description.slice(0, 160),
    alternates: { canonical: `/events/${event.slug}` },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [user, count] = await Promise.all([getCurrentUser(), getEventRegistrationCount(event.id)]);
  const registration = user
    ? (
        await db
          .select({ id: eventRegistrations.id })
          .from(eventRegistrations)
          .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, user.id)))
          .limit(1)
      )[0]
    : null;

  const finished = event.status === "completed" || event.status === "cancelled";
  const open = event.registrationOpen && !finished;

  return (
    <div className="container-x py-10 sm:py-14">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-parchment"
      >
        <ArrowLeft className="size-3.5" /> All events
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={event.type === "giveaway" ? "gold" : "moss"}>
              {event.type === "giveaway" ? <Gift className="size-3" /> : <Trophy className="size-3" />}
              {event.type}
            </Badge>
            <Badge
              tone={
                event.status === "active" ? "moss" : event.status === "completed" ? "sky" : "default"
              }
            >
              {event.status}
            </Badge>
          </div>

          <h1 className="display-lg mt-3 text-balance">{event.title}</h1>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-y border-line/60 py-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" /> Starts {formatDateTime(event.startsAt)}
            </span>
            {event.endsAt ? (
              <span className="inline-flex items-center gap-1.5">Ends {formatDateTime(event.endsAt)}</span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" /> {count} registered
            </span>
          </div>

          {event.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImage}
              alt=""
              className="mt-6 w-full rounded-xl border border-line object-cover"
              loading="lazy"
            />
          ) : null}

          <div className="mt-6">
            <Prose content={event.description} />
          </div>

          {event.winner ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/[0.06] p-4">
              <Trophy className="size-5 text-gold" />
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gold">Winner</p>
                <p className="font-display text-lg">{event.winner}</p>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[92px] lg:self-start">
          <div className="panel overflow-hidden">
            <div className="border-b border-line/70 px-5 py-3.5">
              <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
                Entry
              </h2>
            </div>
            <div className="space-y-4 p-5">
              {event.status === "upcoming" ? (
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Starts in</p>
                  <p className="font-display text-2xl text-parchment">
                    <Countdown target={event.startsAt.toISOString()} />
                  </p>
                </div>
              ) : event.status === "active" && event.endsAt ? (
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.16em] text-muted">Ends in</p>
                  <p className="font-display text-2xl text-gold">
                    <Countdown target={event.endsAt.toISOString()} />
                  </p>
                </div>
              ) : null}

              {event.prize ? (
                <div className="rounded-lg border border-gold/25 bg-gold/[0.05] p-3">
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.16em] text-gold">
                    Prize pool
                  </p>
                  <p className="mt-1 text-sm text-parchment-dim">{event.prize}</p>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Registered</span>
                <span className="font-mono text-parchment">{count}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Entry fee</span>
                <span className="text-moss-bright">Free</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Registration</span>
                <span className={open ? "text-moss-bright" : "text-muted"}>
                  {open ? "Open" : "Closed"}
                </span>
              </div>

              <EventRegistration
                slug={event.slug}
                signedIn={Boolean(user)}
                registered={Boolean(registration)}
                open={open}
              />

              <p className="text-[0.66rem] leading-relaxed text-muted">
                Prizes are delivered in-game by KIBAOFFICIALCore to your verified UUID. Staff may
                cancel an event; entries are always free.
              </p>
            </div>
          </div>

          <div className="panel p-5 text-xs text-muted">
            <p className="flex items-center gap-1.5 font-semibold text-parchment-dim">
              <CheckCircle2 className="size-3.5 text-moss" /> Fair play
            </p>
            <p className="mt-1.5 leading-relaxed">
              Alt accounts, exploiting and teaming outside the rules lead to disqualification.
              Decisions are logged and can be appealed through support.
            </p>
          </div>

          <p className="text-center text-[0.66rem] text-muted">
            Event created {formatDate(event.createdAt)}
          </p>
        </aside>
      </div>
    </div>
  );
}
