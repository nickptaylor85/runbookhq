import { NextResponse } from 'next/server';
import { loadPlatformData, loadTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  const user = platform.users?.[email || ''];

  // Only superadmin or users with mssp role
  if (!user || (user.role !== 'superadmin' && user.role !== 'mssp')) {
    // Calculate health and cross-client correlation
    const allAlertTitles: Record<string, string[]> = {};
    portfolio.forEach((t: any) => {
      // Health RAG: red if incidents+breaches, amber if incidents or stale, green if clean
      const score = t.openIncidents * 30 + t.slaBreached * 40 + (t.status === 'inactive' ? 20 : 0);
      t.health = score >= 40 ? 'red' : score > 0 ? 'amber' : 'green';
      t.healthLabel = score >= 40 ? 'Critical' : score > 0 ? 'Needs Attention' : 'Healthy';
    });

    return NextResponse.json({ error: 'MSSP or superadmin access required' }, { status: 403 });
  }

  const tenants = Object.values(platform.tenants || {}) as any[];
  const portfolio = await Promise.all(tenants.map(async (tenant: any) => {
    try {
      const configs = await loadTenantConfigs(tenant.id);
      const toolCount = Object.values(configs.tools || {}).filter((t: any) => t.enabled).length;
      const slaActive = (configs.slaTracking || []).filter((s: any) => !s.resolvedAt);
      const slaBreached = slaActive.filter((s: any) => {
        const deadline = new Date(s.createdAt).getTime() + 240 * 60000;
        return Date.now() > deadline;
      });
      const incidents = (configs.incidents || []).filter((i: any) => i.status !== 'closed');
      const nr = configs.noiseReduction?.stats || {};

      return {
        id: tenant.id, name: tenant.name, plan: tenant.plan, owner: tenant.owner,
        members: tenant.members?.length || 0,
        tools: toolCount,
        openIncidents: incidents.length,
        slaActive: slaActive.length,
        slaBreached: slaBreached.length,
        noiseReduction: { autoClosed: nr.autoClosed || 0, timeSavedMins: nr.timeSavedMins || 0 },
        lastActive: platform.users?.[tenant.owner]?.lastLoginAt || tenant.createdAt,
        status: (() => {
          const last = platform.users?.[tenant.owner]?.lastLoginAt;
          if (!last) return 'inactive';
          const diff = Date.now() - new Date(last).getTime();
          if (diff < 86400000) return 'active';
          if (diff < 604800000) return 'idle';
          return 'inactive';
        })(),
      };
    } catch(e) { return { id: tenant.id, name: tenant.name, plan: tenant.plan, status: 'error', tools: 0, openIncidents: 0, slaActive: 0, slaBreached: 0, members: 0 }; }
  }));

  const totals = {
    tenants: portfolio.length,
    active: portfolio.filter(p => p.status === 'active').length,
    totalIncidents: portfolio.reduce((s, p) => s + (p.openIncidents || 0), 0),
    totalSlaBreaches: portfolio.reduce((s, p) => s + (p.slaBreached || 0), 0),
    totalTimeSaved: portfolio.reduce((s, p) => s + (p.noiseReduction?.timeSavedMins || 0), 0),
  };

  // Calculate health and cross-client correlation
    const allAlertTitles: Record<string, string[]> = {};
    portfolio.forEach((t: any) => {
      // Health RAG: red if incidents+breaches, amber if incidents or stale, green if clean
      const score = t.openIncidents * 30 + t.slaBreached * 40 + (t.status === 'inactive' ? 20 : 0);
      t.health = score >= 40 ? 'red' : score > 0 ? 'amber' : 'green';
      t.healthLabel = score >= 40 ? 'Critical' : score > 0 ? 'Needs Attention' : 'Healthy';
    });

    return NextResponse.json({ portfolio, totals });
}
