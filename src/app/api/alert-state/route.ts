import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

// Persists alert overrides (FP/TP/ack) per tenant so analyst work survives page refresh
const stateKey = (tenantId: string) => `wt:${tenantId}:alert_overrides`;

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const raw = await redisGet(stateKey(tenantId));
    const state = raw ? JSON.parse(raw) : {};
    // Support both old format (flat overrides) and new format ({overrides:{}, assignees:{}})
    const overrides = state.overrides || (typeof state === 'object' && !state.overrides ? state : {});
    const assignees = state.assignees || {};
    return NextResponse.json({ ok: true, overrides, assignees });
  } catch(e: any) {
    return NextResponse.json({ ok: false, overrides: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const body = await req.json() as { overrides?: unknown; assignees?: unknown };
    const overrides = body?.overrides && typeof body.overrides === 'object' ? body.overrides : null;
    const assignees = body?.assignees && typeof body.assignees === 'object' ? body.assignees : null;
    if (!overrides && !assignees) return NextResponse.json({ ok: false, error: 'overrides or assignees required' }, { status: 400 });
    // Load existing, merge
    const existing = await redisGet(stateKey(tenantId));
    const current = existing ? JSON.parse(existing) : {};
    if (overrides) current.overrides = Object.fromEntries(Object.entries(overrides as Record<string,unknown>).slice(0,5000));
    if (assignees) current.assignees = Object.fromEntries(Object.entries(assignees as Record<string,unknown>).slice(0,1000));
    await redisSet(stateKey(tenantId), JSON.stringify(current));
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
