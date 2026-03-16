import { NextResponse } from 'next/server';
import { loadPlatformData, loadTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  if (!email || platform.users?.[email]?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tenants = Object.entries(platform.tenants || {});
  const health: any[] = [];

  for (const [id, tenant] of tenants) {
    const t = tenant as any;
    const configs = await loadTenantConfigs(id);
    const toolCount = Object.keys(configs.tools || {}).length;
    const enabledTools = Object.values(configs.tools || {}).filter((tool: any) => tool.enabled).length;
    const toolNames = Object.values(configs.tools || {}).filter((tool: any) => tool.enabled).map((tool: any) => tool.id);

    // Find last login for this tenant's members
    const members = t.members || [];
    const memberLogins = (platform.auditLog || [])
      .filter((l: any) => l.action === 'user_login' && members.includes(l.email))
      .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const lastActive = memberLogins[0]?.time || t.createdAt;

    const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000);

    health.push({
      id, name: t.name, plan: t.plan, owner: t.owner,
      memberCount: members.length,
      toolCount, enabledTools, toolNames,
      lastActive, daysSinceActive,
      status: daysSinceActive <= 1 ? 'active' : daysSinceActive <= 7 ? 'idle' : daysSinceActive <= 30 ? 'inactive' : 'churned',
      configsLastUpdated: configs.updatedAt || null,
    });
  }

  health.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

  const summary = {
    active: health.filter(h => h.status === 'active').length,
    idle: health.filter(h => h.status === 'idle').length,
    inactive: health.filter(h => h.status === 'inactive').length,
    churned: health.filter(h => h.status === 'churned').length,
  };

  return NextResponse.json({ health, summary });
}
