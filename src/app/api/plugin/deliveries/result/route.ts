import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { deliveries, orderItems, orders, rewardClaims } from "@/db/schema";
import { jsonOk, route, ApiError } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";
import { pluginDeliveryResultSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  const { body } = await verifyPluginRequest(req);
  const parsed = pluginDeliveryResultSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid delivery result.", parsed.error.issues);
  }
  const { deliveryId, success, error } = parsed.data;

  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, deliveryId))
      .limit(1);
    const delivery = rows[0];
    if (!delivery) throw new ApiError(404, "DELIVERY_NOT_FOUND", "Unknown delivery id.");

    if (success) {
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
          .select({ pending: sql<number>`count(*)::int` })
          .from(orderItems)
          .where(sql`${orderItems.orderId} = ${payload.orderId} AND ${orderItems.deliveryStatus} <> 'delivered'`);

        if (Number(remaining[0]?.pending ?? 0) === 0) {
          await tx
            .update(orders)
            .set({ status: "delivered", deliveredAt: new Date(), updatedAt: new Date() })
            .where(eq(orders.id, payload.orderId));
        } else {
          await tx
            .update(orders)
            .set({ status: "processing", updatedAt: new Date() })
            .where(eq(orders.id, payload.orderId));
        }
      }
    } else {
      const shouldRetry = delivery.attempts < 3;
      await tx
        .update(deliveries)
        .set({
          status: shouldRetry ? "queued" : "failed",
          claimedAt: null,
          lastError: error ?? "Plugin reported failure",
        })
        .where(eq(deliveries.id, deliveryId));

      const payload = (delivery.payload ?? {}) as { claimId?: string; orderId?: string; itemId?: string };

      if (!shouldRetry) {
        if (payload.claimId) {
          await tx
            .update(rewardClaims)
            .set({ status: "failed", error: error ?? "Delivery failed" })
            .where(eq(rewardClaims.id, payload.claimId));
        }
        if (payload.itemId) {
          await tx
            .update(orderItems)
            .set({ deliveryStatus: "failed" })
            .where(eq(orderItems.id, payload.itemId));
        }
        if (payload.orderId) {
          await tx
            .update(orders)
            .set({
              status: "failed",
              failureReason: error ?? "Reward delivery failed",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, payload.orderId));
        }
      }
    }
  });

  return jsonOk({ recorded: true, retrying: !success });
});
