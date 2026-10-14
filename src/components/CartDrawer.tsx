'use client';

import { useEffect } from 'react';
import type { SiteSettings } from '@/lib/types';
import type { CartItem } from './useCart';
import { formatPKR } from '@/lib/format';
import { IconClose, IconMinus, IconPlus, IconTrash, IconTruck } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  settings: SiteSettings;
  onSetQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  open,
  onClose,
  items,
  subtotal,
  settings,
  onSetQty,
  onRemove,
  onCheckout,
}: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const threshold = Number(settings.free_delivery_threshold) || 0;
  const remaining = Math.max(0, threshold - subtotal);
  const pctToFree =
    threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;
  const unlocked = threshold > 0 && subtotal >= threshold;
  const shippingFee = unlocked ? 0 : Number(settings.shipping_fee) || 0;

  return (
    <div
      className={`fixed inset-0 z-[80] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-canvas shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="heading text-lg">
            Your Bag{' '}
            <span className="text-muted">
              ({items.reduce((n, i) => n + i.qty, 0)})
            </span>
          </h2>
          <button onClick={onClose} aria-label="Close cart" className="text-ink hover:text-brand">
            <IconClose />
          </button>
        </div>

        {/* Free shipping progress */}
        {threshold > 0 && (
          <div className="border-b border-hairline bg-surface px-5 py-4">
            {unlocked ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-brand">
                <IconTruck className="h-5 w-5" />
                You&apos;ve unlocked FREE delivery! 🎉
              </p>
            ) : (
              <p className="text-sm text-muted">
                Add{' '}
                <span className="font-bold text-ink">{formatPKR(remaining)}</span>{' '}
                more for <span className="font-semibold text-brand">FREE delivery</span>
              </p>
            )}
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  unlocked ? 'bg-brand' : 'bg-ink'
                }`}
                style={{ width: `${pctToFree}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="heading text-xl">Your bag is empty</p>
              <p className="text-sm text-muted">
                Add a few pieces to get started.
              </p>
              <button onClick={onClose} className="btn-outline mt-2">
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3">
                  <div className="h-24 w-20 flex-shrink-0 overflow-hidden bg-[#F1F0EC]">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug text-ink">
                        {item.name}
                      </p>
                      <button
                        onClick={() => onRemove(item.key)}
                        aria-label="Remove"
                        className="text-muted hover:text-brand"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                    {item.size && (
                      <span className="mt-0.5 text-xs text-muted">
                        Size: {item.size}
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-hairline">
                        <button
                          onClick={() => onSetQty(item.key, item.qty - 1)}
                          className="grid h-8 w-8 place-items-center hover:bg-canvas"
                          aria-label="Decrease"
                        >
                          <IconMinus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onSetQty(item.key, item.qty + 1)}
                          disabled={item.qty >= item.max_stock}
                          className="grid h-8 w-8 place-items-center hover:bg-canvas disabled:opacity-30"
                          aria-label="Increase"
                        >
                          <IconPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-ink">
                        {formatPKR(item.unit_price * item.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-hairline bg-surface px-5 py-4">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span className="font-semibold text-ink">{formatPKR(subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-muted">
              <span>Delivery</span>
              <span className="font-semibold text-ink">
                {shippingFee === 0 ? 'FREE' : formatPKR(shippingFee)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-hairline pt-2 text-base">
              <span className="heading">Total</span>
              <span className="heading text-brand">
                {formatPKR(subtotal + shippingFee)}
              </span>
            </div>
            <button onClick={onCheckout} className="btn-brand mt-4 w-full">
              Checkout · Cash on Delivery
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              Pay in cash when your order is delivered.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
