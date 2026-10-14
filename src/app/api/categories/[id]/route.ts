import { requireAdmin } from '@/lib/auth';
import { pool, execute } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { cleanText, cleanUrl, toInt } from '@/lib/sanitize';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/categories/:id — rename / toggle active / reparent. */
export async function PATCH(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const catId = Number(id);
    if (!Number.isInteger(catId) || catId <= 0) return fail('Invalid id', 400);

    const res = await pool.execute(
      'SELECT id, name, image_url, is_active, sort_order FROM categories WHERE id = ? LIMIT 1',
      [catId],
    );
    const existing = (res[0] as Record<string, unknown>[])[0];
    if (!existing) return fail('Not found', 404);

    const body = await req.json().catch(() => ({}));
    const name = cleanText(body?.name ?? existing.name, 120) || String(existing.name);
    const imageUrl =
      body?.image_url !== undefined
        ? cleanUrl(body.image_url, 500) || null
        : (existing.image_url as string | null);
    const isActive = body?.is_active === false ? 0 : body?.is_active === true ? 1 : existing.is_active;
    const sortOrder =
      body?.sort_order !== undefined
        ? toInt(body.sort_order, 0)
        : (existing.sort_order as number);

    await execute(
      'UPDATE categories SET name = ?, image_url = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, imageUrl, isActive, sortOrder, catId],
    );
    return ok({ id: catId });
  });
}

/**
 * DELETE /api/categories/:id — remove a category. Products in it have their
 * category_id set to NULL via the FK (ON DELETE SET NULL), so nothing is lost.
 */
export async function DELETE(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const catId = Number(id);
    if (!Number.isInteger(catId) || catId <= 0) return fail('Invalid id', 400);

    await execute('DELETE FROM categories WHERE id = ?', [catId]);
    return ok({ deleted: true });
  });
}
