import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';

const PLATFORM_KEY = 'wt:platform:settings';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  // Primary: middleware-injected header (present for normal dashboard fetches)
  if (req.headers.get('x-is-admin') === 'true') return true;
  if (req.headers.get('x-user-tier') === 'mssp') return true;

  // Fallback: verify session cookie directly (handles cross-origin or cookie-less fetches)
  const cookieStore = await cookies();
  const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
  if (token) {
    const payload = verifySession(token) as any;
    if (payload?.isAdmin === true || payload?.tier === 'mssp') return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const raw = await redisGet(PLATFORM_KEY);
    const settings = raw ? JSON.parse(raw) : { signup_enabled: true };
    return NextResponse.json(settings);
  } catch(e: any) {
    return NextResponse.json({ signup_enabled: true });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json() as Record<string, unknown>;
    const raw = await redisGet(PLATFORM_KEY);
    const current = raw ? JSON.parse(raw) : {};
    const updated = { ...current, ...body };
    await redisSet(PLATFORM_KEY, JSON.stringify(updated));
    return NextResponse.json({ ok: true, ...updated });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
