import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { redisLPush, redisLTrim } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  try {
    const cookieStore = await cookies();
    const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
    if (token) {
      const payload = verifySession(token) as any;
      if (payload?.isAdmin === true) return true;
    }
  } catch {}
  return false;
}

const auditKey = (t: string) => `wt:${t}:audit`;

export async function POST(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  if (!(await requireAdmin(req))) {
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
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
