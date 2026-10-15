// Presentation helpers (safe for both server and client components).

/** Format a number as PKR currency, e.g. 2499 -> "PKR 2,499". */
export function formatPKR(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `PKR ${Math.round(n).toLocaleString('en-PK')}`;
}

/**
 * Discount percentage from compare-at vs selling price.
 * Returns 0 when there is no genuine discount.
 */
export function discountPercent(
  actual: number,
  discounted: number,
): number {
  if (!actual || actual <= 0 || discounted >= actual) return 0;
  return Math.round(((actual - discounted) / actual) * 100);
}

/** True when a media URL points at a video file we can play inline. */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
}
