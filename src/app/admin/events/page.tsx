import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { EventManager } from "./event-manager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      description: events.description,
      coverImage: events.coverImage,
      type: events.type,
      status: events.status,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      registrationOpen: events.registrationOpen,
      prize: events.prize,
      winner: events.winner,
      registrations: sql<number>`count(${eventRegistrations.id})::int`,
    })
    .from(events)
    .leftJoin(eventRegistrations, eq(eventRegistrations.eventId, events.id))
    .groupBy(events.id)
    .orderBy(desc(events.startsAt))
    .limit(100);

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Community</p>
        <h1 className="display-md">Events & giveaways.</h1>
        <p className="mt-1 text-sm text-muted">
          Registration ties a portal account to the event roster. Winners are recorded on the public
          event page and prizes are delivered by the core plugin.
        </p>
      </header>

      <EventManager
        events={rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          coverImage: row.coverImage,
          type: row.type,
          status: row.status,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt ? row.endsAt.toISOString() : null,
          registrationOpen: row.registrationOpen,
          prize: row.prize,
          winner: row.winner,
          registrations: Number(row.registrations ?? 0),
        }))}
      />
    </div>
  );
}
