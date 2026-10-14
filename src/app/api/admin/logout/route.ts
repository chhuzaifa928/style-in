import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionCookieOptions } from '@/lib/session';
import { verifyOrigin, fail } from '@/lib/api';

export const runtime = 'nodejs';

/** POST /api/admin/logout — clears the session cookie. */
export async function POST(req: Request) {
  if (!verifyOrigin(req)) return fail('Invalid origin', 403);
  const store = await cookies();
  store.set({ ...sessionCookieOptions(0), value: '' });
  return NextResponse.json({ ok: true });
}
