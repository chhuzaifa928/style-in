import { execute } from '@/lib/db';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/newsletter — public footer signup. Idempotent on email. */
export async function POST(req: Request) {
  return guarded(async () => {
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const ip = clientIp(req);
    const rl = rateLimit(`news:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.allowed) return fail('Too many requests, try again later.', 429);

    const body = await req.json().catch(() => null);
    if (String(body?.company ?? '').trim() !== '') {
      return fail('Could not subscribe.', 400); // honeypot tripped
    }
    const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 190);
    if (!EMAIL_RE.test(email)) return fail('Enter a valid email address', 400);

    // Insert; ignore duplicates so re-signup is a friendly no-op.
    await execute(
      'INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email',
      [email],
    );

    return ok({ subscribed: true });
  });
}
