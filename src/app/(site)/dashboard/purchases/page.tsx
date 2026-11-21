import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, Coins, Package, Receipt, RotateCcw } from "lucide-react";
import { db } from "@/db";
import { coinTransactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getOrderHistory } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { formatCoins, formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "My purchases" };
export const dynamic = "force-dynamic";

const statusTone: Record<string, "moss" | "gold" | "ember" | "sky" | "default"> = {
  delivered: "moss",
  processing: "gold",
  pending: "gold",
  queued: "gold",
  failed: "ember",
  refunded: "sky",
  cancelled: "default",
};

export default async function PurchasesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [orders, ledger] = await Promise.all([
    getOrderHistory(user.id, 30),
    db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, user.id))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(40),
  ]);

  const spent = orders
    .filter((order) => order.status !== "failed" && order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalCoins, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Purchases</p>
          <h1 className="display-md">Everything you have spent.</h1>
          <p className="mt-1 text-sm text-muted">
            Orders are delivered in-game by KIBAOFFICIALCore. Delivery attempts are retried before
            an order is marked failed.
          </p>
        </div>
        <Link href="/store" className="btn btn-gold btn-sm">
          <Coins className="size-3.5" /> Store
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">Orders</p>
          <p className="mt-1 font-display text-2xl">{orders.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">Coins spent</p>
          <p className="mt-1 font-display text-2xl text-gold-bright">{formatNumber(spent)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted">Balance</p>
          <p className="mt-1 font-display text-2xl">{formatNumber(user.balance)}</p>
        </div>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
          <span className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
            <Receipt className="size-3.5 text-moss" /> Orders
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="mx-auto size-7 text-muted/40" />
            <p className="mt-2 text-sm text-muted">No orders yet.</p>
            <Link href="/store" className="btn btn-ghost btn-sm mt-4">
              Open the store
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line/50">
            {orders.map((order) => (
              <div key={order.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-mono text-xs text-parchment">
                      {order.reference}
                      <Badge tone={statusTone[order.status] ?? "default"}>{order.status}</Badge>
                    </p>
                    <p className="mt-1 text-[0.66rem] text-muted">
                      {formatDateTime(order.createdAt)} · {order.itemCount} item
                      {order.itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="font-display text-lg text-gold-bright">
                    −{formatCoins(order.totalCoins)}
                  </p>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-parchment-dim">
                        {item.name}
                        <span className="ml-1.5 text-xs text-muted">×{item.quantity}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted">
                          {formatCoins(item.unitCoins * item.quantity)}
                        </span>
                        <Badge tone={statusTone[item.deliveryStatus] ?? "default"}>
                          {item.deliveryStatus}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>

                {order.failureReason ? (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-ember/25 bg-ember/[0.06] p-2.5 text-xs text-[#f0a49d]">
                    <RotateCcw className="mt-0.5 size-3.5 shrink-0" />
                    {order.failureReason} — open a support ticket with this reference and staff can
                    re-queue the delivery.
                  </p>
                ) : null}

                {order.status === "failed" ? (
                  <Link href="/support" className="btn btn-ghost btn-sm mt-3">
                    Contact support <ArrowRight className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
          <span className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
            <Coins className="size-3.5 text-gold" /> Coin ledger
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">last 40</span>
        </div>

        {ledger.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">No coin activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Reason</th>
                  <th>Note</th>
                  <th className="text-right">Change</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap text-xs text-muted">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="text-xs">{entry.reason.replaceAll("_", " ")}</td>
                    <td className="max-w-[220px] truncate text-xs text-muted">
                      {entry.note ?? "—"}
                    </td>
                    <td
                      className={
                        entry.delta >= 0
                          ? "text-right font-mono text-xs text-moss-bright"
                          : "text-right font-mono text-xs text-ember"
                      }
                    >
                      {entry.delta >= 0 ? "+" : ""}
                      {formatNumber(entry.delta)}
                    </td>
                    <td className="text-right font-mono text-xs text-muted">
                      {formatNumber(entry.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
