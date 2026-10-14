'use client';

import type { Category, HeroSlide } from '@/lib/types';
import HeroMediaField from './HeroMediaField';
import { IconPlus, IconTrash, IconChevron } from '../icons';

interface Props {
  slides: HeroSlide[];
  categories: Category[];
  onChange: (next: HeroSlide[]) => void;
}

const EMPTY_SLIDE: HeroSlide = {
  media_url: '',
  eyebrow: '',
  title: '',
  subtitle: '',
  cta_label: 'Shop Now',
  category_id: null,
};

/** Manage the full-width hero slider: add / edit / reorder / remove slides. */
export default function HeroSlidesManager({
  slides,
  categories,
  onChange,
}: Props) {
  const update = (idx: number, patch: Partial<HeroSlide>) =>
    onChange(slides.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const add = () => onChange([...slides, { ...EMPTY_SLIDE }]);

  const remove = (idx: number) => onChange(slides.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= slides.length) return;
    const next = slides.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-ink">
            Hero Slider ({slides.length}/8)
          </span>
          <p className="text-[11px] text-muted">
            Full-width rotating banner at the very top of the store. Leave empty
            to hide the slider and show just the split panels below.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={slides.length >= 8}
          className="btn-outline px-3 py-2 text-xs"
        >
          <IconPlus className="h-4 w-4" /> Add Slide
        </button>
      </div>

      {slides.length === 0 ? (
        <p className="border border-dashed border-hairline p-6 text-center text-xs text-muted">
          No slides yet. Click “Add Slide” to create your first campaign banner.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {slides.map((slide, idx) => (
            <div key={idx} className="border border-hairline p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted">
                  Slide {idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up" className="grid h-7 w-7 place-items-center text-muted hover:text-ink disabled:opacity-30">
                    <IconChevron className="h-4 w-4 -rotate-90" />
                  </button>
                  <button type="button" onClick={() => move(idx, 1)} disabled={idx === slides.length - 1} title="Move down" className="grid h-7 w-7 place-items-center text-muted hover:text-ink disabled:opacity-30">
                    <IconChevron className="h-4 w-4 rotate-90" />
                  </button>
                  <button type="button" onClick={() => remove(idx)} title="Remove slide" className="grid h-7 w-7 place-items-center text-brand hover:opacity-70">
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <HeroMediaField
                  value={slide.media_url}
                  onChange={(url) => update(idx, { media_url: url })}
                />
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="label">Eyebrow</label>
                    <input className="input" value={slide.eyebrow} onChange={(e) => update(idx, { eyebrow: e.target.value })} placeholder="New Season" />
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input className="input" value={slide.title} onChange={(e) => update(idx, { title: e.target.value })} placeholder="Autumn Layers" />
                  </div>
                  <div>
                    <label className="label">Subtitle</label>
                    <input className="input" value={slide.subtitle} onChange={(e) => update(idx, { subtitle: e.target.value })} placeholder="Short supporting line" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Button Text</label>
                      <input className="input" value={slide.cta_label} onChange={(e) => update(idx, { cta_label: e.target.value })} placeholder="Shop Now" />
                    </div>
                    <div>
                      <label className="label">Button Links To</label>
                      <select
                        className="input"
                        value={slide.category_id ?? ''}
                        onChange={(e) =>
                          update(idx, {
                            category_id: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      >
                        <option value="">All Products</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
