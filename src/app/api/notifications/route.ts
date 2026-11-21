import type { NextRequest } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { assertSameOrigin, jsonOk, parseBody, requireApiUser, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["read", "read_all"]),
  id: z.string().uuid().optional(),
});

export const GET = route(async () => {
  const user = await requireApiUser();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return jsonOk({
    notifications: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      link: row.link,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
    unread: rows.filter((row) => !row.readAt).length,
  });
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const body = await parseBody(req, schema);

  if (body.action === "read_all") {
    const updated = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
      .returning({ id: notifications.id });
    return jsonOk({ updated: updated.length });
  }

  if (!body.id) return jsonOk({ updated: 0 });
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, body.id), eq(notifications.userId, user.id)))
    .returning({ id: notifications.id });

  return jsonOk({ updated: updated.length });
});
