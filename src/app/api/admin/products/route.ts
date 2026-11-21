import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
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
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(80).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tagline: z.string().trim().max(300).default(""),
  description: z.string().trim().max(4000).default(""),
  priceCoins: z.number().int().min(0).max(100_000_000),
  compareAtCoins: z.number().int().min(0).max(100_000_000).nullable().optional(),
  image: z.string().trim().max(500).nullable().optional(),
  badge: z.string().trim().max(40).nullable().optional(),
  commands: z.array(z.string().trim().max(500)).max(50).default([]),
  perPlayerLimit: z.number().int().min(1).max(100).nullable().optional(),
  stock: z.number().int().min(0).max(1_000_000).nullable().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
};

const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base }).partial().required({ id: true });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, createSchema);
  const slug = body.slug ? slugify(body.slug) : slugify(body.name);

  const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
  if (existing[0]) throw new ApiError(409, "SLUG_TAKEN", "A product with that slug already exists.");

  const inserted = await db
    .insert(products)
    .values({
      slug,
      name: body.name,
      categoryId: body.categoryId ?? null,
      tagline: body.tagline,
      description: body.description,
      priceCoins: body.priceCoins,
      compareAtCoins: body.compareAtCoins ?? null,
      image: body.image ?? null,
      badge: body.badge ?? null,
      commands: body.commands,
      perPlayerLimit: body.perPlayerLimit ?? null,
      stock: body.stock ?? null,
      featured: body.featured,
      active: body.active,
      sortOrder: body.sortOrder,
    })
    .returning({ id: products.id, slug: products.slug });

  await audit({
    actorId: admin.id,
    action: "admin.product_created",
    targetType: "product",
    targetId: inserted[0]?.id,
    meta: { slug, ip: clientIp(req) },
  });

  return jsonOk({ product: inserted[0] });
});

export const PATCH = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, updateSchema);
  const { id, ...rest } = body;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of [
    "name",
    "categoryId",
    "tagline",
    "description",
    "priceCoins",
    "compareAtCoins",
    "image",
    "badge",
    "commands",
    "perPlayerLimit",
    "stock",
    "featured",
    "active",
    "sortOrder",
  ] as const) {
    if (rest[key] !== undefined) patch[key] = rest[key];
  }
  if (rest.slug) patch.slug = slugify(rest.slug);

  const updated = await db.update(products).set(patch).where(eq(products.id, id)).returning({ id: products.id });
  if (!updated[0]) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");

  await audit({
    actorId: admin.id,
    action: "admin.product_updated",
    targetType: "product",
    targetId: id,
    meta: { fields: Object.keys(patch), ip: clientIp(req) },
  });

  return jsonOk({ updated: true });
});

export const DELETE = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) throw new ApiError(400, "ID_REQUIRED", "Pass ?id=");

  const updated = await db
    .update(products)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning({ id: products.id });
  if (!updated[0]) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");

  await audit({
    actorId: admin.id,
    action: "admin.product_deactivated",
    targetType: "product",
    targetId: id,
    ip: clientIp(req),
  });

  return jsonOk({ deactivated: true });
});
