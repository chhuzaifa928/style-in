'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { formatPKR, discountPercent } from '@/lib/format';
import { IconClose, IconMinus, IconPlus, IconBag } from './icons';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAdd: (p: Product, size: string | null, qty: number) => void;
}

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="100%" height="100%" fill="#F1F0EC"/></svg>`,
  );

export default function QuickView({ product, onClose, onAdd }: Props) {
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');

  useEffect(() => {
    setActive(0);
    setSize(null);
    setQty(1);
    setErr('');
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (product) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [product, onClose]);

  if (!product) return null;

  const images =
    product.images && product.images.length
      ? product.images.map((i) => i.image_url)
      : [PLACEHOLDER];
  const pct = discountPercent(product.actual_price, product.discounted_price);
  const sizes = product.sizes_available ?? [];
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleAdd = () => {
    if (sizes.length > 0 && !size) {
      setErr('Please select a size.');
      return;
    }
    onAdd(product, size, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 animate-fade-in"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl animate-slide-up flex-col overflow-hidden bg-surface shadow-2xl sm:animate-pop-in sm:max-h-[88vh] sm:flex-row">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow hover:text-brand"
        >
          <IconClose />
        </button>

        {/* Gallery */}
        <div className="flex w-full flex-col gap-3 bg-[#F1F0EC] p-4 sm:w-1/2">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {pct > 0 && (
              <span className="absolute left-3 top-3 bg-brand px-2.5 py-1 text-[11px] font-bold uppercase text-white">
                -{pct}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`relative h-16 w-14 flex-shrink-0 overflow-hidden border ${
                    i === active ? 'border-ink' : 'border-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex w-full flex-col gap-4 overflow-y-auto p-6 sm:w-1/2">
          {product.category_name && (
            <span className="eyebrow">{product.category_name}</span>
          )}
          <h2 className="heading text-2xl leading-tight">{product.name}</h2>

          <div className="flex items-baseline gap-3">
            <span
              className={`price text-xl ${pct > 0 ? 'text-brand' : 'text-ink'}`}
            >
              {formatPKR(product.discounted_price)}
            </span>
            {pct > 0 && (
              <span className="text-sm text-muted line-through tabular-nums">
                {formatPKR(product.actual_price)}
              </span>
            )}
          </div>

          {lowStock && (
            <p className="flex items-center gap-2 text-sm font-semibold text-brand">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-sonar rounded-full bg-brand" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Hurry — only {product.stock} left in stock
            </p>
          )}

          {product.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}

          {sizes.length > 0 && (
            <div>
              <span className="label">Select size</span>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setErr('');
                    }}
                    className={`min-w-11 border px-3 py-2 text-sm font-semibold transition ${
                      size === s
                        ? 'border-ink bg-ink text-white'
                        : 'border-hairline text-ink hover:border-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="flex items-center gap-4">
            <span className="label mb-0">Qty</span>
            <div className="flex items-center border border-hairline">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center hover:bg-canvas"
                aria-label="Decrease"
              >
                <IconMinus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                onClick={() =>
                  setQty((q) => Math.min(product.stock || 1, q + 1))
                }
                className="grid h-10 w-10 place-items-center hover:bg-canvas"
                aria-label="Increase"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {err && <p className="text-sm font-medium text-brand">{err}</p>}

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="btn-brand mt-1 w-full"
          >
            <IconBag className="h-4 w-4" />
            {outOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
