"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Coins, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { formatCoins, formatNumber } from "@/lib/format";

type CheckoutResponse = {
  orderId: string;
  reference: string;
  totalCoins: number;
  balance: number;
  itemCount: number;
  status: string;
};

export function CartView({
  signedIn,
  linked,
  balance,
}: {
  signedIn: boolean;
  linked: boolean;
  balance: number;
}) {
  const router = useRouter();
  const { lines, ready, subtotal, setQuantity, remove, clear, count } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResponse | null>(null);

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const data = await api<CheckoutResponse>("/api/store/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        }),
      });
      clear();
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Checkout could not be completed.");
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className="panel grain mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-moss/40 bg-moss/10">
          <CheckCircle2 className="size-6 text-moss-bright" />
        </span>
        <h1 className="display-md mt-5">Order placed.</h1>
        <p className="mt-2 text-sm text-muted">
          {result.itemCount} item{result.itemCount === 1 ? "" : "s"} for{" "}
          <span className="text-gold-bright">{formatCoins(result.totalCoins)} coins</span>.
          {result.status === "delivered"
            ? " Everything was applied immediately."
            : " KIBAOFFICIALCore will apply it in-game within seconds."}
        </p>

        <div className="mt-5 rounded-lg border border-line bg-ink/50 p-4 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Order reference</span>
            <span className="font-mono text-parchment">{result.reference}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted">Status</span>
            <span className="text-moss-bright">{result.status}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted">Balance after</span>
            <span className="text-gold-bright">{formatNumber(result.balance)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/purchases" className="btn btn-primary">
            View purchases <ArrowRight className="size-4" />
          </Link>
          <Link href="/store" className="btn btn-ghost">
            Keep browsing
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="panel h-48 skeleton" />;
  }

  if (lines.length === 0) {
    return (
      <div className="panel mx-auto max-w-xl p-10 text-center">
        <ShoppingBag className="mx-auto size-8 text-muted/50" />
        <h1 className="display-md mt-4">Your cart is empty.</h1>
        <p className="mt-2 text-sm text-muted">
          Browse the coin store and add something worth building around.
        </p>
        <Link href="/store" className="btn btn-primary mt-6">
          Open the store <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  const overBudget = signedIn && subtotal > balance;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
          <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Cart · {count} item{count === 1 ? "" : "s"}
          </h2>
          <button type="button" onClick={clear} className="text-xs text-muted transition hover:text-ember">
            Clear all
          </button>
        </div>

        <ul className="divide-y divide-line/50">
          {lines.map((line) => (
            <li key={line.productId} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/store/${line.slug}`}
                  className="font-display text-base text-parchment transition hover:text-gold-bright"
                >
                  {line.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  {formatCoins(line.priceCoins)} coins each
                </p>
              </div>

              <div className="flex items-center rounded-lg border border-line">
                <button
                  type="button"
                  className="grid size-8 place-items-center text-muted transition hover:text-parchment"
                  onClick={() => setQuantity(line.productId, line.quantity - 1)}
                  aria-label={`Decrease ${line.name} quantity`}
                >
                  <Minus className="size-3" />
                </button>
                <span className="w-8 text-center font-mono text-xs">{line.quantity}</span>
                <button
                  type="button"
                  className="grid size-8 place-items-center text-muted transition hover:text-parchment disabled:opacity-40"
                  onClick={() => setQuantity(line.productId, line.quantity + 1)}
                  disabled={line.quantity >= 10}
                  aria-label={`Increase ${line.name} quantity`}
                >
                  <Plus className="size-3" />
                </button>
              </div>

              <p className="w-24 text-right font-mono text-sm text-gold-bright">
                {formatCoins(line.priceCoins * line.quantity)}
              </p>

              <button
                type="button"
                onClick={() => remove(line.productId)}
                className="grid size-8 place-items-center rounded-md text-muted transition hover:bg-ember/10 hover:text-ember"
                aria-label={`Remove ${line.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-[92px] lg:self-start">
        <div className="panel overflow-hidden">
          <div className="border-b border-line/70 px-5 py-3.5">
            <h2 className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-parchment">
              Order summary
            </h2>
          </div>

          <div className="space-y-3 p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-mono text-parchment">{formatCoins(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Delivery</span>
              <span className="text-moss-bright">In-game</span>
            </div>
            <div className="flex items-center justify-between border-t border-line/60 pt-3">
              <span className="font-semibold text-parchment">Total</span>
              <span className="flex items-center gap-1.5 font-display text-xl text-gold-bright">
                <Coins className="size-4" /> {formatCoins(subtotal)}
              </span>
            </div>

            {signedIn ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Your balance</span>
                <span className={overBudget ? "text-ember" : "text-parchment-dim"}>
                  {formatNumber(balance)} coins
                </span>
              </div>
            ) : null}

            <FormAlert message={error} />

            {!signedIn ? (
              <Link href="/login?next=/store/cart" className="btn btn-primary btn-block">
                Sign in to checkout
              </Link>
            ) : !linked ? (
              <Link href="/dashboard/link" className="btn btn-gold btn-block">
                Link Minecraft to checkout
              </Link>
            ) : (
              <button
                type="button"
                onClick={checkout}
                disabled={pending || overBudget}
                className="btn btn-gold btn-block btn-lg"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Coins className="size-4" />}
                {pending ? "Processing" : overBudget ? "Not enough coins" : "Spend coins"}
              </button>
            )}

            {overBudget ? (
              <p className="text-[0.7rem] text-ember">
                You need {formatCoins(subtotal - balance)} more coins. Claim your daily reward or
                spin the wheel — both are free.
              </p>
            ) : null}

            <p className="border-t border-line/60 pt-3 text-[0.66rem] leading-relaxed text-muted">
              By checking out you confirm this purchase should be applied to your linked Minecraft
              UUID. Coins are non-refundable once delivered.
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href="/dashboard/rewards" className="btn btn-quiet btn-sm flex-1">
            Claim reward
          </Link>
          <Link href="/dashboard/spin" className="btn btn-quiet btn-sm flex-1">
            Daily spin
          </Link>
        </div>
      </aside>
    </div>
  );
}
