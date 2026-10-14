import { getCurrentAdmin } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

export const runtime = 'nodejs';

/** GET /api/admin/me — current admin session (guarded by middleware too). */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return fail('Unauthorized', 401);
  return ok({ username: admin.username, role: admin.role });
}
