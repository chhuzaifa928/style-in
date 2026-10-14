import { requireAdmin } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { toInt } from '@/lib/sanitize';

export const runtime = 'nodejs';

/**
 * POST /api/products/reorder  (admin)
 * Body: { ids: number[] }  — the product ids in the desired display order.
 * Assigns sort_order = position (0-based) to each, atomically.
 */
export async function POST(req: Request) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const body = await req.json().catch(() => null);
    const rawIds: unknown = body?.ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return fail('ids array is required', 400);
    }
    if (rawIds.length > 1000) return fail('Too many items', 400);

    const ids = rawIds.map((v) => toInt(v, 1)).filter((n) => n > 0);
    if (ids.length === 0) return fail('No valid ids', 400);

    await withTransaction(async (conn) => {
      for (let i = 0; i < ids.length; i++) {
        await conn.execute('UPDATE products SET sort_order = ? WHERE id = ?', [
          i,
          ids[i],
        ]);
      }
    });

    return ok({ reordered: ids.length });
  });
}
