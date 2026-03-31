import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';

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
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  try {
    const raw = await redisGet(OT_KEY(tenantId));
    if (raw) return NextResponse.json({ ok: true, ...JSON.parse(raw) });
    return NextResponse.json({ ok: true, enabled: false, deviceLimit: 0, deviceCount: 0, plan: 'none' });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  try {
    const body = await req.json() as { enabled?: boolean; deviceLimit?: number };
    const raw = await redisGet(OT_KEY(tenantId));
    const current = raw ? JSON.parse(raw) : { enabled: false, deviceLimit: 0, deviceCount: 0 };
    const updated = { ...current, ...body, updatedAt: Date.now() };
    await redisSet(OT_KEY(tenantId), JSON.stringify(updated));
    // £999/mo flat + £1/device/mo — billing tracked via deviceLimit
    const monthlyTotal = 999 + (updated.deviceLimit || 0);
    return NextResponse.json({ ok: true, ...updated, estimatedMonthly: monthlyTotal });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
