/**
 * Stateless, signed session tokens using HMAC-SHA256 via the Web Crypto API.
 *
 * Works in BOTH the Edge runtime (middleware) and the Node runtime (route
 * handlers), so the same verification code guards every entry point.
 *
 * Token format:  base64url(payloadJSON) + "." + base64url(HMAC)
 * Payload:       { sub, username, role, iat, exp }
 *
 * The signing secret comes from SESSION_SECRET. The signature is verified in
 * constant time by the Web Crypto `verify` primitive.
 */

export const SESSION_COOKIE = 'stylein_admin';
const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionPayload {
  sub: number; // admin user id
  username: string;
  role: string;
  iat: number; // issued-at (unix seconds)
  exp: number; // expiry (unix seconds)
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET is missing or too short. Set a 64+ char random hex value.',
    );
  }
  return secret;
}

// ── base64url helpers (runtime-agnostic) ──
function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 =
    typeof btoa === 'function'
      ? btoa(bin)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin =
    typeof atob === 'function'
      ? atob(b64 + pad)
      : Buffer.from(b64 + pad, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Create a signed session token for an authenticated admin. */
export async function createSession(
  user: { id: number; username: string; role: string },
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<{ token: string; payload: SessionPayload }> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importKey();
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadB64),
  );
  const token = `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
  return { token, payload };
}

/** Verify a token's signature and expiry. Returns the payload or null. */
export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token || token.indexOf('.') === -1) return null;
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return null;

  let key: CryptoKey;
  try {
    key = await importKey();
  } catch {
    return null;
  }

  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sigB64),
      encoder.encode(payloadB64),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      decoder.decode(fromBase64Url(payloadB64)),
    ) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Cookie attributes used when setting/clearing the session cookie. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== 'false',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export const SESSION_TTL_SECONDS = DEFAULT_TTL_SECONDS;
