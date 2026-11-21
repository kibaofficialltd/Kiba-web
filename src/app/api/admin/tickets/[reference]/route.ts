import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifications, tickets } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  clientIp,
  jsonOk,
  parseBody,
  requireApiStaff,
  route,
} from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(["open", "pending", "resolved", "closed"]) });

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ reference: string }> }) => {
  assertSameOrigin(req);
  const staff = await requireApiStaff();
  const { reference } = await ctx.params;
  const body = await parseBody(req, schema);

  const rows = await db.select().from(tickets).where(eq(tickets.reference, reference)).limit(1);
  const ticket = rows[0];
  if (!ticket) throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found.");

  await db.update(tickets).set({ status: body.status, updatedAt: new Date() }).where(eq(tickets.id, ticket.id));

  if (body.status === "resolved" || body.status === "closed") {
    await db.insert(notifications).values({
      userId: ticket.userId,
      type: "ticket",
      title: `Ticket ${ticket.reference} ${body.status}`,
      body: `Your ticket “${ticket.subject}” was marked ${body.status} by staff.`,
      link: `/support/${ticket.reference}`,
    });
  }

  await audit({
    actorId: staff.id,
    action: "admin.ticket_status",
    targetType: "ticket",
    targetId: ticket.id,
    meta: { status: body.status, reference, ip: clientIp(req) },
  });

  return jsonOk({ updated: true });
});
