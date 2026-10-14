import { NextResponse } from 'next/server';

/** Standard JSON success response. */
export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

/** Standard JSON error response. */
export function fail(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/**
 * CSRF defense for mutation requests: verify the request Origin (or Referer)
 * matches our own host. Combined with the SameSite=Lax session cookie this
 * blocks cross-site forged submissions.
 */
export function verifyOrigin(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  // Prefer an explicitly configured origin in production.
  const configured = process.env.APP_ORIGIN;

  const allowedHosts = new Set<string>();
  if (host) allowedHosts.add(host.toLowerCase());
  if (configured) {
    try {
      allowedHosts.add(new URL(configured).host.toLowerCase());
    } catch {
      /* ignore */
    }
  }

  const candidate = origin || referer;
  if (!candidate) {
    // Some same-origin fetches omit Origin; fall back to requiring a host match
    // being impossible to verify — reject to be safe for state-changing calls.
    return false;
  }
  try {
    return allowedHosts.has(new URL(candidate).host.toLowerCase());
  } catch {
    return false;
  }
}

/** Wrap a handler to translate thrown auth errors into proper responses. */
export async function guarded(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.status === 401) return fail('Unauthorized', 401);
    // eslint-disable-next-line no-console
    console.error('[api] unhandled error:', e);
    return fail('Server error', 500);
  }
}
