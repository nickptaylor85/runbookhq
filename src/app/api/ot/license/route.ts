import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ratelimit';

const OT_KEY = (t: string) => `wt:${t}:ot_license`;

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  const cookieStore = await cookies();
  const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
  if (token) {
    const p = verifySession(token) as any;
    if (p?.isAdmin || p?.tier === 'mssp') return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  try {
    const raw = await redisGet(OT_KEY(tenantId));
    if (raw) return NextResponse.json({ ok: true, ...JSON.parse(raw) });
    return NextResponse.json({ ok: true, enabled: false, deviceLimit: 0, deviceCount: 0, plan: 'none' });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  try {
    const body = await req.json() as { enabled?: boolean; deviceLimit?: number };
    const raw = await redisGet(OT_KEY(tenantId));
    const current = raw ? JSON.parse(raw) : { enabled: false, deviceLimit: 0, deviceCount: 0 };
    // Whitelist OT license fields — prevent mass assignment
    const OT_ALLOWED = new Set(['enabled', 'deviceLimit', 'tenantId', 'plan', 'notes']);
    const safeUpdate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      if (OT_ALLOWED.has(k)) safeUpdate[k] = v;
    }
    const updated = { ...current, ...safeUpdate, updatedAt: Date.now() };
    await redisSet(OT_KEY(tenantId), JSON.stringify(updated));
    // £999/mo flat + £1/device/mo — billing tracked via deviceLimit
    const monthlyTotal = 999 + (updated.deviceLimit || 0);
    return NextResponse.json({ ok: true, ...updated, estimatedMonthly: monthlyTotal });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
