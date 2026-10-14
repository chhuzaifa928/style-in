import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '@/lib/auth';
import { pool, execute } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

interface ImageRow {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: number;
}

async function getImage(imageId: number): Promise<ImageRow | null> {
  const res = await pool.execute(
    'SELECT id, product_id, image_url, is_primary FROM product_images WHERE id = ? LIMIT 1',
    [imageId],
  );
  return (res[0] as ImageRow[])[0] ?? null;
}

/** PATCH /api/images/:id — designate as primary cover shot. */
export async function PATCH(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const imageId = Number(id);
    const img = await getImage(imageId);
    if (!img) return fail('Image not found', 404);

    const body = await req.json().catch(() => ({}));
    if (body?.is_primary) {
      await execute(
        'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
        [img.product_id],
      );
      await execute('UPDATE product_images SET is_primary = 1 WHERE id = ?', [
        imageId,
      ]);
    }
    return ok({ id: imageId, is_primary: 1 });
  });
}

/**
 * DELETE /api/images/:id — remove an image from DB and, if it is a locally
 * uploaded file, delete it from disk too. Re-assigns primary if needed.
 */
export async function DELETE(req: Request, ctx: Ctx) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const { id } = await ctx.params;
    const imageId = Number(id);
    const img = await getImage(imageId);
    if (!img) return fail('Image not found', 404);

    await execute('DELETE FROM product_images WHERE id = ?', [imageId]);

    // Clean up local file on disk (only for /uploads/* paths; never external).
    if (img.image_url.startsWith('/uploads/')) {
      const base = path.join(process.cwd(), 'public', 'uploads');
      const filename = path.basename(img.image_url); // strips any traversal
      const filePath = path.join(base, filename);
      if (filePath.startsWith(base + path.sep)) {
        await unlink(filePath).catch(() => {
          /* file may already be gone */
        });
      }
    }

    // If we removed the primary, promote the next image.
    if (img.is_primary) {
      const res = await pool.execute(
        'SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1',
        [img.product_id],
      );
      const next = (res[0] as { id: number }[])[0];
      if (next) {
        await execute('UPDATE product_images SET is_primary = 1 WHERE id = ?', [
          next.id,
        ]);
      }
    }

    return ok({ deleted: true });
  });
}
