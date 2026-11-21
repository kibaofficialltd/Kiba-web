import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { deliveries, orderItems, orders, rewardClaims } from "@/db/schema";
import { jsonOk, route, ApiError } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  const { body } = await verifyPluginRequest(req);
  const data = (body ?? {}) as {
    transactionId?: string;
    deliveryId?: string;
    status?: string;
    success?: boolean;
    error?: string;
  };

  const deliveryId = data.transactionId ?? data.deliveryId;
  if (!deliveryId) {
    throw new ApiError(422, "VALIDATION_ERROR", "Missing transactionId / deliveryId.");
  }

  const isSuccess = data.success !== undefined
    ? Boolean(data.success)
    : (data.status?.toUpperCase() === "SUCCESS" || data.status?.toUpperCase() === "DELIVERED");

  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .limit(1);
    const delivery = rows[0];
    if (!delivery) throw new ApiError(404, "DELIVERY_NOT_FOUND", "Unknown delivery id.");

    if (isSuccess) {
      await tx
        .update(deliveries)
        .set({ status: "delivered", deliveredAt: new Date(), lastError: null })
        .where(eq(deliveries.id, deliveryId));

      const payload = (delivery.payload ?? {}) as { claimId?: string; orderId?: string; itemId?: string };

      if (payload.claimId) {
        await tx
          .update(rewardClaims)
          .set({ status: "delivered", deliveredAt: new Date(), error: null })
          .where(eq(rewardClaims.id, payload.claimId));
      }

      if (payload.itemId) {
        await tx
          .update(orderItems)
          .set({ deliveryStatus: "delivered" })
          .where(eq(orderItems.id, payload.itemId));
      }

      if (payload.orderId) {
        const remaining = await tx
          .select({ count: sql<number>`count(*)` })
          .from(orderItems)
          .where(sql`${orderItems.orderId} = ${payload.orderId} AND ${orderItems.deliveryStatus} != 'delivered'`);
        if (Number(remaining[0]?.count ?? 0) === 0) {
          await tx
            .update(orders)
            .set({ status: "delivered", updatedAt: new Date() })
            .where(eq(orders.id, payload.orderId));
        }
      }
    } else {
      await tx
        .update(deliveries)
        .set({
          status: delivery.attempts >= 5 ? "failed" : "queued",
          lastError: data.error ?? "Plugin reported delivery failure.",
        })
        .where(eq(deliveries.id, deliveryId));
    }
  });

  return jsonOk({ success: true, confirmed: true });
});
