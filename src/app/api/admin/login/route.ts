import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findAdminByUsername, verifyPassword } from '@/lib/auth';
import { createSession, sessionCookieOptions, SESSION_TTL_SECONDS } from '@/lib/session';
import { rateLimit, resetRateLimit, clientIp } from '@/lib/rate-limit';
import { fail, verifyOrigin } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * POST /api/admin/login
 * Body: { username, password }
 * - Origin-checked (CSRF), rate-limited (brute-force), bcrypt-verified.
 * - On success sets an HTTP-only, SameSite=Lax, Secure session cookie.
 */
export async function POST(req: Request) {
  if (!verifyOrigin(req)) return fail('Invalid origin', 403);

  const ip = clientIp(req);
  // 8 attempts / 10 minutes per IP.
  const rl = rateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail('Invalid request body', 400);
  }

  const username = String(body.username ?? '').trim().slice(0, 80);
  const password = String(body.password ?? '');

  if (!username || !password) {
    return fail('Username and password are required', 400);
  }

  const user = await findAdminByUsername(username);

  // Always run a bcrypt comparison to keep timing uniform whether or not the
  // user exists (compare against a dummy hash when absent).
  const DUMMY_HASH =
    '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvhjTq1Qe0YqkG4h3o9Zb5s2kL9rO';
  const hash = user?.password_hash ?? DUMMY_HASH;
  const valid = await verifyPassword(password, hash);

  if (!user || !valid) {
    return fail('Invalid username or password', 401);
  }

  // Success — clear the throttle for this IP and issue a session.
  resetRateLimit(`login:${ip}`);

  const { token } = await createSession({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  const store = await cookies();
  store.set({ ...sessionCookieOptions(SESSION_TTL_SECONDS), value: token });

  return NextResponse.json({
    ok: true,
    data: { username: user.username, role: user.role },
  });
}
