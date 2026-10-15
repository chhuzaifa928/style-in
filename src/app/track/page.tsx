'use client';

import { useState } from 'react';
import { formatPKR } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

interface TrackResult {
  order_number: string;
  customer_first_name: string;
  city: string;
  order_status: OrderStatus;
  created_at: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  items: { name: string; size: string | null; qty: number; line_total: number }[];
}

const STEPS: OrderStatus[] = ['Pending', 'Confirmed', 'Dispatched', 'Delivered'];

const STEP_COPY: Record<string, string> = {
  Pending: 'Order received — awaiting confirmation',
  Confirmed: 'Confirmed — being prepared',
  Dispatched: 'On its way to you',
  Delivered: 'Delivered',
};

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber.trim(), phone }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not find your order.');
        return;
      }
      setResult(json.data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelled = result?.order_status === 'Cancelled';
  const currentIdx = result ? STEPS.indexOf(result.order_status) : -1;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="border-b border-hairline">
        <div className="container-page flex items-center justify-between py-4">
          <a href="/" className="heading text-2xl">
            StyleIn<span className="text-brand">.</span>
          </a>
          <a href="/" className="text-sm font-semibold text-muted hover:text-brand">
            ← Back to store
          </a>
        </div>
      </header>

      <main className="container-page mx-auto max-w-2xl py-10">
        <h1 className="heading text-3xl">Track Your Order</h1>
        <p className="mt-2 text-sm text-muted">
          Enter the order number from your confirmation and the phone number you
          ordered with.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4 border border-hairline bg-surface p-6 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="label" htmlFor="ord">Order Number</label>
            <input id="ord" className="input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. SI-ABC123-4567" />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="ph">Phone Number</label>
            <input id="ph" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0300 1234567" inputMode="tel" />
          </div>
          <button type="submit" disabled={loading} className="btn-dark whitespace-nowrap">
            {loading ? 'Checking…' : 'Track Order'}
          </button>
        </form>

        {error && (
          <p className="mt-4 bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8 border border-hairline bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4">
              <div>
                <p className="eyebrow">Order</p>
                <p className="heading text-lg">{result.order_number}</p>
              </div>
              <div className="text-right">
                <p className="eyebrow">Placed</p>
                <p className="text-sm text-muted">
                  {result.created_at ? new Date(result.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            {/* Status */}
            {cancelled ? (
              <div className="mt-6 bg-brand/10 px-4 py-6 text-center">
                <p className="heading text-xl text-brand">Order Cancelled</p>
                <p className="mt-1 text-sm text-muted">
                  This order was cancelled. Contact us if you think this is a mistake.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                {/* Stepper */}
                <ol className="relative flex justify-between">
                  {/* connecting line */}
                  <div className="absolute left-0 right-0 top-4 -z-0 mx-6 h-0.5 bg-hairline">
                    <div
                      className="h-full bg-brand transition-all duration-500"
                      style={{
                        width:
                          currentIdx <= 0
                            ? '0%'
                            : `${(currentIdx / (STEPS.length - 1)) * 100}%`,
                      }}
                    />
                  </div>
                  {STEPS.map((step, i) => {
                    const done = i <= currentIdx;
                    const active = i === currentIdx;
                    return (
                      <li key={step} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold transition ${
                            done
                              ? 'border-brand bg-brand text-white'
                              : 'border-hairline bg-surface text-muted'
                          } ${active ? 'ring-4 ring-brand/20' : ''}`}
                        >
                          {done ? '✓' : i + 1}
                        </span>
                        <span className={`text-center text-[11px] font-semibold uppercase tracking-wide ${done ? 'text-ink' : 'text-muted'}`}>
                          {step}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <p className="mt-6 text-center text-sm font-semibold text-ink">
                  {STEP_COPY[result.order_status] ?? result.order_status}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="mt-8 border-t border-hairline pt-4">
              <h3 className="eyebrow mb-2">Items</h3>
              <ul className="divide-y divide-hairline">
                {result.items.map((it, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm">
                    <span>
                      {it.name}
                      {it.size ? ` · ${it.size}` : ''} × {it.qty}
                    </span>
                    <span className="font-semibold">{formatPKR(it.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-hairline pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span><span>{formatPKR(result.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery</span>
                  <span>{result.shipping_fee === 0 ? 'FREE' : formatPKR(result.shipping_fee)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total (Cash on Delivery)</span>
                  <span className="text-brand">{formatPKR(result.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
