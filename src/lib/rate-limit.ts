/**
 * In-memory fixed-window rate limiter.
 *
 * Suitable for Hostinger's single standalone Node process. Keyed by
 * identifier (e.g. `login:<ip>`). Not shared across processes — adequate for
 * a single-instance deployment; swap for Redis if you scale horizontally.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __stylein_rl: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> =
  global.__stylein_rl ?? (global.__stylein_rl = new Map());

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key        unique identifier for the client+action
 * @param limit      max attempts per window
 * @param windowMs   window length in ms
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Clear a key on success (e.g. reset login counter after valid login). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client IP extraction from standard proxy headers. */
export function clientIp(req: Request): string {
  // Prefer headers set by the trusted reverse proxy (Hostinger/Cloudflare),
  // which overwrite any client-supplied value. The leftmost X-Forwarded-For
  // entry is client-controlled and spoofable, so use it only as a last resort,
  // and take the LAST hop (added by the nearest trusted proxy) rather than the
  // first, to make rate-limit evasion harder.
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}

// Opportunistic cleanup so the map can't grow unbounded.
if (!global.__stylein_rl_cleanup) {
  global.__stylein_rl_cleanup = true;
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }, 60_000);
  // Don't keep the process alive just for cleanup.
  if (typeof timer.unref === 'function') timer.unref();
}

declare global {
  // eslint-disable-next-line no-var
  var __stylein_rl_cleanup: boolean | undefined;
}
