import { getCurrentAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { ok, fail } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The hash seeded by schema.sql for the default 'StyleIn@2026' password. If the
// stored hash still equals this, the admin never changed the default password.
const DEFAULT_SEED_HASH =
  '$2a$10$Y4nEg6TKpNNBFNM3Y/ran.g7gusshgW1wIte2cnUCYU79qvM6Z7le';

/** GET /api/admin/me — current admin session (guarded by middleware too). */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return fail('Unauthorized', 401);

  let usingDefaultPassword = false;
  try {
    const rows = await query<{ password_hash: string }>(
      'SELECT password_hash FROM admin_users WHERE id = ? LIMIT 1',
      [admin.sub],
    );
    usingDefaultPassword = rows[0]?.password_hash === DEFAULT_SEED_HASH;
  } catch {
    /* ignore — non-critical */
  }

  return ok({
    username: admin.username,
    role: admin.role,
    usingDefaultPassword,
  });
}
