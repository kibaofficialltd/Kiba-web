"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, Coins, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { FormAlert } from "@/components/ui/form";
import { formatCoins } from "@/lib/format";

export function AddToCart({
  product,
  disabled,
  signedIn,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCoins: number;
    categorySlug: string | null;
    image: string | null;
    stock: number | null;
  };
  disabled: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const max = Math.min(10, product.stock ?? 10);

  function addToCart(goToCart = false) {
    setError(null);
    if (!signedIn) {
      router.push(`/login?next=/store/${product.slug}`);
      return;
    }
    if (disabled) {
      setError("This item is not available right now.");
      return;
    }
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCoins: product.priceCoins,
        categorySlug: product.categorySlug,
        image: product.image,
      },
      quantity,
    );
    setAdded(true);
    if (goToCart) {
      router.push("/store/cart");
      return;
    }
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      {error ? <FormAlert message={error} /> : null}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-lg border border-line">
          <button
            type="button"
            className="grid size-10 place-items-center text-muted transition hover:text-parchment disabled:opacity-40"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-10 text-center font-mono text-sm" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="grid size-10 place-items-center text-muted transition hover:text-parchment disabled:opacity-40"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            disabled={quantity >= max}
            aria-label="Increase quantity"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <p className="text-xs text-muted">
          Total{" "}
          <span className="font-display text-base text-gold-bright">
            {formatCoins(product.priceCoins * quantity)} coins
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => addToCart(true)}
          className="btn btn-gold btn-lg"
          disabled={disabled}
        >
          <ShoppingBag className="size-4" /> Buy now
        </button>
        <button
          type="button"
          onClick={() => addToCart(false)}
          className="btn btn-ghost btn-lg"
          disabled={disabled}
        >
          {added ? <Check className="size-4 text-moss-bright" /> : <Coins className="size-4" />}
          {added ? "Added to cart" : "Add to cart"}
        </button>
      </div>

      {!signedIn ? (
        <p className="text-xs text-muted">
          <Link href="/login" className="text-moss hover:text-moss-bright">
            Sign in
          </Link>{" "}
          to add items — purchases are tied to your verified Minecraft profile.
        </p>
      ) : null}
    </div>
  );
}
