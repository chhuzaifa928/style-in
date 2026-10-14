'use client';

import { useEffect, useState } from 'react';
import type { Category, SiteSettings } from '@/lib/types';
import { apiGet, apiSend } from './api';
import HeroMediaField from './HeroMediaField';
import HeroSlidesManager from './HeroSlidesManager';

interface Props {
  onToast: (msg: string) => void;
}

export default function SettingsPanel({ onToast }: Props) {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  // Password change
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const [settingsRes, catsRes] = await Promise.all([
        apiGet<SiteSettings>('/api/settings'),
        apiGet<Category[]>('/api/categories?all=1'),
      ]);
      if (settingsRes.ok && settingsRes.data) setS(settingsRes.data);
      if (catsRes.ok && catsRes.data) setCategories(catsRes.data);
    })();
  }, []);

  if (!s) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  const set = (k: keyof SiteSettings, v: string | number) =>
    setS({ ...s, [k]: v } as SiteSettings);

  const save = async () => {
    setSaving(true);
    const res = await apiSend<SiteSettings>('/api/settings', 'PUT', s);
    setSaving(false);
    if (res.ok && res.data) {
      setS(res.data);
      onToast('Settings saved');
    } else {
      onToast(res.error || 'Could not save settings');
    }
  };

  const changePassword = async () => {
    if (pwNew.length < 8) {
      onToast('New password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    const res = await apiSend('/api/admin/password', 'POST', {
      current_password: pwCurrent,
      new_password: pwNew,
    });
    setPwSaving(false);
    if (res.ok) {
      setPwCurrent('');
      setPwNew('');
      onToast('Password updated');
    } else {
      onToast(res.error || 'Could not change password');
    }
  };

  const Field = ({
    label,
    k,
    type = 'text',
    placeholder,
  }: {
    label: string;
    k: keyof SiteSettings;
    type?: string;
    placeholder?: string;
  }) => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type={type}
        value={String(s[k] ?? '')}
        placeholder={placeholder}
        onChange={(e) =>
          set(k, type === 'number' ? Number(e.target.value) : e.target.value)
        }
      />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="heading text-xl">Site-Wide Content (CMS)</h2>
        <p className="text-sm text-muted">
          Everything here updates the live storefront instantly on next load.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Marquee */}
        <section className="border border-hairline bg-surface p-5">
          <h3 className="eyebrow mb-3">Promo Ticker</h3>
          <label className="label">Marquee Text (separate messages with “•”)</label>
          <textarea
            className="input min-h-[70px] resize-none"
            value={s.marquee_text}
            onChange={(e) => set('marquee_text', e.target.value)}
            placeholder="FREE DELIVERY OVER PKR 3,500 • NEW DROPS EVERY FRIDAY"
          />
        </section>

        {/* Hero Slider */}
        <section className="border border-hairline bg-surface p-5">
          <h3 className="eyebrow mb-4">Hero Slider (full-width banner)</h3>
          <HeroSlidesManager
            slides={s.hero_slides ?? []}
            categories={categories}
            onChange={(next) => setS({ ...s, hero_slides: next } as SiteSettings)}
          />
        </section>

        {/* Homepage Hero split panels */}
        <section className="border border-hairline bg-surface p-5">
          <h3 className="eyebrow mb-1">Split Hero Panels</h3>
          <p className="mb-4 text-xs text-muted">
            The two large panels below the slider. Upload a photo or video for
            each; leave empty to use the gradient fallback.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left panel */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-ink">
                Left panel (Apparel)
              </span>
              <HeroMediaField
                value={s.hero_left_media_url ?? ''}
                onChange={(url) => set('hero_left_media_url', url)}
              />
              <div>
                <label className="label">Eyebrow</label>
                <input className="input" value={s.hero_left_eyebrow ?? ''} onChange={(e) => set('hero_left_eyebrow', e.target.value)} placeholder="Streetwear Apparel" />
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" value={s.hero_left_title ?? ''} onChange={(e) => set('hero_left_title', e.target.value)} placeholder="The Off-Duty Edit" />
              </div>
            </div>
            {/* Right panel */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-ink">
                Right panel (Footwear)
              </span>
              <HeroMediaField
                value={s.hero_right_media_url ?? ''}
                onChange={(url) => set('hero_right_media_url', url)}
              />
              <div>
                <label className="label">Eyebrow</label>
                <input className="input" value={s.hero_right_eyebrow ?? ''} onChange={(e) => set('hero_right_eyebrow', e.target.value)} placeholder="Kinetic Footwear" />
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" value={s.hero_right_title ?? ''} onChange={(e) => set('hero_right_title', e.target.value)} placeholder="Sole Movement" />
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="grid grid-cols-1 gap-4 border border-hairline bg-surface p-5 sm:grid-cols-2">
          <h3 className="eyebrow col-span-full">Contact & Store</h3>
          <Field label="Primary Phone" k="phone_primary" placeholder="+92 300 0000000" />
          <Field label="WhatsApp Order Line" k="whatsapp_number" placeholder="+92 300 0000000" />
          <Field label="Concierge Email" k="concierge_email" type="email" />
          <Field label="Store Hours" k="store_hours" placeholder="Mon–Sat 12pm–9pm" />
          <div className="sm:col-span-2">
            <label className="label">Boutique Address</label>
            <input className="input" value={s.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </section>

        {/* Social */}
        <section className="grid grid-cols-1 gap-4 border border-hairline bg-surface p-5 sm:grid-cols-3">
          <h3 className="eyebrow col-span-full">Social Profiles</h3>
          <Field label="Instagram URL" k="instagram_url" placeholder="https://instagram.com/…" />
          <Field label="Facebook URL" k="facebook_url" placeholder="https://facebook.com/…" />
          <Field label="TikTok URL" k="tiktok_url" placeholder="https://tiktok.com/@…" />
        </section>

        {/* Shipping */}
        <section className="grid grid-cols-1 gap-4 border border-hairline bg-surface p-5 sm:grid-cols-2">
          <h3 className="eyebrow col-span-full">Delivery & Fees</h3>
          <Field label="Standard Shipping Fee (PKR)" k="shipping_fee" type="number" />
          <Field label="Free Delivery Threshold (PKR)" k="free_delivery_threshold" type="number" />
        </section>

        <div className="sticky bottom-0 flex justify-end bg-canvas py-3">
          <button onClick={save} disabled={saving} className="btn-brand px-8">
            {saving ? 'Saving…' : 'Save All Settings'}
          </button>
        </div>

        {/* Security */}
        <section className="grid grid-cols-1 gap-4 border border-hairline bg-surface p-5 sm:grid-cols-2">
          <h3 className="eyebrow col-span-full">Security — Change Admin Password</h3>
          <div>
            <label className="label">Current Password</label>
            <input className="input" type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label className="label">New Password (min 8 chars)</label>
            <input className="input" type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="sm:col-span-2">
            <button onClick={changePassword} disabled={pwSaving} className="btn-dark">
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
