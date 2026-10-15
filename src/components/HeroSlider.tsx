'use client';

import { useEffect, useRef, useState } from 'react';
import type { HeroSlide } from '@/lib/types';
import { isVideoUrl } from '@/lib/format';
import { IconChevron } from './icons';

interface Props {
  slides: HeroSlide[];
  onCta: (categoryId: number | null) => void;
}

/**
 * Full-width auto-rotating campaign hero. Crossfades between slides, pauses on
 * hover, supports image or video backgrounds, and has prev/next + dots.
 */
export default function HeroSlider({ slides, onCta }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;
  const AUTOPLAY_MS = 5000;

  useEffect(() => {
    if (count <= 1 || paused) return;
    timer.current = setInterval(
      () => setActive((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [count, paused]);

  if (count === 0) return null;

  const go = (i: number) => setActive(((i % count) + count) % count);

  return (
    <section
      className="relative h-[70vh] max-h-[760px] min-h-[420px] w-full overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {slides.map((slide, i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'
            }`}
            aria-hidden={!isActive}
          >
            {/* Background media */}
            {slide.media_url &&
              (isVideoUrl(slide.media_url) ? (
                <video
                  src={slide.media_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.media_url}
                  alt={slide.title}
                  className={`absolute inset-0 h-full w-full object-cover ${
                    isActive ? 'animate-ken-burns' : ''
                  }`}
                />
              ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

            {/* Copy */}
            <div className="container-page relative z-10 flex h-full flex-col justify-center">
              <div className={`max-w-xl ${isActive ? 'animate-slide-fade' : ''}`}>
                {slide.eyebrow && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
                    {slide.eyebrow}
                  </span>
                )}
                <h1 className="heading mt-2 text-4xl leading-[1.05] text-white sm:text-5xl md:text-6xl">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
                    {slide.subtitle}
                  </p>
                )}
                <button
                  onClick={() => onCta(slide.category_id)}
                  className="btn-brand mt-6"
                >
                  {slide.cta_label || 'Shop Now'}
                  <IconChevron className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Auto-scroll progress bar */}
      {count > 1 && (
        <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/20">
          <div
            key={active}
            className="h-full bg-brand"
            style={{
              animation: `progress ${AUTOPLAY_MS}ms linear forwards`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      )}

      {/* Controls */}
      {count > 1 && (
        <>
          <button
            onClick={() => go(active - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/80 text-ink transition hover:bg-white sm:grid"
          >
            <IconChevron className="h-5 w-5 rotate-180" />
          </button>
          <button
            onClick={() => go(active + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/80 text-ink transition hover:bg-white sm:grid"
          >
            <IconChevron className="h-5 w-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? 'w-8 bg-white' : 'w-3 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
