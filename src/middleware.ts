import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

/**
 * Edge middleware protecting the admin UI and admin APIs.
 *
 * Runs on every matched request BEFORE the route. Verifies the signed session
 * cookie using Web Crypto (Edge-compatible). Unauthenticated users are:
 *   - redirected to /admin/login for page requests
 *   - given 401 JSON for /api/admin/* requests
 *
 * The /admin/login page and /api/admin/login endpoint are intentionally
 * excluded so a logged-out admin can reach the gate.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  // Public exceptions within the protected trees.
  const isLoginPage = pathname === '/admin/login';
  const isLoginApi = pathname === '/api/admin/login';

  if ((isAdminPage && !isLoginPage) || (isAdminApi && !isLoginApi)) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);

    if (!session) {
      if (isAdminApi) {
        return NextResponse.json(
          { ok: false, error: 'Unauthorized' },
          { status: 401 },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // If an authenticated admin hits the login page, bounce to the dashboard.
  if (isLoginPage) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
