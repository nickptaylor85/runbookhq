import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';

// Persists alert overrides (FP/TP/ack) per tenant so analyst work survives page refresh
const stateKey = (tenantId: string) => `wt:${tenantId}:alert_overrides`;

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const raw = await redisGet(stateKey(tenantId));
    return NextResponse.json({ ok: true, overrides: raw ? JSON.parse(raw) : {} });
  } catch(e: any) {
    return NextResponse.json({ ok: false, overrides: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const body = await req.json() as { overrides?: unknown };
    if (!body?.overrides || typeof body.overrides !== 'object') {
      return NextResponse.json({ ok: false, error: 'overrides object required' }, { status: 400 });
    }
    // Cap at 5000 entries to prevent unbounded growth
    const entries = Object.entries(body.overrides as Record<string, unknown>).slice(0, 5000);
    const capped = Object.fromEntries(entries);
    await redisSet(stateKey(tenantId), JSON.stringify(capped));
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
