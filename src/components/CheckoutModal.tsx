'use client';

import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/lib/types';
import type { CartItem } from './useCart';
import { formatPKR } from '@/lib/format';
import { IconClose, IconCheck } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  settings: SiteSettings;
  onPlaced: (orderNumber: string) => void;
}

interface FormState {
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  company: string; // honeypot — must stay empty
}

const EMPTY: FormState = {
  customer_name: '',
  customer_phone: '',
  shipping_address: '',
  city: '',
  company: '',
};

export default function CheckoutModal({
  open,
  onClose,
  items,
  subtotal,
  settings,
  onPlaced,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
      setServerError('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const threshold = Number(settings.free_delivery_threshold) || 0;
  const shippingFee =
    threshold > 0 && subtotal >= threshold
      ? 0
      : Number(settings.shipping_fee) || 0;
  const total = subtotal + shippingFee;

  const update = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (form.customer_name.trim().length < 2) next.customer_name = 'Enter your full name';
    if (form.customer_phone.replace(/\D/g, '').length < 10)
      next.customer_phone = 'Enter a valid phone number';
    if (form.shipping_address.trim().length < 8)
      next.shipping_address = 'Enter your complete address';
    if (form.city.trim().length < 2) next.city = 'Enter your city';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({
            product_id: i.product_id,
            size: i.size,
            qty: i.qty,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setServerError(json.error || 'Could not place your order. Please try again.');
        return;
      }
      onPlaced(json.data.order_number);
    } catch {
      setServerError('Network error. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/50 animate-fade-in" />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden bg-surface shadow-2xl sm:animate-pop-in">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div>
            <h2 className="heading text-lg">Cash on Delivery</h2>
            <p className="text-xs text-muted">Fast 1-click checkout — no card needed</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink hover:text-brand">
            <IconClose />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4">
            {/* Honeypot — hidden from humans; bots that fill it are rejected */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
            <div>
              <label className="label" htmlFor="co-name">Full Name</label>
              <input
                id="co-name"
                className="input"
                value={form.customer_name}
                onChange={(e) => update('customer_name', e.target.value)}
                placeholder="e.g. Ayesha Khan"
                autoComplete="name"
              />
              {errors.customer_name && (
                <p className="mt-1 text-xs text-brand">{errors.customer_name}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="co-phone">Phone Number</label>
              <input
                id="co-phone"
                className="input"
                value={form.customer_phone}
                onChange={(e) => update('customer_phone', e.target.value)}
                placeholder="e.g. 0300 1234567"
                inputMode="tel"
                autoComplete="tel"
              />
              {errors.customer_phone && (
                <p className="mt-1 text-xs text-brand">{errors.customer_phone}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="co-address">Shipping Address</label>
              <textarea
                id="co-address"
                className="input min-h-[80px] resize-none"
                value={form.shipping_address}
                onChange={(e) => update('shipping_address', e.target.value)}
                placeholder="House / street / area"
                autoComplete="street-address"
              />
              {errors.shipping_address && (
                <p className="mt-1 text-xs text-brand">{errors.shipping_address}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="co-city">City</label>
              <input
                id="co-city"
                className="input"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="e.g. Lahore"
                autoComplete="address-level2"
              />
              {errors.city && <p className="mt-1 text-xs text-brand">{errors.city}</p>}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-5 border-t border-hairline pt-4">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal ({items.reduce((n, i) => n + i.qty, 0)} items)</span>
              <span className="font-semibold text-ink">{formatPKR(subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-muted">
              <span>Delivery</span>
              <span className="font-semibold text-ink">
                {shippingFee === 0 ? 'FREE' : formatPKR(shippingFee)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-hairline pt-2">
              <span className="text-base font-bold text-ink">Total to pay</span>
              <span className="price text-lg text-brand">{formatPKR(total)}</span>
            </div>
          </div>

          {serverError && (
            <p className="mt-4 bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
              {serverError}
            </p>
          )}
        </div>

        <div className="border-t border-hairline px-6 py-4">
          <button
            onClick={submit}
            disabled={submitting || items.length === 0}
            className="btn-brand w-full"
          >
            <IconCheck className="h-4 w-4" />
            {submitting ? 'Placing order…' : `Place Order · ${formatPKR(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
