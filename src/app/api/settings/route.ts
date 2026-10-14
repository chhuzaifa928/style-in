import { requireAdmin } from '@/lib/auth';
import { execute } from '@/lib/db';
import { getSettings } from '@/lib/data';
import { ok, fail, guarded, verifyOrigin } from '@/lib/api';
import { cleanText, cleanPhone, cleanUrl, toMoney, toInt } from '@/lib/sanitize';
import type { HeroSlide } from '@/lib/types';

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
    const heroLeftCta = cleanText(
      body.hero_left_cta_label ?? current.hero_left_cta_label,
      40,
    );
    const heroRightCta = cleanText(
      body.hero_right_cta_label ?? current.hero_right_cta_label,
      40,
    );
    const heroLeftCat =
      body.hero_left_category_id !== undefined
        ? body.hero_left_category_id
          ? toInt(body.hero_left_category_id, 1)
          : null
        : current.hero_left_category_id;
    const heroRightCat =
      body.hero_right_category_id !== undefined
        ? body.hero_right_category_id
          ? toInt(body.hero_right_category_id, 1)
          : null
        : current.hero_right_category_id;

    // Hero slider: validate & clean each slide; cap at 8.
    let heroSlides: HeroSlide[];
    if (Array.isArray(body.hero_slides)) {
      heroSlides = (body.hero_slides as unknown[])
        .slice(0, 8)
        .map((raw) => {
          const s = (raw ?? {}) as Record<string, unknown>;
          return {
            media_url: cleanUrl(s.media_url, 500),
            eyebrow: cleanText(s.eyebrow, 120),
            title: cleanText(s.title, 160),
            subtitle: cleanText(s.subtitle, 240),
            cta_label: cleanText(s.cta_label, 40),
            category_id:
              s.category_id != null && s.category_id !== ''
                ? toInt(s.category_id, 1)
                : null,
          };
        })
        .filter((s) => s.media_url || s.title);
    } else {
      heroSlides = current.hero_slides ?? [];
    }

    await execute(
      `UPDATE site_settings SET
         marquee_text = ?, phone_primary = ?, whatsapp_number = ?,
         concierge_email = ?, address = ?, store_hours = ?,
         instagram_url = ?, facebook_url = ?, tiktok_url = ?,
         shipping_fee = ?, free_delivery_threshold = ?,
         hero_left_media_url = ?, hero_left_eyebrow = ?, hero_left_title = ?,
         hero_left_cta_label = ?, hero_left_category_id = ?,
         hero_right_media_url = ?, hero_right_eyebrow = ?, hero_right_title = ?,
         hero_right_cta_label = ?, hero_right_category_id = ?,
         hero_slides = ?
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
        heroLeftCta,
        heroLeftCat,
        heroRightMedia,
        heroRightEyebrow,
        heroRightTitle,
        heroRightCta,
        heroRightCat,
        JSON.stringify(heroSlides),
      ],
    );

    return ok(await getSettings());
  });
}
