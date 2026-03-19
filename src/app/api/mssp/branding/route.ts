import { NextResponse } from 'next/server';
import { loadPlatformData, loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const configs = await loadTenantConfigs(tenantId);
  return NextResponse.json({ branding: (configs as any).branding || { enabled: false } });
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const platform = await loadPlatformData();
  const user = Object.values(platform.users || {}).find((u: any) => u.tenantId === tenantId) as any;
  if (!user || (user.role !== 'superadmin' && user.role !== 'admin' && user.plan !== 'mssp')) {
    return NextResponse.json({ error: 'MSSP plan or admin role required' }, { status: 403 });
  }

  const body = await req.json();
  const configs = await loadTenantConfigs(tenantId);

  (configs as any).branding = {
    enabled: body.enabled !== false,
    companyName: body.companyName || 'Watchtower',
    logoUrl: body.logoUrl || '',
    primaryColor: body.primaryColor || '#3b8bff',
    accentColor: body.accentColor || '#7c6aff',
    favicon: body.favicon || '',
    supportEmail: body.supportEmail || '',
    supportUrl: body.supportUrl || '',
    customDomain: body.customDomain || '',
    hideWatchtowerBranding: body.hideWatchtowerBranding || false,
    reportHeader: body.reportHeader || '',
    reportFooter: body.reportFooter || '',
  };

  await saveTenantConfigs(tenantId, configs);
  return NextResponse.json({ ok: true, branding: (configs as any).branding });
}
