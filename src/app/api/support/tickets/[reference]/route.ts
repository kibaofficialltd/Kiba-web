import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonOk, parseBody, requireApiUser, route } from "@/lib/api";
import { isStaff } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { findTicketByReference, getTicketThread, replyToTicket } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ body: z.string().trim().min(1).max(5000) });

export const GET = route(async (_req: NextRequest, ctx: { params: Promise<{ reference: string }> }) => {
  const user = await requireApiUser();
  const { reference } = await ctx.params;
  const thread = await getTicketThread(reference, { userId: user.id, staff: isStaff(user.role) });
  if (!thread) return jsonOk({ ticket: null });
  return jsonOk({ ticket: thread });
});

export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ reference: string }> }) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await enforceRateLimit(`support:reply:${user.id}`, 40, 3600, "Slow down — too many replies.");

  const { reference } = await ctx.params;
  const ticket = await findTicketByReference(reference);
  const staff = isStaff(user.role);
  if (!ticket || (!staff && ticket.userId !== user.id)) {
    return jsonOk({ replied: false });
  }

  const body = await parseBody(req, schema);
  await replyToTicket({
    ticketId: ticket.id,
    authorId: user.id,
    body: body.body,
    staff,
  });

  return jsonOk({ replied: true });
});
