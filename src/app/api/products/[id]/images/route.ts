import { requireAdmin } from '@/lib/auth';
import { pool, execute } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { cleanUrl } from '@/lib/sanitize';
import type { ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/products/:id/images  (admin)
 * Body: { image_url, is_primary? }
 * Adds an image (uploaded path or external URL) to a product.
 */
export async function POST(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return fail('Invalid id', 400);
    }

    // Ensure the product exists.
    const prod = await pool.execute('SELECT id FROM products WHERE id = ? LIMIT 1', [
      productId,
    ]);
    if ((prod[0] as unknown[]).length === 0) return fail('Product not found', 404);

    const body = await req.json().catch(() => null);
    const imageUrl = cleanUrl(body?.image_url, 500);
    if (!imageUrl) return fail('A valid image_url is required', 400);

    const countRes = await pool.execute(
      'SELECT COUNT(*) AS c FROM product_images WHERE product_id = ?',
      [productId],
    );
    const count = (countRes[0] as { c: number }[])[0].c;
    const makePrimary = body?.is_primary ? 1 : count === 0 ? 1 : 0;

    if (makePrimary) {
      await execute(
        'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
        [productId],
      );
    }

    const result = (await execute(
      `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
       VALUES (?,?,?,?)`,
      [productId, imageUrl, makePrimary, count],
    )) as ResultSetHeader;

    return ok(
      {
        id: result.insertId,
        product_id: productId,
        image_url: imageUrl,
        is_primary: makePrimary,
        sort_order: count,
      },
      { status: 201 },
    );
  });
}
