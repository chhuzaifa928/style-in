'use client';

import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import { ORDER_STATUSES } from '@/lib/types';
import { formatPKR } from '@/lib/format';
import { apiGet, apiSend } from './api';
import { IconChevron, IconWhatsApp } from '../icons';

interface Props {
  onToast: (msg: string) => void;
}

/** Normalize a (mostly Pakistani) phone number to wa.me international digits. */
function toWaDigits(phone: string): string {
  let d = (phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '92' + d.slice(1); // local 03xx -> 9203xx
  else if (d.length === 10 && d.startsWith('3')) d = '92' + d; // 3xx... -> 92...
  return d;
}

/** Build a wa.me link with a prefilled confirmation message incl. tracking ID. */
function buildWaLink(order: Order): string {
  const digits = toWaDigits(order.customer_phone);
  const firstName = (order.customer_name || '').split(/\s+/)[0] || '';
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const lines = [
    `Assalam-o-Alaikum ${firstName}!`,
    `Thank you for shopping at StyleIn.`,
    ``,
    `Your order is ${order.order_status}.`,
    `Tracking ID: ${order.order_number}`,
    `Total (Cash on Delivery): ${formatPKR(order.total_amount)}`,
    ``,
    `Track your order anytime here:`,
    `${origin}/track`,
    ``,
    `— StyleIn`,
  ];
  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Dispatched: 'bg-indigo-100 text-indigo-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-brand/10 text-brand',
};

export default function OrdersPanel({ onToast }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All');

  const load = async () => {
    setLoading(true);
    const res = await apiGet<Order[]>('/api/orders');
    if (res.ok && res.data) setOrders(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    const res = await apiSend('/api/orders/' + order.id, 'PATCH', {
      order_status: status,
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, order_status: status } : o)),
      );
      onToast(`Order ${order.order_number} → ${status}`);
    } else {
      onToast(res.error || 'Could not update status');
    }
  };

  const visible =
    filter === 'All' ? orders : orders.filter((o) => o.order_status === filter);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="heading text-xl">Orders Queue</h2>
          <p className="text-sm text-muted">{orders.length} total orders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['All', ...ORDER_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`border px-3 py-1.5 text-xs font-semibold ${
                filter === s
                  ? 'border-ink bg-ink text-white'
                  : 'border-hairline text-muted hover:border-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No orders here yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((o) => (
            <div key={o.id} className="border border-hairline bg-surface">
              <button
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-bold">{o.order_number}</span>
                  <span className="text-sm text-muted">{o.customer_name}</span>
                  <span className="text-sm text-muted">{o.city}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[o.order_status]}`}
                  >
                    {o.order_status}
                  </span>
                </div>
                <span className="font-bold">{formatPKR(o.total_amount)}</span>
                <IconChevron
                  className={`h-4 w-4 text-muted transition-transform ${expanded === o.id ? 'rotate-90' : ''}`}
                />
              </button>

              {expanded === o.id && (
                <div className="border-t border-hairline px-4 py-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="eyebrow mb-2">Customer</h4>
                      <p className="text-sm">{o.customer_name}</p>
                      <p className="text-sm text-muted">{o.customer_phone}</p>
                      <p className="mt-1 text-sm text-muted">
                        {o.shipping_address}, {o.city}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Placed: {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div>
                      <h4 className="eyebrow mb-2">Items</h4>
                      <ul className="divide-y divide-hairline">
                        {o.items_json.map((it, i) => (
                          <li key={i} className="flex justify-between py-1.5 text-sm">
                            <span>
                              {it.name}
                              {it.size ? ` · ${it.size}` : ''} × {it.qty}
                            </span>
                            <span className="font-semibold">{formatPKR(it.line_total)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 space-y-1 border-t border-hairline pt-2 text-sm">
                        <div className="flex justify-between text-muted">
                          <span>Subtotal</span>
                          <span>{formatPKR(o.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>Shipping</span>
                          <span>{o.shipping_fee === 0 ? 'FREE' : formatPKR(o.shipping_fee)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-brand">{formatPKR(o.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                    <span className="label mb-0">Update status:</span>
                    {ORDER_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(o, s)}
                        disabled={o.order_status === s}
                        className={`border px-3 py-1.5 text-xs font-semibold transition ${
                          o.order_status === s
                            ? 'border-ink bg-ink text-white'
                            : 'border-hairline text-muted hover:border-ink hover:text-ink'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Send WhatsApp confirmation to the customer (1-click) */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
                    <a
                      href={buildWaLink(o)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                    >
                      <IconWhatsApp className="h-4 w-4" />
                      Send WhatsApp confirmation
                    </a>
                    <span className="text-[11px] text-muted">
                      Opens WhatsApp with the order status + tracking ID pre-typed to {o.customer_phone}.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
