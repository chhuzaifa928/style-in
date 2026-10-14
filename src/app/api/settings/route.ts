import { requireAdmin } from '@/lib/auth';
import { execute } from '@/lib/db';
import { getSettings } from '@/lib/data';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { cleanText, cleanPhone, cleanUrl, toMoney } from '@/lib/sanitize';

export const runtime = 'nodejs';

/** GET /api/settings — public read of site-wide CMS content. */
export async function GET() {
  return guarded(async () => ok(await getSettings()));
}

/** PUT /api/settings — admin update of all site-wide content fields. */
export async function PUT(req: Request) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const current = await getSettings();
    const body = await req.json().catch(() => null);
    if (!body) return fail('Invalid body', 400);

    const marquee = cleanText(body.marquee_text ?? current.marquee_text, 500);
    const phone = cleanPhone(body.phone_primary ?? current.phone_primary);
    const whatsapp = cleanPhone(body.whatsapp_number ?? current.whatsapp_number);
    const email = cleanText(body.concierge_email ?? current.concierge_email, 190);
    const address = cleanText(body.address ?? current.address, 500);
    const hours = cleanText(body.store_hours ?? current.store_hours, 190);
    const instagram =
      body.instagram_url !== undefined
        ? cleanUrl(body.instagram_url, 300)
        : current.instagram_url;
    const facebook =
      body.facebook_url !== undefined
        ? cleanUrl(body.facebook_url, 300)
        : current.facebook_url;
    const tiktok =
      body.tiktok_url !== undefined
        ? cleanUrl(body.tiktok_url, 300)
        : current.tiktok_url;
    const shippingFee = toMoney(body.shipping_fee ?? current.shipping_fee);
    const threshold = toMoney(
      body.free_delivery_threshold ?? current.free_delivery_threshold,
    );

    const heroLeftMedia =
      body.hero_left_media_url !== undefined
        ? cleanUrl(body.hero_left_media_url, 500)
        : current.hero_left_media_url;
    const heroLeftEyebrow = cleanText(
      body.hero_left_eyebrow ?? current.hero_left_eyebrow,
      120,
    );
    const heroLeftTitle = cleanText(
      body.hero_left_title ?? current.hero_left_title,
      160,
    );
    const heroRightMedia =
      body.hero_right_media_url !== undefined
        ? cleanUrl(body.hero_right_media_url, 500)
        : current.hero_right_media_url;
    const heroRightEyebrow = cleanText(
      body.hero_right_eyebrow ?? current.hero_right_eyebrow,
      120,
    );
    const heroRightTitle = cleanText(
      body.hero_right_title ?? current.hero_right_title,
      160,
    );

    await execute(
      `UPDATE site_settings SET
         marquee_text = ?, phone_primary = ?, whatsapp_number = ?,
         concierge_email = ?, address = ?, store_hours = ?,
         instagram_url = ?, facebook_url = ?, tiktok_url = ?,
         shipping_fee = ?, free_delivery_threshold = ?,
         hero_left_media_url = ?, hero_left_eyebrow = ?, hero_left_title = ?,
         hero_right_media_url = ?, hero_right_eyebrow = ?, hero_right_title = ?
       WHERE id = 1`,
      [
        marquee,
        phone,
        whatsapp,
        email,
        address,
        hours,
        instagram,
        facebook,
        tiktok,
        shippingFee,
        threshold,
        heroLeftMedia,
        heroLeftEyebrow,
        heroLeftTitle,
        heroRightMedia,
        heroRightEyebrow,
        heroRightTitle,
      ],
    );

    return ok(await getSettings());
  });
}
