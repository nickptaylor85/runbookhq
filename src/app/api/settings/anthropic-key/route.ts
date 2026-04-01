import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisDel, setTenantAnthropicKey, KEYS , sanitiseTenantId } from '@/lib/redis';
import { encrypt } from '@/lib/encrypt';

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const stored = await redisGet(KEYS.TENANT_ANTHROPIC_KEY(tenantId));
    return NextResponse.json({ ok: true, hasKey: !!stored });
  } catch (e: any) {
    return NextResponse.json({ ok: false, hasKey: false });
  }
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
    await setTenantAnthropicKey(tenantId, encrypt(key.trim()));
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
