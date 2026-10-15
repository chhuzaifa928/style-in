import { requireAdmin } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { getOrders, getSettings } from '@/lib/data';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { cleanText, cleanPhone, cleanMultiline, toInt } from '@/lib/sanitize';
import type { OrderItem } from '@/lib/types';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export const runtime = 'nodejs';

/** GET /api/orders — admin only: full orders queue. */
export async function GET() {
  return guarded(async () => {
    await requireAdmin();
    return ok(await getOrders());
  });
}

interface CartLine {
  product_id: number;
  size: string | null;
  qty: number;
}

/**
 * POST /api/orders — public Cash-on-Delivery checkout.
 *
 * Security / integrity:
 *  - Origin-checked (CSRF) + rate-limited.
 *  - All prices are re-read from the DB server-side (client-sent prices are
 *    ignored) to prevent price tampering.
 *  - Runs in a transaction with SELECT ... FOR UPDATE row locks, verifies
 *    stock, decrements it, and inserts the order atomically.
 */
export async function POST(req: Request) {
  return guarded(async () => {
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const ip = clientIp(req);
    const rl = rateLimit(`order:${ip}`, 12, 10 * 60 * 1000);
    if (!rl.allowed) return fail('Too many orders, slow down.', 429);

    const body = await req.json().catch(() => null);
    if (!body) return fail('Invalid body', 400);

    // Honeypot: a hidden field real users never fill. Bots often do.
    if (String(body.company ?? '').trim() !== '') {
      return fail('Your order could not be placed.', 400);
    }

    const customerName = cleanText(body.customer_name, 190);
    const customerPhone = cleanPhone(body.customer_phone);
    const shippingAddress = cleanMultiline(body.shipping_address, 600);
    const city = cleanText(body.city, 120);

    if (!customerName) return fail('Name is required', 400);
    if (customerPhone.replace(/\D/g, '').length < 10) {
      return fail('A valid phone number is required', 400);
    }
    if (shippingAddress.length < 8) {
      return fail('A complete shipping address is required', 400);
    }
    if (!city) return fail('City is required', 400);

    const rawItems: unknown = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return fail('Your cart is empty', 400);
    }
    if (rawItems.length > 50) return fail('Too many line items', 400);

    // Normalize & merge client cart lines.
    const lines: CartLine[] = [];
    for (const it of rawItems as Record<string, unknown>[]) {
      const pid = toInt(it.product_id, 1);
      const qty = toInt(it.qty, 1);
      const size =
        it.size != null && String(it.size).trim() !== ''
          ? String(it.size).trim().slice(0, 12)
          : null;
      if (pid > 0 && qty > 0) lines.push({ product_id: pid, size, qty });
    }
    if (lines.length === 0) return fail('Your cart is empty', 400);

    const settings = await getSettings();

    const result = await withTransaction(async (conn) => {
      const items: OrderItem[] = [];
      let subtotal = 0;

      for (const line of lines) {
        // Lock the product row for the duration of the transaction.
        const [rows] = await conn.execute<RowDataPacket[]>(
          'SELECT id, name, discounted_price, stock, is_active, sizes_available FROM products WHERE id = ? FOR UPDATE',
          [line.product_id],
        );
        const product = rows[0];
        if (!product || !product.is_active) {
          throw Object.assign(
            new Error(`A product in your cart is no longer available.`),
            { status: 409 },
          );
        }

        // Validate the chosen size against the product's real size list.
        let sizes: string[] = [];
        try {
          sizes =
            typeof product.sizes_available === 'string'
              ? JSON.parse(product.sizes_available)
              : (product.sizes_available ?? []);
        } catch {
          sizes = [];
        }
        if (Array.isArray(sizes) && sizes.length > 0) {
          if (!line.size || !sizes.includes(line.size)) {
            throw Object.assign(
              new Error(`Please select a valid size for "${product.name}".`),
              { status: 400 },
            );
          }
        } else {
          line.size = null; // product has no sizes — ignore any sent value
        }
        if (product.stock < line.qty) {
          throw Object.assign(
            new Error(
              `"${product.name}" only has ${product.stock} left in stock.`,
            ),
            { status: 409 },
          );
        }

        const unitPrice = Number(product.discounted_price);
        const lineTotal = Math.round(unitPrice * line.qty * 100) / 100;
        subtotal += lineTotal;

        items.push({
          product_id: product.id,
          name: product.name,
          size: line.size,
          qty: line.qty,
          unit_price: unitPrice,
          line_total: lineTotal,
        });

        // Decrement stock.
        await conn.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [line.qty, product.id],
        );
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const shippingFee =
        subtotal >= Number(settings.free_delivery_threshold)
          ? 0
          : Number(settings.shipping_fee);
      const total = Math.round((subtotal + shippingFee) * 100) / 100;

      // Human-friendly, collision-resistant order number.
      const orderNumber = `SI-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        Math.random() * 9000 + 1000,
      )}`;

      const [ins] = await conn.execute<ResultSetHeader>(
        `INSERT INTO orders
           (order_number, customer_name, customer_phone, shipping_address, city,
            items_json, subtotal, shipping_fee, total_amount, payment_method, order_status)
         VALUES (?,?,?,?,?,?,?,?,?, 'COD', 'Pending')`,
        [
          orderNumber,
          customerName,
          customerPhone,
          shippingAddress,
          city,
          JSON.stringify(items),
          subtotal,
          shippingFee,
          total,
        ],
      );

      return {
        id: ins.insertId,
        order_number: orderNumber,
        subtotal,
        shipping_fee: shippingFee,
        total_amount: total,
      };
    });

    return ok(result, { status: 201 });
  });
}
