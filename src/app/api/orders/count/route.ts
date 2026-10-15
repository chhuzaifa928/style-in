import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { ok, guarded } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/orders/count — admin: lightweight counts for the new-order badge. */
export async function GET() {
  return guarded(async () => {
    await requireAdmin();
    const rows = await query<{ order_status: string; c: number }>(
      'SELECT order_status, COUNT(*) AS c FROM orders GROUP BY order_status',
    );
    let pending = 0;
    let total = 0;
    for (const r of rows) {
      total += Number(r.c);
      if (r.order_status === 'Pending') pending += Number(r.c);
    }
    return ok({ pending, total });
  });
}
