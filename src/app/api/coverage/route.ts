import { NextRequest, NextResponse } from 'next/server';
import { redisGet, KEYS } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
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
