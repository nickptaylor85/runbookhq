import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, KEYS } from '@/lib/redis';
import { cookies } from 'next/headers';

function getTenantId(): string {
  return cookies().get('wt_tenant')?.value || 'global';
}

export async function GET() {
  try {
    const tenantId = getTenantId();
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const connected = raw ? JSON.parse(raw) : {};
    return NextResponse.json({ ok: true, connected });
  } catch(e: any) {
    return NextResponse.json({ ok: true, connected: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { toolId, credentials } = await req.json();
    const tenantId = getTenantId();
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const existing = raw ? JSON.parse(raw) : {};
    if (credentials === null) {
      delete existing[toolId];
    } else {
      existing[toolId] = credentials;
    }
    await redisSet(KEYS.TOOL_CREDS(tenantId), JSON.stringify(existing));
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
