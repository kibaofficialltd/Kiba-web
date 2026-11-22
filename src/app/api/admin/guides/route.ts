import type { NextRequest } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { guides } from "@/db/schema";
import { ApiError, assertSameOrigin, jsonOk, parseBody, requireApiAdmin, route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const guideSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z.string().trim().max(100).optional(),
  category: z.string().trim().min(1).max(60).default("Getting Started"),
  excerpt: z.string().trim().max(400).default(""),
  content: z.string().trim().min(5).max(30_000),
  image: z.string().trim().max(1000).nullable().optional(),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const GET = route(async () => {
  await requireApiAdmin();
  const rows = await db
    .select()
    .from(guides)
    .orderBy(asc(guides.sortOrder), desc(guides.createdAt));
  return jsonOk({ guides: rows });
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, guideSchema);
  const slug = body.slug ? slugify(body.slug) : slugify(body.title);

  const existing = await db
    .select({ id: guides.id })
    .from(guides)
    .where(eq(guides.slug, slug))
    .limit(1);

  if (existing[0]) {
    throw new ApiError(409, "SLUG_TAKEN", "A guide with that slug already exists.");
  }

  const inserted = await db
    .insert(guides)
    .values({
      slug,
      title: body.title,
      category: body.category,
      excerpt: body.excerpt,
      content: body.content,
      image: body.image || null,
      published: body.published,
      sortOrder: body.sortOrder,
    })
    .returning();

  await audit({
    actorId: admin.id,
    action: "admin.guide_created",
    targetType: "guide",
    targetId: inserted[0]?.id,
  });

  return jsonOk({ guide: inserted[0] });
});

export const PATCH = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const updateSchema = guideSchema.partial().extend({
    id: z.string().uuid(),
  });
  const body = await parseBody(req, updateSchema);

  const { id, ...data } = body;
  const slug = data.slug ? slugify(data.slug) : data.title ? slugify(data.title) : undefined;

  if (slug) {
    const existing = await db
      .select({ id: guides.id })
      .from(guides)
      .where(eq(guides.slug, slug))
      .limit(1);

    if (existing[0] && existing[0].id !== id) {
      throw new ApiError(409, "SLUG_TAKEN", "A guide with that slug already exists.");
    }
  }

  const updated = await db
    .update(guides)
    .set({
      ...(slug ? { slug } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
      ...(data.published !== undefined ? { published: data.published } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      updatedAt: new Date(),
    })
    .where(eq(guides.id, id))
    .returning();

  if (!updated[0]) throw new ApiError(404, "NOT_FOUND", "Guide not found.");

  await audit({
    actorId: admin.id,
    action: "admin.guide_updated",
    targetType: "guide",
    targetId: id,
  });

  return jsonOk({ guide: updated[0] });
});

export const DELETE = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) throw new ApiError(400, "MISSING_ID", "Guide id is required.");

  await db.delete(guides).where(eq(guides.id, id));

  await audit({
    actorId: admin.id,
    action: "admin.guide_deleted",
    targetType: "guide",
    targetId: id,
  });

  return jsonOk({ deleted: true });
});
