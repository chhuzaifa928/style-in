'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { formatPKR, discountPercent } from '@/lib/format';
import { IconHeart, IconHeartFill, IconPlus } from './icons';

interface Props {
  product: Product;
  wished: boolean;
  onToggleWish: (id: number) => void;
  onQuickView: (p: Product) => void;
  onQuickAdd: (p: Product, size: string | null) => void;
}

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="100%" height="100%" fill="#F1F0EC"/><text x="50%" y="50%" font-family="sans-serif" font-size="26" fill="#B9B7B1" text-anchor="middle" dominant-baseline="middle">StyleIn</text></svg>`,
  );

export default function ProductCard({
  product,
  wished,
  onToggleWish,
  onQuickView,
  onQuickAdd,
}: Props) {
  const [hover, setHover] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  const images =
    product.images && product.images.length
      ? product.images.map((i) => i.image_url)
      : [PLACEHOLDER];

  const primaryIdx = Math.max(
    0,
    product.images?.findIndex((i) => i.is_primary) ?? 0,
  );
  const front = images[primaryIdx] ?? images[0];
  const back = images.find((_, idx) => idx !== primaryIdx) ?? front;

  const pct = discountPercent(product.actual_price, product.discounted_price);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const sizes = product.sizes_available ?? [];

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Image area */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F1F0EC]">
        {/* Desktop crossfade between two angles */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute inset-0 h-full w-full"
          aria-label={`Quick view ${product.name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={front}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{ opacity: hover ? 0 : 1 }}
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={back}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{ opacity: hover ? 1 : 0 }}
            loading="lazy"
          />
          {/* Mobile swipe shows the active dot image */}
          {images.length > 1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[activeDot]}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover md:hidden"
            />
          )}
        </button>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-2">
          {pct > 0 && !outOfStock && (
            <span className="bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              -{pct}% OFF
            </span>
          )}
          {!!product.is_featured && !outOfStock && (
            <span className="bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
          {lowStock && (
            <span className="relative flex items-center gap-1.5 bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-sonar rounded-full bg-brand" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Only {product.stock} Left
            </span>
          )}
          {outOfStock && (
            <span className="bg-ink/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => onToggleWish(product.id)}
          aria-label="Toggle wishlist"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:text-brand"
        >
          {wished ? (
            <IconHeartFill className="h-[18px] w-[18px] text-brand" />
          ) : (
            <IconHeart className="h-[18px] w-[18px]" />
          )}
        </button>

        {/* Mobile photo indicator dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveDot(i)}
                aria-label={`View photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeDot ? 'w-5 bg-ink' : 'w-1.5 bg-ink/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Desktop hover quick-size cascade tray */}
        {!outOfStock && (
          <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-white/95 p-3 backdrop-blur transition-transform duration-300 group-hover:translate-y-0 md:block">
            {sizes.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onQuickAdd(product, s)}
                    className="min-w-9 border border-hairline px-2 py-1.5 text-xs font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onQuickAdd(product, null)}
                className="btn-dark w-full py-2.5 text-xs"
              >
                <IconPlus className="h-4 w-4" /> Add to Cart
              </button>
            )}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-col gap-1">
        {product.category_name && (
          <span className="eyebrow">{product.category_name}</span>
        )}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="text-left text-sm font-semibold leading-snug text-ink hover:text-brand"
        >
          {product.name}
        </button>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-bold ${
              pct > 0 ? 'text-brand' : 'text-ink'
            }`}
          >
            {formatPKR(product.discounted_price)}
          </span>
          {pct > 0 && (
            <span className="text-xs text-muted line-through">
              {formatPKR(product.actual_price)}
            </span>
          )}
        </div>

        {/* Mobile tap-to-add */}
        {!outOfStock && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="btn-outline mt-2 w-full py-2 text-xs md:hidden"
          >
            {sizes.length > 0 ? 'Select Size' : 'Add to Cart'}
          </button>
        )}
        {outOfStock && (
          <button
            type="button"
            disabled
            className="btn mt-2 w-full border border-hairline py-2 text-xs text-muted md:hidden"
          >
            Sold Out
          </button>
        )}
      </div>
    </div>
  );
}
