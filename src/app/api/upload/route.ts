import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '@/lib/auth';
import { guarded, verifyOrigin, fail, ok } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * POST /api/upload  (admin only)
 * Accepts multipart/form-data with one or more `files` fields.
 * Enforces every file-upload security control:
 *   - MIME whitelist (jpeg/png/webp) verified against BOTH the declared type
 *     and the real magic-number signature of the bytes.
 *   - 5MB per-file size cap.
 *   - Filenames discarded entirely; we generate a crypto-random UUID name and
 *     a safe extension derived from the verified type (no path-traversal
 *     possible because the client name is never used on disk).
 *   - Written under public/uploads and served purely as static assets (no
 *     execution path).
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/** Inspect the leading bytes to confirm the real image type. */
function sniffType(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export async function POST(req: Request) {
  return guarded(async () => {
    await requireAdmin();
    if (!verifyOrigin(req)) return fail('Invalid origin', 403);

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return fail('Expected multipart/form-data', 415);
    }

    const form = await req.formData();
    const entries = [
      ...form.getAll('files'),
      ...form.getAll('file'), // allow singular field name too
    ].filter((v): v is File => v instanceof File);

    if (entries.length === 0) return fail('No files provided', 400);
    if (entries.length > 10) return fail('Too many files (max 10)', 400);

    await mkdir(UPLOAD_DIR, { recursive: true });

    const saved: { url: string; filename: string }[] = [];

    for (const file of entries) {
      if (file.size === 0) return fail('Empty file rejected', 400);
      if (file.size > MAX_BYTES) {
        return fail(`"${file.name}" exceeds the 5MB limit`, 413);
      }

      // Declared MIME must be whitelisted…
      if (!ALLOWED[file.type]) {
        return fail(`"${file.name}" has an unsupported type`, 415);
      }

      const buf = Buffer.from(await file.arrayBuffer());

      // …and the real bytes must match an allowed signature.
      const sniffed = sniffType(buf.subarray(0, 12));
      if (!sniffed || !ALLOWED[sniffed]) {
        return fail(`"${file.name}" is not a valid image`, 415);
      }

      // Generate a safe, unique, non-guessable filename. Client name is never
      // used, eliminating path-traversal and overwrite risks.
      const ext = ALLOWED[sniffed];
      const filename = `${Date.now()}-${randomUUID()}.${ext}`;
      const dest = path.join(UPLOAD_DIR, filename);

      // Final guard: ensure the resolved path stays inside UPLOAD_DIR.
      if (!dest.startsWith(UPLOAD_DIR + path.sep)) {
        return fail('Invalid upload path', 400);
      }

      await writeFile(dest, buf, { mode: 0o644 });
      saved.push({ url: `/uploads/${filename}`, filename });
    }

    return ok({ files: saved });
  });
}
