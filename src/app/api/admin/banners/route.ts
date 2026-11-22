import type { NextRequest } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { ApiError, assertSameOrigin, jsonOk, parseBody, requireApiAdmin, route } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bannerSchema = z.object({
  title: z.string().trim().min(2).max(150),
  subtitle: z.string().trim().max(300).nullable().optional(),
  imageUrl: z.string().trim().url().max(1000),
  linkUrl: z.string().trim().max(500).nullable().optional(),
  buttonText: z.string().trim().max(50).nullable().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const GET = route(async () => {
  await requireApiAdmin();
  const rows = await db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), desc(banners.createdAt));
  return jsonOk({ banners: rows });
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, bannerSchema);

  const inserted = await db
    .insert(banners)
    .values({
      title: body.title,
      subtitle: body.subtitle || null,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl || null,
      buttonText: body.buttonText || null,
      active: body.active,
      sortOrder: body.sortOrder,
    })
    .returning();

  await audit({
    actorId: admin.id,
    action: "admin.banner_created",
    targetType: "banner",
    targetId: inserted[0]?.id,
  });

  return jsonOk({ banner: inserted[0] });
});

export const PATCH = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const updateSchema = bannerSchema.partial().extend({
    id: z.string().uuid(),
  });
  const body = await parseBody(req, updateSchema);

  const { id, ...data } = body;
  const updated = await db
    .update(banners)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.subtitle !== undefined ? { subtitle: data.subtitle || null } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl || null } : {}),
      ...(data.buttonText !== undefined ? { buttonText: data.buttonText || null } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      updatedAt: new Date(),
    })
    .where(eq(banners.id, id))
    .returning();

  if (!updated[0]) throw new ApiError(404, "NOT_FOUND", "Banner not found.");

  await audit({
    actorId: admin.id,
    action: "admin.banner_updated",
    targetType: "banner",
    targetId: id,
  });

  return jsonOk({ banner: updated[0] });
});

export const DELETE = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) throw new ApiError(400, "MISSING_ID", "Banner id is required.");

  await db.delete(banners).where(eq(banners.id, id));

  await audit({
    actorId: admin.id,
    action: "admin.banner_deleted",
    targetType: "banner",
    targetId: id,
  });

  return jsonOk({ deleted: true });
});
