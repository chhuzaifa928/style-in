import { requireAdmin } from '@/lib/auth';
import { execute } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { ORDER_STATUSES, OrderStatus } from '@/lib/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/orders/:id — admin: advance order status. */
export async function PATCH(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) return fail('Invalid id', 400);

    const body = await req.json().catch(() => null);
    const status = String(body?.order_status ?? '') as OrderStatus;
    if (!ORDER_STATUSES.includes(status)) {
      return fail('Invalid order status', 400);
    }

    const res = await execute(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [status, orderId],
    );
    if (res.affectedRows === 0) return fail('Order not found', 404);

    return ok({ id: orderId, order_status: status });
  });
}
