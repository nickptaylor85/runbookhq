import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}
const slaKey = (t: string) => `wt:${t}:sla_events`;

interface SlaEvent {
  alertId: string; severity: string;
  createdAt: number; acknowledgedAt?: number; resolvedAt?: number;
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = getTenantId(req);
    const raw = await redisGet(slaKey(tenantId));
    const events: SlaEvent[] = raw ? JSON.parse(raw) : [];

    const now = Date.now();
    const cutoff = now - 30 * 24 * 60 * 60 * 1000; // last 30 days
    const recent = events.filter(e => e.createdAt > cutoff);

    // MTTA by severity
    const mtta: Record<string, number[]> = { Critical: [], High: [], Medium: [], Low: [] };
    const mttr: Record<string, number[]> = { Critical: [], High: [], Medium: [], Low: [] };
    const slaThresholds: Record<string, number> = { Critical: 3600000, High: 14400000, Medium: 86400000, Low: 259200000 };
    let breaches = 0;

    for (const e of recent) {
      const sev = e.severity || 'Medium';
      if (e.acknowledgedAt) mtta[sev]?.push(e.acknowledgedAt - e.createdAt);
      if (e.resolvedAt) mttr[sev]?.push(e.resolvedAt - e.createdAt);
      const threshold = slaThresholds[sev] || 86400000;
      if (e.acknowledgedAt && e.acknowledgedAt - e.createdAt > threshold) breaches++;
      else if (!e.acknowledgedAt && now - e.createdAt > threshold) breaches++;
    }

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length / 60000) : null;

    return NextResponse.json({
      ok: true,
      stats: {
        totalEvents: recent.length,
        slaBreaches: breaches,
        mttaMinutes: { Critical: avg(mtta.Critical), High: avg(mtta.High), Medium: avg(mtta.Medium), Low: avg(mtta.Low) },
        mttrMinutes: { Critical: avg(mttr.Critical), High: avg(mttr.High), Medium: avg(mttr.Medium), Low: avg(mttr.Low) },
      }
    });
  } catch {
    return NextResponse.json({ ok: true, stats: { totalEvents: 0, slaBreaches: 0, mttaMinutes: {}, mttrMinutes: {} } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as { alertId: string; severity: string; event: string; timestamp?: number };
    const { alertId, severity, event, timestamp = Date.now() } = body;
    if (!alertId || !event) return NextResponse.json({ ok: false, error: 'alertId and event required' }, { status: 400 });

    const raw = await redisGet(slaKey(tenantId));
    const events: SlaEvent[] = raw ? JSON.parse(raw) : [];
    const idx = events.findIndex(e => e.alertId === alertId);

    if (event === 'created') {
      if (idx < 0) events.unshift({ alertId, severity, createdAt: timestamp });
    } else if (event === 'acknowledged' && idx >= 0) {
      events[idx].acknowledgedAt = timestamp;
    } else if (event === 'resolved' && idx >= 0) {
      events[idx].resolvedAt = timestamp;
    }

    // Keep last 2000 events
    const trimmed = events.slice(0, 2000);
    await redisSet(slaKey(tenantId), JSON.stringify(trimmed));
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
