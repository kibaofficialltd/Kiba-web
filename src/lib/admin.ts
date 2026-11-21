import "server-only";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  coinTransactions,
  deliveries,
  minecraftAccounts,
  orders,
  playerStats,
  tickets,
  users,
} from "@/db/schema";

export async function getAdminOverview() {
  const since = new Date(Date.now() - 24 * 3600_000);

  const [
    userCount,
    linkedCount,
    orderCount,
    orderToday,
    openTickets,
    pendingDeliveries,
    failedDeliveries,
    tracked,
    coinsSpent,
    coinsEarned,
    recentAudit,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(minecraftAccounts),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(orders).where(gte(orders.createdAt, since)),
    db.select({ value: count() }).from(tickets).where(sql`${tickets.status} in ('open','pending')`),
    db.select({ value: count() }).from(deliveries).where(sql`${deliveries.status} in ('queued','claimed')`),
    db.select({ value: count() }).from(deliveries).where(eq(deliveries.status, "failed")),
    db.select({ value: count() }).from(playerStats),
    db
      .select({ value: sql<number>`coalesce(sum(-${coinTransactions.delta}), 0)::bigint` })
      .from(coinTransactions)
      .where(sql`${coinTransactions.delta} < 0`),
    db
      .select({ value: sql<number>`coalesce(sum(${coinTransactions.delta}), 0)::bigint` })
      .from(coinTransactions)
      .where(sql`${coinTransactions.delta} > 0`),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        createdAt: auditLogs.createdAt,
        actor: users.username,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
  ]);

  return {
    users: Number(userCount[0]?.value ?? 0),
    linked: Number(linkedCount[0]?.value ?? 0),
    orders: Number(orderCount[0]?.value ?? 0),
    ordersToday: Number(orderToday[0]?.value ?? 0),
    openTickets: Number(openTickets[0]?.value ?? 0),
    pendingDeliveries: Number(pendingDeliveries[0]?.value ?? 0),
    failedDeliveries: Number(failedDeliveries[0]?.value ?? 0),
    tracked: Number(tracked[0]?.value ?? 0),
    coinsSpent: Number(coinsSpent[0]?.value ?? 0),
    coinsEarned: Number(coinsEarned[0]?.value ?? 0),
    recentAudit,
  };
}

export async function getAdminUsers(limit = 100) {
  return db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      status: users.status,
      balance: users.balance,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
      minecraftUsername: minecraftAccounts.username,
      edition: minecraftAccounts.edition,
    })
    .from(users)
    .leftJoin(minecraftAccounts, eq(minecraftAccounts.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getAuditLog(limit = 100) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      meta: auditLogs.meta,
      ip: auditLogs.ip,
      createdAt: auditLogs.createdAt,
      actor: users.username,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getAdminTickets(status?: string) {
  const rows = await db
    .select({
      id: tickets.id,
      reference: tickets.reference,
      subject: tickets.subject,
      category: tickets.category,
      status: tickets.status,
      priority: tickets.priority,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      username: users.username,
      userId: users.id,
    })
    .from(tickets)
    .innerJoin(users, eq(users.id, tickets.userId))
    .orderBy(desc(tickets.updatedAt))
    .limit(100);

  return status ? rows.filter((row) => row.status === status) : rows;
}
