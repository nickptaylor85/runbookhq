import { NextRequest, NextResponse } from 'next/server';
import { sanitiseTenantId } from '@/lib/redis';
import { redisHSet, redisHGetAll, redisHDel, KEYS } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}

function notesKey(tenantId: string) {
  return `wt:${tenantId}:alert_notes`;
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = getTenantId(req);
    const notes = await redisHGetAll(notesKey(tenantId));
    return NextResponse.json({ ok: true, notes: notes || {} });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, notes: {}, message: e instanceof Error ? e.message : 'error' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as { alertId?: string; note?: string };
    if (!body?.alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    const note = String(body.note || '').slice(0, 2000);
    if (note) {
      await redisHSet(notesKey(tenantId), body.alertId, note);
    } else {
      await redisHDel(notesKey(tenantId), body.alertId);
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as { alertId?: string };
    if (!body?.alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    await redisHDel(notesKey(tenantId), body.alertId);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
