import { NextResponse } from 'next/server';
import { loadPlatformData, loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

// GET: list client report schedules
export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const platform = await loadPlatformData();
  const user = Object.values(platform.users || {}).find((u: any) => u.tenantId === tenantId) as any;
  if (!user || (user.role !== 'superadmin' && user.plan !== 'mssp')) {
    return NextResponse.json({ error: 'MSSP plan required' }, { status: 403 });
  }

  // Gather report schedules from all tenants
  const tenants = Object.values(platform.tenants || {}) as any[];
  const schedules: any[] = [];

  for (const tenant of tenants) {
    try {
      const configs = await loadTenantConfigs(tenant.id);
      const schedule = (configs as any).clientReport || { enabled: false };
      schedules.push({
        tenantId: tenant.id,
        tenantName: tenant.name || tenant.id,
        owner: tenant.owner,
        enabled: schedule.enabled,
        frequency: schedule.frequency || 'weekly',
        recipients: schedule.recipients || [],
        lastSent: schedule.lastSent || null,
        nextSend: schedule.nextSend || null,
        includeVulns: schedule.includeVulns !== false,
        includeAlerts: schedule.includeAlerts !== false,
        includePosture: schedule.includePosture !== false,
        includeSLA: schedule.includeSLA !== false,
      });
    } catch(e) { /* skip */ }
  }

  return NextResponse.json({ schedules });
}

// POST: update a client's report schedule
export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  const targetTenantId = body.tenantId;
  if (!targetTenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

  const configs = await loadTenantConfigs(targetTenantId);
  (configs as any).clientReport = {
    enabled: body.enabled !== false,
    frequency: body.frequency || 'weekly',
    recipients: body.recipients || [],
    includeVulns: body.includeVulns !== false,
    includeAlerts: body.includeAlerts !== false,
    includePosture: body.includePosture !== false,
    includeSLA: body.includeSLA !== false,
    updatedAt: new Date().toISOString(),
  };

  await saveTenantConfigs(targetTenantId, configs);
  return NextResponse.json({ ok: true });
}
