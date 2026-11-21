import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getLinkedAccount } from "@/lib/minecraft";
import { CartView } from "./cart-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await getCurrentUser();
  const account = user ? await getLinkedAccount(user.id) : null;

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="mb-8">
        <p className="eyebrow mb-2">Coin store</p>
        <h1 className="display-lg">Review your order.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Prices are checked again on the server at checkout. Nothing is deducted until every item
          passes stock, limit and balance checks.
        </p>
      </header>

      <CartView
        signedIn={Boolean(user)}
        linked={Boolean(account)}
        balance={user?.balance ?? 0}
      />
    </div>
  );
}
