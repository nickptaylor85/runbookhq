import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest, loadPlatformData } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const configs = await loadTenantConfigs(tenantId);
  const platform = await loadPlatformData();
  const user = Object.values(platform.users || {}).find((u: any) => u.tenantId === tenantId) as any;
  const plan = user?.plan || 'community';
  const addonData = (configs as any).addons || { active: [], usage: {} };
  return NextResponse.json({ plan, addons: addonData.active || user?.addons || [], usage: addonData.usage || {}, updatedAt: addonData.updatedAt });
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { action, addon } = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  if (!(configs as any).addons) (configs as any).addons = { active: [], usage: {} };
  if (action === 'activate' && addon) {
    if (!(configs as any).addons.active.includes(addon)) (configs as any).addons.active.push(addon);
  } else if (action === 'deactivate' && addon) {
    (configs as any).addons.active = (configs as any).addons.active.filter((a: string) => a !== addon);
  } else if (action === 'track_usage') {
    const { feature, metric, value } = await req.json();
    if (!((configs as any).addons.usage[feature])) (configs as any).addons.usage[feature] = {};
    (configs as any).addons.usage[feature][metric] = ((configs as any).addons.usage[feature][metric] || 0) + (value || 1);
  }
  (configs as any).addons.updatedAt = new Date().toISOString();
  await saveTenantConfigs(tenantId, configs);
  return NextResponse.json({ ok: true, addons: (configs as any).addons.active });
}
