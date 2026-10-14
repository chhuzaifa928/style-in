import { getCurrentAdmin, verifyPassword, hashPassword } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * POST /api/admin/password — change the signed-in admin's password.
 * Body: { current_password, new_password }
 */
export async function POST(req: Request) {
  return guarded(async () => {
    const admin = await getCurrentAdmin();
    if (!admin) return fail('Unauthorized', 401);
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const body = await req.json().catch(() => null);
    const current = String(body?.current_password ?? '');
    const next = String(body?.new_password ?? '');

    if (next.length < 8) {
      return fail('New password must be at least 8 characters', 400);
    }

    const rows = await query<{ password_hash: string }>(
      'SELECT password_hash FROM admin_users WHERE id = ? LIMIT 1',
      [admin.sub],
    );
    if (!rows[0]) return fail('Account not found', 404);

    const valid = await verifyPassword(current, rows[0].password_hash);
    if (!valid) return fail('Current password is incorrect', 401);

    const newHash = await hashPassword(next);
    await execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [
      newHash,
      admin.sub,
    ]);

    return ok({ updated: true });
  });
}
