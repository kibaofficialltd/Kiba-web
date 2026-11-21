import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { minecraftAccounts, orderItems, orders, products } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { adjustCoins, queueDelivery } from "@/lib/coins";
import { reference } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export type CartLine = { productId: string; quantity: number };

export type OrderView = {
  id: string;
  reference: string;
  status: string;
  totalCoins: number;
  itemCount: number;
  createdAt: string;
  deliveredAt: string | null;
  failureReason: string | null;
  items: Array<{
    id: string;
    name: string;
    unitCoins: number;
    quantity: number;
    deliveryStatus: string;
  }>;
};

export async function getOrderHistory(userId: string, limit = 50): Promise<OrderView[]> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  if (orderRows.length === 0) return [];

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(
      sql`${orderItems.orderId} in (${sql.join(
        orderRows.map((order) => sql`${order.id}`),
        sql`, `,
      )})`,
    );

  const byOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = byOrder.get(item.orderId) ?? [];
    list.push(item);
    byOrder.set(item.orderId, list);
  }

  return orderRows.map((order) => ({
    id: order.id,
    reference: order.reference,
    status: order.status,
    totalCoins: order.totalCoins,
    itemCount: order.itemCount,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    failureReason: order.failureReason,
    items: (byOrder.get(order.id) ?? []).map((item) => ({
      id: item.id,
      name: item.productName,
      unitCoins: item.unitCoins,
      quantity: item.quantity,
      deliveryStatus: item.deliveryStatus,
    })),
  }));
}

type CheckoutResult = {
  orderId: string;
  reference: string;
  totalCoins: number;
  balance: number;
  itemCount: number;
  status: string;
};

/**
 * Spends coins and queues the in-game commands in one transaction.
 *
 * Everything that can fail (link state, stock, per-player limits, balance)
 * is checked against server-side rows — the browser only sends product IDs and
 * quantities, never prices.
 */
export async function checkout(userId: string, lines: CartLine[]): Promise<CheckoutResult> {
  const merged = new Map<string, number>();
  for (const line of lines) {
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  }
  if (merged.size === 0) {
    throw new ApiError(400, "EMPTY_CART", "Add at least one product before checking out.");
  }

  const accountRows = await db
    .select()
    .from(minecraftAccounts)
    .where(eq(minecraftAccounts.userId, userId))
    .limit(1);
  const account = accountRows[0];
  if (!account) {
    throw new ApiError(409, "MINECRAFT_NOT_LINKED", "Link your Minecraft account before purchasing.");
  }

  const ids = [...merged.keys()];
  const productRows = await db
    .select()
    .from(products)
    .where(sql`${products.id} in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);

  if (productRows.length !== ids.length) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "One of the products in your cart is no longer available.");
  }

  const purchasedRows = await db
    .select({
      productId: orderItems.productId,
      total: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.userId, userId), sql`${orders.status} <> 'failed'`))
    .groupBy(orderItems.productId);

  const purchased = new Map(purchasedRows.map((row) => [row.productId, Number(row.total)]));

  let total = 0;
  const prepared = productRows.map((product) => {
    const quantity = merged.get(product.id)!;
    if (!product.active) {
      throw new ApiError(409, "PRODUCT_INACTIVE", `${product.name} is not available right now.`);
    }
    if (quantity < 1 || quantity > 10) {
      throw new ApiError(400, "INVALID_QUANTITY", "Quantities must be between 1 and 10.");
    }
    if (product.stock !== null && product.stock < quantity) {
      throw new ApiError(409, "OUT_OF_STOCK", `${product.name} does not have enough stock left.`);
    }
    if (product.perPlayerLimit !== null) {
      const already = purchased.get(product.id) ?? 0;
      if (already + quantity > product.perPlayerLimit) {
        throw new ApiError(
          409,
          "PURCHASE_LIMIT",
          `${product.name} is limited to ${product.perPlayerLimit} per player.`,
        );
      }
    }
    total += product.priceCoins * quantity;
    return { product, quantity };
  });

  const orderRef = reference("KIB");

  const result = await db.transaction(async (tx) => {
    // Stock is guarded in the UPDATE itself so two concurrent checkouts cannot
    // both claim the last unit.
    for (const { product, quantity } of prepared) {
      if (product.stock !== null) {
        const reserved = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${quantity}`, updatedAt: new Date() })
          .where(and(eq(products.id, product.id), sql`${products.stock} >= ${quantity}`))
          .returning({ id: products.id });
        if (!reserved[0]) {
          throw new ApiError(409, "OUT_OF_STOCK", `${product.name} sold out while checking out.`);
        }
      }
    }

    const balance = await adjustCoins(tx, userId, -total, "purchase", {
      refType: "order",
      refId: orderRef,
      note: `${prepared.length} item order`,
    });

    const insertedOrders = await tx
      .insert(orders)
      .values({
        reference: orderRef,
        userId,
        status: "processing",
        totalCoins: total,
        itemCount: prepared.reduce((sum, item) => sum + item.quantity, 0),
      })
      .returning({ id: orders.id });

    const order = insertedOrders[0];
    if (!order) throw new ApiError(500, "ORDER_FAILED", "Could not create the order.");

    let queued = 0;

    for (const { product, quantity } of prepared) {
      const itemRows = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          unitCoins: product.priceCoins,
          quantity,
          commands: product.commands,
          deliveryStatus: product.commands.length > 0 ? "queued" : "delivered",
        })
        .returning({ id: orderItems.id });

      const item = itemRows[0];
      if (!item) continue;

      if (product.commands.length > 0) {
        const expanded: string[] = [];
        for (let unit = 0; unit < quantity; unit++) {
          for (const command of product.commands) {
            expanded.push(
              command
                .replaceAll("{player}", account.username)
                .replaceAll("{uuid}", account.uuid)
                .replaceAll("{username}", account.username),
            );
          }
        }

        const deliveryId = await queueDelivery(tx, {
          kind: "store_purchase",
          minecraftUuid: account.uuid,
          minecraftUsername: account.username,
          commands: expanded,
          idempotencyKey: `order:${order.id}:${item.id}`,
          payload: { orderId: order.id, itemId: item.id, productId: product.id },
        });

        if (deliveryId) {
          queued += 1;
          await tx
            .update(orderItems)
            .set({ deliveryId })
            .where(eq(orderItems.id, item.id));
        }
      }
    }

    if (queued === 0) {
      await tx
        .update(orders)
        .set({ status: "delivered", deliveredAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, order.id));
    }

    return {
      orderId: order.id,
      reference: orderRef,
      totalCoins: total,
      balance,
      itemCount: prepared.reduce((sum, item) => sum + item.quantity, 0),
      status: queued === 0 ? "delivered" : "processing",
    };
  });

  await audit({
    actorId: userId,
    action: "store.checkout",
    targetType: "order",
    targetId: result.orderId,
    meta: { reference: result.reference, total, items: merged.size },
  });

  return result;
}
