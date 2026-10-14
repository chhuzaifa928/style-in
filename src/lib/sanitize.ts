/**
 * Input sanitization helpers.
 *
 * Strategy:
 *  - Strip control characters and trim.
 *  - Neutralize HTML/script injection by removing angle brackets (`<` `>`) so a
 *    stored value can never introduce an element/`<script>` in ANY consumer
 *    (React, exports, emails). We deliberately do NOT entity-escape quotes or
 *    ampersands here: React already escapes those safely on render, and storing
 *    pre-escaped entities would double-escape readable copy (e.g. "Men's").
 *  - Enforce max lengths to bound payloads.
 *
 * We never use dangerouslySetInnerHTML anywhere, so removing angle brackets is
 * sufficient to prevent stored XSS while keeping text human-readable.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Remove characters that could open an HTML tag. */
export function neutralizeTags(input: string): string {
  return input.replace(/[<>]/g, '');
}

/** Clean a single-line free-text field. */
export function cleanText(value: unknown, maxLen = 2000): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(CONTROL_CHARS, '').trim();
  return neutralizeTags(str).slice(0, maxLen);
}

/** Clean a multi-line field but preserve newlines (e.g. product description). */
export function cleanMultiline(value: unknown, maxLen = 5000): string {
  if (value === null || value === undefined) return '';
  const str = String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  return neutralizeTags(str).slice(0, maxLen);
}

/** Phone numbers: keep digits, +, spaces, dashes, parens. */
export function cleanPhone(value: unknown, maxLen = 40): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[^0-9+\-\s()]/g, '')
    .trim()
    .slice(0, maxLen);
}

/** Validate & lightly clean a URL, allowing only http(s) or site-relative paths. */
export function cleanUrl(value: unknown, maxLen = 500): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(CONTROL_CHARS, '').trim();
  if (!str) return '';
  if (str.startsWith('/')) return neutralizeTags(str).slice(0, maxLen); // local path
  try {
    const u = new URL(str);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.toString().slice(0, maxLen);
    }
  } catch {
    /* invalid URL */
  }
  return '';
}

/** Build a URL-safe slug from a name. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Parse a value into a non-negative number (price / stock). */
export function toMoney(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function toInt(value: unknown, min = 0): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n < min) return min;
  return n;
}

/** Normalize a sizes array to clean, de-duplicated short strings. */
export function cleanSizes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    const s = neutralizeTags(
      String(raw).replace(CONTROL_CHARS, '').trim(),
    ).slice(0, 12);
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
    if (out.length >= 40) break;
  }
  return out;
}
