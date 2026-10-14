import { requireAdmin } from '@/lib/auth';
import { pool, execute } from '@/lib/db';
import { getProducts } from '@/lib/data';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import {
  cleanText,
  cleanMultiline,
  cleanUrl,
  cleanSizes,
  slugify,
  toMoney,
  toInt,
} from '@/lib/sanitize';
import type { ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

/** GET /api/products — public listing with optional filters. */
export async function GET(req: Request) {
  return guarded(async () => {
    const url = new URL(req.url);
    const categoryParam = url.searchParams.get('category');
    const products = await getProducts({
      categoryId: categoryParam ? Number(categoryParam) : null,
      search: url.searchParams.get('q') || undefined,
      featuredOnly: url.searchParams.get('featured') === '1',
      sort: (url.searchParams.get('sort') as
        | 'newest'
        | 'price_asc'
        | 'price_desc'
        | 'name_asc'
        | null) || 'newest',
      includeInactive: false,
    });
    return ok(products);
  });
}

/** POST /api/products — admin create (with optional image list). */
export async function POST(req: Request) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const body = await req.json().catch(() => null);
    if (!body) return fail('Invalid body', 400);

    const name = cleanText(body.name, 200);
    if (!name) return fail('Product name is required', 400);

    const description = cleanMultiline(body.description, 5000);
    const actualPrice = toMoney(body.actual_price);
    const discountedPrice = toMoney(body.discounted_price);
    const sizes = cleanSizes(body.sizes_available);
    const stock = toInt(body.stock, 0);
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

    // Build a unique slug.
    const base = slugify(name) || `product-${Date.now()}`;
    let slug = base;
    let n = 1;
    // Loop is bounded; relies on unique index for final safety.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await pool.execute(
        'SELECT id FROM products WHERE slug = ? LIMIT 1',
        [slug],
      );
      if ((existing[0] as unknown[]).length === 0) break;
      slug = `${base}-${++n}`;
      if (n > 50) {
        slug = `${base}-${Date.now()}`;
        break;
      }
    }

    const result = (await execute(
      `INSERT INTO products
         (category_id, name, slug, description, actual_price, discounted_price,
          sizes_available, stock, is_featured, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        categoryId,
        name,
        slug,
        description,
        actualPrice,
        discountedPrice,
        JSON.stringify(sizes),
        stock,
        isFeatured,
        isActive,
      ],
    )) as ResultSetHeader;

    const productId = result.insertId;

    // Attach images if provided: [{ image_url, is_primary?, sort_order? }]
    if (Array.isArray(body.images) && body.images.length) {
      const images = body.images.slice(0, 20);
      let primaryAssigned = false;
      for (let i = 0; i < images.length; i++) {
        const imgUrl = cleanUrl(images[i]?.image_url, 500);
        if (!imgUrl) continue;
        let isPrimary = images[i]?.is_primary ? 1 : 0;
        if (isPrimary) primaryAssigned = true;
        if (!primaryAssigned && i === images.length - 1) isPrimary = 1;
        await execute(
          `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
           VALUES (?,?,?,?)`,
          [productId, imgUrl, isPrimary, i],
        );
      }
      // Guarantee exactly one primary.
      await normalizePrimary(productId);
    }

    return ok({ id: productId, slug }, { status: 201 });
  });
}

/** Ensure a product has exactly one primary image (the first if none set). */
async function normalizePrimary(productId: number): Promise<void> {
  const rows = await pool.execute(
    'SELECT id, is_primary FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId],
  );
  const imgs = rows[0] as { id: number; is_primary: number }[];
  if (imgs.length === 0) return;
  const hasPrimary = imgs.some((i) => i.is_primary);
  const primaryId = hasPrimary
    ? imgs.find((i) => i.is_primary)!.id
    : imgs[0].id;
  await execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [
    productId,
  ]);
  await execute('UPDATE product_images SET is_primary = 1 WHERE id = ?', [
    primaryId,
  ]);
}
