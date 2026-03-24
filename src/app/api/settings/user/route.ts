import { NextRequest, NextResponse } from 'next/server';
import { redisHSet, redisHGetAll, KEYS } from '@/lib/redis';
import { cookies } from 'next/headers';

async function getTenantId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('wt_tenant')?.value || 'global';
}

export async function GET() {
  try {
    const tenantId = await getTenantId();
    const settings = await redisHGetAll(KEYS.TENANT_SETTINGS(tenantId));
    return NextResponse.json({ ok: true, settings });
  } catch(e: any) {
    return NextResponse.json({ ok: false, settings: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = await getTenantId();
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        redisHSet(KEYS.TENANT_SETTINGS(tenantId), key, String(value))
      )
    );
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
