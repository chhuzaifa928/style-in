import { query } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import type { OrderItem, OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';

interface Row {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  items_json: unknown;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  order_status: OrderStatus;
  created_at: string;
}

/**
 * POST /api/orders/track  (public)
 * Body: { order_number, phone }
 * Returns the order's status + summary, but ONLY when the phone matches the
 * one on the order (last 10 digits), so an order number alone can't be used
 * to enumerate other people's orders. Rate-limited; generic not-found message.
 */
export async function POST(req: Request) {
  return guarded(async () => {
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const ip = clientIp(req);
    const rl = rateLimit(`track:${ip}`, 30, 10 * 60 * 1000);
    if (!rl.allowed) return fail('Too many lookups. Please try again later.', 429);

    const body = await req.json().catch(() => null);
    const orderNumber = String(body?.order_number ?? '').trim().slice(0, 40);
    const phoneDigits = String(body?.phone ?? '').replace(/\D/g, '');

    if (!orderNumber || phoneDigits.length < 6) {
      return fail('Enter your order number and phone number.', 400);
    }

    const rows = await query<Row>(
      `SELECT order_number, customer_name, customer_phone, city, items_json,
              subtotal, shipping_fee, total_amount, order_status, created_at
         FROM orders WHERE order_number = ? LIMIT 1`,
      [orderNumber],
    );
    const order = rows[0];

    const NOT_FOUND = 'No order found matching those details.';
    if (!order) return fail(NOT_FOUND, 404);

    const custLast10 = order.customer_phone.replace(/\D/g, '').slice(-10);
    if (custLast10 !== phoneDigits.slice(-10)) {
      return fail(NOT_FOUND, 404);
    }

    let items: OrderItem[] = [];
    try {
      items =
        typeof order.items_json === 'string'
          ? JSON.parse(order.items_json)
          : (order.items_json as OrderItem[]);
    } catch {
      items = [];
    }

    // First name only, and no phone, returned to the client.
    const firstName = order.customer_name.split(/\s+/)[0] ?? '';

    return ok({
      order_number: order.order_number,
      customer_first_name: firstName,
      city: order.city,
      order_status: order.order_status,
      created_at: order.created_at,
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee,
      total_amount: order.total_amount,
      items: items.map((i) => ({
        name: i.name,
        size: i.size,
        qty: i.qty,
        line_total: i.line_total,
      })),
    });
  });
}
