'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/types';

export interface CartItem {
  key: string; // productId + size
  product_id: number;
  name: string;
  size: string | null;
  qty: number;
  unit_price: number;
  image: string | null;
  max_stock: number;
}

const STORAGE_KEY = 'stylein_cart_v1';

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode) — cart is session-only */
  }
}

function primaryImage(p: Product): string | null {
  const primary = p.images?.find((i) => i.is_primary) ?? p.images?.[0];
  return primary?.image_url ?? null;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(items);
  }, [items, hydrated]);

  const add = useCallback(
    (product: Product, size: string | null, qty = 1) => {
      setItems((prev) => {
        const key = `${product.id}::${size ?? ''}`;
        const existing = prev.find((i) => i.key === key);
        const max = product.stock;
        if (existing) {
          const nextQty = Math.min(existing.qty + qty, max);
          return prev.map((i) =>
            i.key === key ? { ...i, qty: nextQty, max_stock: max } : i,
          );
        }
        return [
          ...prev,
          {
            key,
            product_id: product.id,
            name: product.name,
            size,
            qty: Math.min(qty, max),
            unit_price: Number(product.discounted_price),
            image: primaryImage(product),
            max_stock: max,
          },
        ];
      });
    },
    [],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.key === key
            ? { ...i, qty: Math.max(0, Math.min(qty, i.max_stock)) }
            : i,
        )
        .filter((i) => i.qty > 0),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unit_price * i.qty, 0),
    [items],
  );
  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  );

  return { items, add, setQty, remove, clear, subtotal, count, hydrated };
}
