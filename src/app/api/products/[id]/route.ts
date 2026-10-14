import { requireAdmin } from '@/lib/auth';
import { execute } from '@/lib/db';
import { getProductById } from '@/lib/data';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import {
  cleanText,
  cleanMultiline,
  cleanSizes,
  toMoney,
  toInt,
} from '@/lib/sanitize';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/products/:id — public (active only). */
export async function GET(_req: Request, ctx: Ctx) {
  return guarded(async () => {
    const { id } = await ctx.params;
    const product = await getProductById(Number(id), false);
    if (!product) return fail('Not found', 404);
    return ok(product);
  });
}

/** PUT /api/products/:id — admin update core fields. */
export async function PUT(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return fail('Invalid id', 400);
    }

    const existing = await getProductById(productId, true);
    if (!existing) return fail('Not found', 404);

    const body = await req.json().catch(() => null);
    if (!body) return fail('Invalid body', 400);

    const name = cleanText(body.name ?? existing.name, 200);
    if (!name) return fail('Product name is required', 400);
    const description = cleanMultiline(
      body.description ?? existing.description ?? '',
      5000,
    );
    const actualPrice = toMoney(body.actual_price ?? existing.actual_price);
    const discountedPrice = toMoney(
      body.discounted_price ?? existing.discounted_price,
    );
    const sizes = cleanSizes(body.sizes_available ?? existing.sizes_available);
    const stock = toInt(body.stock ?? existing.stock, 0);
    const isFeatured = body.is_featured ? 1 : 0;
    const isActive = body.is_active === false ? 0 : 1;
    const categoryId =
      body.category_id != null && body.category_id !== ''
        ? toInt(body.category_id, 1)
        : null;

    if (discountedPrice <= 0) return fail('Selling price must be > 0', 400);
    if (actualPrice > 0 && discountedPrice > actualPrice) {
      return fail('Selling price cannot exceed the compare-at price', 400);
    }

    await execute(
      `UPDATE products SET
         category_id = ?, name = ?, description = ?, actual_price = ?,
         discounted_price = ?, sizes_available = ?, stock = ?,
         is_featured = ?, is_active = ?
       WHERE id = ?`,
      [
        categoryId,
        name,
        description,
        actualPrice,
        discountedPrice,
        JSON.stringify(sizes),
        stock,
        isFeatured,
        isActive,
        productId,
      ],
    );

    const updated = await getProductById(productId, true);
    return ok(updated);
  });
}

/**
 * DELETE /api/products/:id — archive by default (is_active = 0).
 * Pass ?hard=1 to permanently delete (cascades images).
 */
export async function DELETE(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return fail('Invalid id', 400);
    }

    const url = new URL(req.url);
    if (url.searchParams.get('hard') === '1') {
      await execute('DELETE FROM products WHERE id = ?', [productId]);
      return ok({ deleted: true });
    }

    await execute('UPDATE products SET is_active = 0 WHERE id = ?', [productId]);
    return ok({ archived: true });
  });
}
