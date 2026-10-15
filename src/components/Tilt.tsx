'use client';

import { useRef } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  max?: number;
  /** Hover scale. */
  scale?: number;
  /** Lift the content toward the viewer (px of translateZ). */
  lift?: number;
}

/**
 * Cursor-tracking 3D tilt. Applies a perspective rotateX/rotateY based on the
 * pointer position, with a gentle spring-back on leave. No-ops on touch
 * devices (no mousemove) and when the user prefers reduced motion.
 */
export default function Tilt({
  children,
  className = '',
  max = 8,
  scale = 1.02,
  lift = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  const prefersReduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    const rx = (0.5 - py) * 2 * max;
    const ry = (px - 0.5) * 2 * max;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(
        2,
      )}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale}) translateZ(${lift}px)`;
    });
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transform =
      'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`[transform-style:preserve-3d] transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
