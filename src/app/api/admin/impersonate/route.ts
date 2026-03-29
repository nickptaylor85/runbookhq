import { NextRequest, NextResponse } from 'next/server';
import { redisLPush, redisLTrim } from '@/lib/redis';

function requireAdmin(req: NextRequest): boolean {
  return req.headers.get('x-is-admin') === 'true';
}

const auditKey = (t: string) => `wt:${t}:audit`;

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const body = await req.json() as { targetTenantId: string; targetTenantName?: string };
    const { targetTenantId, targetTenantName } = body;

    if (!targetTenantId) {
      return NextResponse.json({ ok: false, error: 'targetTenantId required' }, { status: 400 });
    }

    const adminUserId = req.headers.get('x-user-id') || 'admin';
    const originTenantId = req.headers.get('x-tenant-id') || 'global';

    // Write impersonation to audit log of both the admin's tenant and the target tenant
    const entry = JSON.stringify({
      ts: Date.now(),
      type: 'admin_impersonate',
      analyst: adminUserId,
      alertId: null,
      alertTitle: `Admin impersonated ${targetTenantName || targetTenantId}`,
      action: `Switched to tenant: ${targetTenantId}`,
      originTenant: originTenantId,
      targetTenant: targetTenantId,
    });

    await redisLPush(auditKey(originTenantId), entry);
    await redisLTrim(auditKey(originTenantId), 0, 999);

    // Also log in target tenant so they can see admin activity if audited
    await redisLPush(auditKey(targetTenantId), JSON.stringify({
      ts: Date.now(),
      type: 'admin_accessed',
      analyst: 'Platform Admin',
      alertTitle: 'Admin accessed this tenant',
    }));
    await redisLTrim(auditKey(targetTenantId), 0, 999);

    return NextResponse.json({
      ok: true,
      tenantId: targetTenantId,
      impersonating: true,
      message: `Viewing as ${targetTenantName || targetTenantId}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
