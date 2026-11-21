import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonOk, parseBody, requireApiUser, route } from "@/lib/api";
import { requireVerifiedEmail } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createTicket, getTicketsForUser } from "@/lib/support";
import { ticketCategories } from "@/lib/ticket-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categoryValues = ticketCategories.map((category) => category.value) as [string, ...string[]];

const schema = z.object({
  subject: z.string().trim().min(6, "Give your ticket a clear subject.").max(120),
  category: z.enum(categoryValues),
  message: z.string().trim().min(30, "Describe the issue in at least 30 characters.").max(5000),
});

export const GET = route(async () => {
  const user = await requireApiUser();
  return jsonOk({ tickets: await getTicketsForUser(user.id) });
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await requireVerifiedEmail(user.id);
  await enforceRateLimit(`support:create:${user.id}`, 5, 3600, "You have opened several tickets recently. Please wait before opening another.");

  const body = await parseBody(req, schema);
  const ticket = await createTicket({
    userId: user.id,
    subject: body.subject,
    category: body.category as (typeof ticketCategories)[number]["value"],
    message: body.message,
  });

  return jsonOk({ ticket });
});
