import { requireAdmin } from '@/lib/auth';
import { pool, execute } from '@/lib/db';
import { getCategories } from '@/lib/data';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { cleanText, cleanUrl, slugify, toInt } from '@/lib/sanitize';
import type { ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

/** GET /api/categories — public (active) or ?all=1 for admin. */
export async function GET(req: Request) {
  return guarded(async () => {
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === '1';
    if (all) await requireAdmin();
    const cats = await getCategories(!all);
    return ok(cats);
  });
}

/** POST /api/categories — admin create a new category node. */
export async function POST(req: Request) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const body = await req.json().catch(() => null);
    const name = cleanText(body?.name, 120);
    if (!name) return fail('Category name is required', 400);

    const imageUrl = cleanUrl(body?.image_url, 500) || null;
    const parentId =
      body?.parent_id != null && body?.parent_id !== ''
        ? toInt(body.parent_id, 1)
        : null;
    const sortOrder = toInt(body?.sort_order, 0);

    const base = slugify(name) || `category-${Date.now()}`;
    let slug = base;
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await pool.execute(
        'SELECT id FROM categories WHERE slug = ? LIMIT 1',
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
      `INSERT INTO categories (name, slug, parent_id, image_url, is_active, sort_order)
       VALUES (?,?,?,?,1,?)`,
      [name, slug, parentId, imageUrl, sortOrder],
    )) as ResultSetHeader;

    return ok({ id: result.insertId, name, slug }, { status: 201 });
  });
}
