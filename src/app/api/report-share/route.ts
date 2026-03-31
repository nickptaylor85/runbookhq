import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';

// Store generated report HTML under a time-limited token
const shareKey = (token: string) => `wt:report_share:${token}`;

export async function POST(req: NextRequest) {
  // Auth check
  let isAuthed = req.headers.get('x-is-admin') === 'true';
  try {
    const cookieStore = await cookies();
    const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
    if (token) { const p = verifySession(token) as any; if (p?.isAdmin || (p?.tier && p.tier !== 'community')) isAuthed = true; }
  } catch {}
  if (!isAuthed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json() as { html?: string; title?: string };
    if (!body.html) return NextResponse.json({ ok: false, error: 'html required' }, { status: 400 });
    // Generate a 24-char token
    const { randomBytes } = await import('crypto');
    const shareToken = randomBytes(12).toString('hex');
    const entry = JSON.stringify({ html: body.html, title: body.title || 'Security Report', createdAt: Date.now(), expiresIn: 48 });
    // TTL: 48 hours — store with manual expiry check
    await redisSet(shareKey(shareToken), entry);
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io';
    return NextResponse.json({ ok: true, shareUrl: `${base}/report/${shareToken}`, token: shareToken, expiresIn: '48 hours' });
  } catch(e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ ok: false, error: 'token required' }, { status: 400 });
  try {
    const raw = await redisGet(shareKey(token));
    if (!raw) return NextResponse.json({ ok: false, error: 'Report not found or expired' }, { status: 404 });
    const data = JSON.parse(raw);
    // Check 48h expiry
    if (Date.now() - data.createdAt > 48 * 3600000) return NextResponse.json({ ok: false, error: 'Report link expired' }, { status: 410 });
    return NextResponse.json({ ok: true, html: data.html, title: data.title });
  } catch(e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
