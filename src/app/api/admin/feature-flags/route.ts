import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  if (!email || platform.users?.[email]?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ flags: platform.featureFlags || {} });
}

export async function POST(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  if (!email || platform.users?.[email]?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId, flags } = await req.json();
  if (!platform.featureFlags) platform.featureFlags = {};

  if (tenantId) {
    // Per-tenant flags
    platform.featureFlags[tenantId] = { ...(platform.featureFlags[tenantId] || {}), ...flags };
  } else {
    // Global flags
    platform.featureFlags._global = { ...(platform.featureFlags._global || {}), ...flags };
  }

  platform.auditLog?.push({ action: 'feature_flags_updated', by: email, tenantId: tenantId || '_global', flags, time: new Date().toISOString() });
  await savePlatformData(platform);
  return NextResponse.json({ ok: true, flags: platform.featureFlags });
}
