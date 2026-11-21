import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { events } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  clientIp,
  jsonOk,
  parseBody,
  requireApiAdmin,
  route,
} from "@/lib/api";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base = {
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(10_000).default(""),
  coverImage: z.string().trim().max(500).nullable().optional(),
  type: z.enum(["event", "giveaway"]).default("event"),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).default("upcoming"),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  registrationOpen: z.boolean().default(true),
  prize: z.string().trim().max(300).nullable().optional(),
  winner: z.string().trim().max(120).nullable().optional(),
};

const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base }).partial().required({ id: true });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, createSchema);
  const slug = body.slug ? slugify(body.slug) : slugify(body.title);

  const existing = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
  if (existing[0]) throw new ApiError(409, "SLUG_TAKEN", "An event with that slug already exists.");

  const inserted = await db
    .insert(events)
    .values({
      slug,
      title: body.title,
      description: body.description,
      coverImage: body.coverImage ?? null,
      type: body.type,
      status: body.status,
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      registrationOpen: body.registrationOpen,
      prize: body.prize ?? null,
      winner: body.winner ?? null,
    })
    .returning({ id: events.id, slug: events.slug });

  await audit({
    actorId: admin.id,
    action: "admin.event_created",
    targetType: "event",
    targetId: inserted[0]?.id,
    meta: { slug, ip: clientIp(req) },
  });

  return jsonOk({ event: inserted[0] });
});

export const PATCH = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, updateSchema);
  const { id, ...rest } = body;

  const patch: Record<string, unknown> = {};
  for (const key of [
    "title",
    "description",
    "coverImage",
    "type",
    "status",
    "registrationOpen",
    "prize",
    "winner",
  ] as const) {
    if (rest[key] !== undefined) patch[key] = rest[key];
  }
  if (rest.slug) patch.slug = slugify(rest.slug);
  if (rest.startsAt) patch.startsAt = new Date(rest.startsAt);
  if (rest.endsAt !== undefined) patch.endsAt = rest.endsAt ? new Date(rest.endsAt) : null;

  const updated = await db.update(events).set(patch).where(eq(events.id, id)).returning({ id: events.id });
  if (!updated[0]) throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found.");

  await audit({
    actorId: admin.id,
    action: "admin.event_updated",
    targetType: "event",
    targetId: id,
    meta: { fields: Object.keys(patch), ip: clientIp(req) },
  });

  return jsonOk({ updated: true });
});
