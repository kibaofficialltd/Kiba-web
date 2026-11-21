import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketMessages, tickets, users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { reference } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { ticketCategories, type TicketCategory } from "@/lib/ticket-categories";

export type TicketSummary = {
  id: string;
  reference: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type TicketThread = TicketSummary & {
  messages: Array<{
    id: string;
    body: string;
    isStaff: boolean;
    author: string | null;
    createdAt: string;
  }>;
};

export async function createTicket(input: {
  userId: string;
  subject: string;
  category: TicketCategory;
  message: string;
}): Promise<TicketSummary> {
  const ticketReference = reference("TKT");

  const result = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(tickets)
      .values({
        reference: ticketReference,
        userId: input.userId,
        category: input.category,
        subject: input.subject,
        priority: input.category === "appeal" || input.category === "purchase" ? "high" : "normal",
      })
      .returning();

    const ticket = inserted[0];
    if (!ticket) throw new ApiError(500, "TICKET_FAILED", "Could not open a ticket.");

    await tx.insert(ticketMessages).values({
      ticketId: ticket.id,
      authorId: input.userId,
      body: input.message,
      isStaff: false,
    });

    return ticket;
  });

  await audit({
    actorId: input.userId,
    action: "tickets.created",
    targetType: "ticket",
    targetId: result.id,
    meta: { reference: result.reference, category: input.category },
  });

  return {
    id: result.id,
    reference: result.reference,
    subject: result.subject,
    category: result.category,
    status: result.status,
    priority: result.priority,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    messageCount: 1,
  };
}

export async function getTicketsForUser(userId: string): Promise<TicketSummary[]> {
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.userId, userId))
    .orderBy(desc(tickets.updatedAt))
    .limit(50);

  const messages = await db.select().from(ticketMessages);
  const counts = new Map<string, number>();
  for (const message of messages) {
    counts.set(message.ticketId, (counts.get(message.ticketId) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    subject: row.subject,
    category: row.category,
    status: row.status,
    priority: row.priority,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messageCount: counts.get(row.id) ?? 0,
  }));
}

export async function getTicketThread(
  ticketReference: string,
  viewer: { userId: string; staff: boolean },
): Promise<TicketThread | null> {
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.reference, ticketReference))
    .limit(1);
  const ticket = rows[0];
  if (!ticket) return null;
  if (!viewer.staff && ticket.userId !== viewer.userId) return null;

  const messages = await db
    .select({
      id: ticketMessages.id,
      body: ticketMessages.body,
      isStaff: ticketMessages.isStaff,
      createdAt: ticketMessages.createdAt,
      author: users.username,
    })
    .from(ticketMessages)
    .leftJoin(users, eq(users.id, ticketMessages.authorId))
    .where(eq(ticketMessages.ticketId, ticket.id))
    .orderBy(asc(ticketMessages.createdAt));

  return {
    id: ticket.id,
    reference: ticket.reference,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messageCount: messages.length,
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      isStaff: message.isStaff,
      author: message.author,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

export async function replyToTicket(input: {
  ticketId: string;
  authorId: string;
  body: string;
  staff: boolean;
  reopen?: boolean;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(ticketMessages).values({
      ticketId: input.ticketId,
      authorId: input.authorId,
      body: input.body,
      isStaff: input.staff,
    });

    await tx
      .update(tickets)
      .set({
        updatedAt: new Date(),
        status: input.staff ? "pending" : input.reopen === false ? "open" : "open",
      })
      .where(eq(tickets.id, input.ticketId));
  });
}

export async function setTicketStatus(ticketId: string, status: "open" | "pending" | "resolved" | "closed") {
  await db.update(tickets).set({ status, updatedAt: new Date() }).where(eq(tickets.id, ticketId));
}

export async function findTicketByReference(ticketReference: string) {
  const rows = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.reference, ticketReference)))
    .limit(1);
  return rows[0] ?? null;
}
