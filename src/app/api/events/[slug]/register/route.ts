import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events, notifications } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  clientIp,
  jsonOk,
  requireApiUser,
  route,
} from "@/lib/api";
import { requireVerifiedEmail } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await requireVerifiedEmail(user.id);
  await enforceRateLimit(`events:register:${user.id}`, 30, 3600, "Too many registration attempts.");

  const { slug } = await ctx.params;
  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const event = rows[0];
  if (!event) throw new ApiError(404, "EVENT_NOT_FOUND", "That event does not exist.");
  if (!event.registrationOpen) {
    throw new ApiError(409, "REGISTRATION_CLOSED", "Registration for this event is closed.");
  }
  if (event.status === "completed" || event.status === "cancelled") {
    throw new ApiError(409, "EVENT_FINISHED", "This event has already finished.");
  }

  const inserted = await db
    .insert(eventRegistrations)
    .values({ eventId: event.id, userId: user.id })
    .onConflictDoNothing()
    .returning({ id: eventRegistrations.id });

  if (inserted[0]) {
    await db.insert(notifications).values({
      userId: user.id,
      type: "event",
      title: `Registered for ${event.title}`,
      body: "You are on the list. Check the event page for the start time and rules.",
      link: `/events/${event.slug}`,
    });
    await audit({
      actorId: user.id,
      action: "events.registered",
      targetType: "event",
      targetId: event.id,
      meta: { slug: event.slug, ip: clientIp(req) },
    });
  }

  return jsonOk({ registered: true, alreadyRegistered: !inserted[0] });
});

export const DELETE = route(async (req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const { slug } = await ctx.params;

  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const event = rows[0];
  if (!event) throw new ApiError(404, "EVENT_NOT_FOUND", "That event does not exist.");

  await db
    .delete(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, user.id)));

  return jsonOk({ registered: false });
});
