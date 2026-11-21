"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  priceCoins: number;
  quantity: number;
  categorySlug?: string | null;
  image?: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kiba.cart.v1";
const MAX_QUANTITY = 10;

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        Boolean(line) &&
        typeof line === "object" &&
        typeof (line as CartLine).productId === "string" &&
        typeof (line as CartLine).name === "string" &&
        Number.isFinite((line as CartLine).priceCoins) &&
        Number.isFinite((line as CartLine).quantity),
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    setLines(readStorage());
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be unavailable in private modes; the cart is optional.
    }
  }, [lines]);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((item) => item.productId === line.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === line.productId
            ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + quantity) }
            : item,
        );
      }
      return [...prev, { ...line, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.productId !== productId)
        : prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(MAX_QUANTITY, quantity) }
              : item,
          ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.priceCoins * line.quantity, 0);
    return { lines, ready, count, subtotal, add, remove, setQuantity, clear };
  }, [lines, ready, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
