'use client';

import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';
import Reveal from './Reveal';

interface Props {
  title: string;
  accent?: boolean;
  products: Product[];
  wishlist: Set<number>;
  onToggleWish: (id: number) => void;
  onQuickView: (p: Product) => void;
  onQuickAdd: (p: Product, size: string | null) => void;
  onViewAll: () => void;
}

/** Horizontal, swipeable rail of product cards with a section heading. */
export default function ProductRail({
  title,
  accent = false,
  products,
  wishlist,
  onToggleWish,
  onQuickView,
  onQuickAdd,
  onViewAll,
}: Props) {
  if (products.length === 0) return null;

  return (
    <Reveal as="section" className="container-page py-6">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="heading text-xl sm:text-2xl">
          {accent && <span className="text-brand">— </span>}
          {title}
        </h2>
        <button
          onClick={onViewAll}
          className="text-sm font-semibold text-muted transition hover:text-brand"
        >
          View all →
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-[200px] flex-shrink-0 sm:w-[240px]">
            <ProductCard
              product={p}
              wished={wishlist.has(p.id)}
              onToggleWish={onToggleWish}
              onQuickView={onQuickView}
              onQuickAdd={onQuickAdd}
            />
          </div>
        ))}
      </div>
    </Reveal>
  );
}
