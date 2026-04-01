import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

const WAITLIST_KEY = 'wt:platform:waitlist';

export async function POST(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  try {
    const { email } = await req.json() as { email?: string };
    if (!email || !email.includes('@')) return NextResponse.json({ ok: false }, { status: 400 });

    const raw = await redisGet(WAITLIST_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(email.toLowerCase())) {
      list.push(email.toLowerCase());
      await redisSet(WAITLIST_KEY, JSON.stringify(list));
    }
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Admin-only: view waitlist
  if (req.headers.get('x-is-admin') !== 'true' && req.headers.get('x-user-tier') !== 'mssp') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const raw = await redisGet(WAITLIST_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return NextResponse.json({ ok: true, count: list.length, emails: list });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
