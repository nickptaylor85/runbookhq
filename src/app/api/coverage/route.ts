import { NextRequest, NextResponse } from 'next/server';
import { redisGet, KEYS , sanitiseTenantId } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = getTenantId(req);

    // Load connected tools from Redis
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const connected: Record<string, Record<string, string>> = raw 
      ? JSON.parse(decrypt(raw)) 
      : {};

    const connectedIds = Object.keys(connected);

    // Return coverage summary
    return NextResponse.json({
      ok: true,
      tenantId,
      connectedTools: connectedIds,
      totalConnected: connectedIds.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
