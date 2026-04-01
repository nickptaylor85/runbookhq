import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

// Incident CRUD — persists incidents per tenant in Redis
// Incidents created from the dashboard are stored here for cross-session persistence

function getTenantId(req: NextRequest) {
  return req.headers.get('x-tenant-id') || 'global';
}
const incKey = (t: string) => `wt:${t}:incidents`;

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  created: string;
  updated: string;
  alertCount: number;
  alerts: string[];
  devices: string[];
  mitreTactics: string[];
  aiSummary: string;
  timeline: unknown[];
  notes?: { text: string; time: string }[];
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = getTenantId(req);
    const raw = await redisGet(incKey(tenantId));
    const incidents: Incident[] = raw ? JSON.parse(raw) : [];
    return NextResponse.json({ ok: true, incidents });
  } catch (e: any) {
    return NextResponse.json({ ok: false, incidents: [], error: e.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as { incident?: Incident; incidents?: Incident[] };
    const raw = await redisGet(incKey(tenantId));
    const current: Incident[] = raw ? JSON.parse(raw) : [];

    if (body.incidents) {
      // Full replace (dashboard sync)
      const sanitised = body.incidents.slice(0, 500);
      await redisSet(incKey(tenantId), JSON.stringify(sanitised));
      return NextResponse.json({ ok: true, count: sanitised.length });
    }

    if (body.incident) {
      // Upsert single incident
      const inc = body.incident;
      const idx = current.findIndex(i => i.id === inc.id);
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...inc, updated: new Date().toLocaleString() };
      } else {
        current.unshift(inc);
      }
      await redisSet(incKey(tenantId), JSON.stringify(current.slice(0, 500)));
      return NextResponse.json({ ok: true, incident: inc });
    }

    return NextResponse.json({ ok: false, error: 'incident or incidents required' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

    const raw = await redisGet(incKey(tenantId));
    const current: Incident[] = raw ? JSON.parse(raw) : [];
    const updated = current.filter(i => i.id !== id);
    await redisSet(incKey(tenantId), JSON.stringify(updated));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
