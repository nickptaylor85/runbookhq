import { NextRequest, NextResponse } from 'next/server';
import { redisSet, redisDel, setTenantAnthropicKey, KEYS } from '@/lib/redis';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { key?: unknown };
    if (!body || typeof body.key !== 'string') {
      return NextResponse.json({ ok: false, message: 'key required' }, { status: 400 });
    }
    const { key } = body;
    if (!key.startsWith('sk-ant-') || key.length > 200) {
      return NextResponse.json({ ok: false, message: 'Invalid key — must start with sk-ant-' }, { status: 400 });
    }
    const tenantId = getTenantId(req);
    await setTenantAnthropicKey(tenantId, key.trim());
    return NextResponse.json({ ok: true, message: 'API key saved successfully.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    await redisDel(KEYS.TENANT_ANTHROPIC_KEY(tenantId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
