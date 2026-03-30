import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';

const PLATFORM_KEY = 'wt:platform:settings';


async function isAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  if (req.headers.get('x-user-tier') === 'mssp') return true;
  const sessionToken = req.cookies.get('wt_session')?.value;
  if (sessionToken) {
    try {
      const { createHmac } = await import('crypto');
      const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
      const [encoded, sig] = sessionToken.split('.');
      if (encoded && sig) {
        const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url');
        if (sig === expectedSig) {
          const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
          if (Date.now() - payload.iat <= 86400000 && (payload.isAdmin === true || payload.tier === 'mssp')) return true;
        }
      }
    } catch {}
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
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
  if (!(await isAdmin(req))) {
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
