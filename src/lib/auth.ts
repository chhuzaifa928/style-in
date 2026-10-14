import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from './db';
import { verifySession, SESSION_COOKIE, SessionPayload } from './session';

/**
 * Node-runtime auth helpers (bcrypt is Node-only, so these are never imported
 * into the Edge middleware — middleware uses verifySession directly).
 */

export interface AdminUserRow {
  id: number;
  username: string;
  password_hash: string;
  role: string;
}

/** Look up an admin by username (parameterized). */
export async function findAdminByUsername(
  username: string,
): Promise<AdminUserRow | null> {
  const rows = await query<AdminUserRow>(
    'SELECT id, username, password_hash, role FROM admin_users WHERE username = ? LIMIT 1',
    [username],
  );
  return rows[0] ?? null;
}

/**
 * Verify a password against a bcrypt hash. bcrypt.compare is itself
 * constant-time with respect to the hash, mitigating timing attacks.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/** Hash a new password (used by the password-change endpoint & seed script). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Read & verify the current admin session from the request cookies.
 * Returns the session payload or null. Use in route handlers / server pages.
 */
export async function getCurrentAdmin(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/** Throwing guard for API routes that must be admin-only. */
export async function requireAdmin(): Promise<SessionPayload> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const err = new Error('Unauthorized') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return admin;
}
