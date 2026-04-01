import { NextRequest, NextResponse } from 'next/server';
import { sanitiseTenantId } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const _tenantId = getTenantId(req);
  return NextResponse.json({"ok": true, "tools": []});
}

export async function POST(req: NextRequest) {
  const _tenantId = getTenantId(req);
  return NextResponse.json({"ok": true});
}
