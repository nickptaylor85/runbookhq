import { NextRequest, NextResponse } from 'next/server';
import { redisSet, redisDel, setTenantAnthropicKey, KEYS } from '@/lib/redis';
import { cookies } from 'next/headers';

async function await getTenantId(req: NextRequest): Promise<string> {
  // Read tenant from cookie (set at login) — falls back to 'global'
  const cookieStore = await cookies();
  return cookieStore.get('wt_tenant')?.value || 'global';
}

export async function POST(req: NextRequest) {
  try {
    const { key, tenantId: bodyTenantId } = await req.json();
    if (!key || !key.startsWith('sk-ant-')) {
      return NextResponse.json({ ok: false, message: 'Invalid key — must start with sk-ant-' }, { status: 400 });
    }
    const tenantId = bodyTenantId || await getTenantId(req);
    await setTenantAnthropicKey(tenantId, key.trim());
    return NextResponse.json({
      ok: true,
      message: `API key saved for tenant ${tenantId} ✓ Active immediately — no redeploy needed.`,
      tenantId,
    });
  } catch(e: any) {
    console.error('Save key error:', e.message);
    return NextResponse.json({ ok: false, message: `Failed to save: ${e.message}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId: bodyTenantId } = await req.json().catch(() => ({}));
    const tenantId = bodyTenantId || await getTenantId(req);
    await redisDel(KEYS.TENANT_ANTHROPIC_KEY(tenantId));
    return NextResponse.json({ ok: true, message: 'API key removed.' });
  } catch(e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
