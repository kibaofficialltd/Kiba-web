import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { announcements } from "@/db/schema";
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
  title: z.string().trim().min(4).max(160),
  slug: z.string().trim().max(100).optional(),
  excerpt: z.string().trim().max(400).default(""),
  body: z.string().trim().max(20_000).default(""),
  category: z.enum(["update", "feature", "maintenance", "event", "giveaway", "notice"]),
  coverImage: z.string().trim().max(500).nullable().optional(),
  pinned: z.boolean().default(false),
  published: z.boolean().default(true),
};

const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base }).partial().required({ id: true });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, createSchema);
  const slug = body.slug ? slugify(body.slug) : slugify(body.title);

  const existing = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.slug, slug))
    .limit(1);
  if (existing[0]) throw new ApiError(409, "SLUG_TAKEN", "A dispatch with that slug already exists.");

  const inserted = await db
    .insert(announcements)
    .values({
      slug,
      title: body.title,
      excerpt: body.excerpt,
      body: body.body,
      category: body.category,
      coverImage: body.coverImage ?? null,
      pinned: body.pinned,
      published: body.published,
      authorId: admin.id,
      publishedAt: new Date(),
    })
    .returning({ id: announcements.id, slug: announcements.slug });

  await audit({
    actorId: admin.id,
    action: "admin.announcement_created",
    targetType: "announcement",
    targetId: inserted[0]?.id,
    meta: { slug, ip: clientIp(req) },
  });

  return jsonOk({ announcement: inserted[0] });
});

export const PATCH = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, updateSchema);
  const { id, ...rest } = body;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of ["title", "excerpt", "body", "category", "coverImage", "pinned", "published"] as const) {
    if (rest[key] !== undefined) patch[key] = rest[key];
  }
  if (rest.slug) patch.slug = slugify(rest.slug);

  const updated = await db
    .update(announcements)
    .set(patch)
    .where(eq(announcements.id, id))
    .returning({ id: announcements.id });
  if (!updated[0]) throw new ApiError(404, "ANNOUNCEMENT_NOT_FOUND", "Dispatch not found.");

  await audit({
    actorId: admin.id,
    action: "admin.announcement_updated",
    targetType: "announcement",
    targetId: id,
    meta: { fields: Object.keys(patch), ip: clientIp(req) },
  });

  return jsonOk({ updated: true });
});
