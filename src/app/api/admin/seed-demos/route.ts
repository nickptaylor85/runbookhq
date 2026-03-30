import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { redisSet } from '@/lib/redis';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  try {
    const cookieStore = await cookies();
    const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
    if (token) {
      const payload = verifySession(token) as any;
      if (payload?.isAdmin === true) return true;
    }
  } catch {}
  return false;
}

const DEMO_POSTURE = { score: 74, breakdown: [
  { factor: 'Estate Coverage', weight: 30, score: 88, reason: '88% of devices covered' },
  { factor: 'Critical Alerts', weight: 30, score: 55, reason: '3 unresolved critical alerts' },
  { factor: 'KEV Vulnerabilities', weight: 20, score: 60, reason: '2 actively exploited CVEs unpatched' },
  { factor: 'Noise (FP Rate)', weight: 20, score: 80, reason: '20% of alerts are false positives' },
], input: {}, cachedAt: Date.now() };

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    const body = await req.json() as { tenantId: string };
    if (!body.tenantId) return NextResponse.json({ ok: false, error: 'tenantId required' }, { status: 400 });

    const tid = body.tenantId;
    await redisSet(`wt:${tid}:posture`, JSON.stringify(DEMO_POSTURE));
    await redisSet(`wt:${tid}:settings`, JSON.stringify({ userTier: 'team', role: 'analyst', industry: 'Technology', orgSize: '201-500', notifications: { slack: false, email: false }, twoFactorEnabled: false }));

    return NextResponse.json({ ok: true, tenantId: tid, seeded: ['posture', 'settings'] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
