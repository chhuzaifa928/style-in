import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/health — liveness + DB connectivity probe (useful post-deploy). */
export async function GET() {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('SELECT 1');
    } finally {
      conn.release();
    }
    return NextResponse.json({ ok: true, db: 'up' });
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
