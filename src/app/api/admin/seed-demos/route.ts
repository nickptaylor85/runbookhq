import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, saveTenantConfigs } from '@/lib/config-store';
import { hashPassword } from '@/lib/crypto';

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const adminEmail = authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null;
  const platform = await loadPlatformData();
  if (!adminEmail || platform.users?.[adminEmail]?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }
  if (!platform.users) platform.users = {};
  if (!platform.tenants) platform.tenants = {};
  if (!platform.auditLog) platform.auditLog = [];
  const pw = hashPassword('demo123');
  const now = new Date().toISOString();

  const demos = [
    {
      email: 'free@demo.watchtower.io', org: 'NovaSec Startup', plan: 'community', tid: 'tn_demo_free',
      seats: 1, addons: [],
      branding: { enabled: false, companyName: 'NovaSec Startup' },
      nr: { totalProcessed: 0, autoClosed: 0, escalated: 0, timeSavedMins: 0 },
      incidents: [],
    },
    {
      email: 'team@demo.watchtower.io', org: 'Meridian Financial', plan: 'team', tid: 'tn_demo_team',
      seats: 5, addons: ['ai', 'intel', 'support'],
      branding: { enabled: true, companyName: 'Meridian Financial', primaryColor: '#0ea5e9', accentColor: '#6366f1', supportEmail: 'soc@meridian.io', reportHeader: 'CONFIDENTIAL — Meridian Financial Security' },
      nr: { totalProcessed: 1420, autoClosed: 1207, escalated: 213, timeSavedMins: 9656 },
      incidents: [
        { id: 'INC-MF-001', title: 'Credential phishing targeting treasury', severity: 'high', status: 'investigating', createdAt: new Date(Date.now() - 7200000).toISOString(), alerts: [{ id: 'mf1', title: 'Phishing — fake DocuSign', addedAt: now }], timeline: [{ type: 'created', detail: 'Auto-created by AI triage (96%)', by: 'Watchtower AI', time: new Date(Date.now() - 7200000).toISOString() }] },
      ],
    },
    {
      email: 'mssp@demo.watchtower.io', org: 'IronShield Security', plan: 'mssp', tid: 'tn_demo_mssp',
      seats: 3, addons: ['ai', 'intel', 'reports', 'api', 'branding', 'support'],
      branding: { enabled: true, companyName: 'IronShield Security', primaryColor: '#dc2626', accentColor: '#991b1b', supportEmail: 'noc@ironshield.io', reportHeader: 'IronShield — Weekly Threat Report', reportFooter: '© 2026 IronShield Security Ltd.', hideWatchtowerBranding: true },
      nr: { totalProcessed: 11400, autoClosed: 9690, escalated: 1710, timeSavedMins: 77520 },
      incidents: [
        { id: 'INC-IS-001', title: 'APT29 indicators across 3 clients', severity: 'critical', status: 'investigating', createdAt: new Date(Date.now() - 14400000).toISOString(), alerts: [{ id: 'is1', title: 'C2 beacon — Acme Corp', addedAt: now }, { id: 'is2', title: 'C2 beacon — Vertex Ltd', addedAt: now }], timeline: [{ type: 'created', detail: 'Cross-client correlation detected', by: 'Watchtower AI', time: new Date(Date.now() - 14400000).toISOString() }] },
      ],
      managedClients: [
        { name: 'Acme Corp', status: 'active', health: 'red', plan: 'business', tools: 12, openIncidents: 2, slaBreached: 1, members: 4 },
        { name: 'Vertex Engineering', status: 'active', health: 'amber', plan: 'team', tools: 8, openIncidents: 1, slaBreached: 0, members: 3 },
        { name: 'BrightPath Education', status: 'active', health: 'green', plan: 'team', tools: 6, openIncidents: 0, slaBreached: 0, members: 2 },
        { name: 'Coastal Logistics', status: 'active', health: 'green', plan: 'business', tools: 10, openIncidents: 0, slaBreached: 0, members: 5 },
        { name: 'Summit Financial', status: 'idle', health: 'amber', plan: 'team', tools: 7, openIncidents: 1, slaBreached: 1, members: 3 },
      ],
    },
  ];

  for (const d of demos) {
    platform.users[d.email] = {
      email: d.email, password: pw, org: d.org, plan: d.plan, role: 'admin',
      tenantId: d.tid, createdAt: now, addons: d.addons, seats: d.seats,
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      totpEnabled: false, totpSecret: null,
    };
    platform.tenants[d.tid] = {
      id: d.tid, name: d.org, plan: d.plan, owner: d.email,
      members: [d.email], createdAt: now, status: 'active', addons: d.addons,
    };
    const td: any = { tools: {}, updatedAt: now };
    td.tools['_demo'] = { id: '_demo', enabled: true, credentials: { mode: 'demo' } };
    td.noiseReduction = { enabled: d.plan !== 'community', stats: d.nr };
    td.incidents = d.incidents;
    td.branding = d.branding;
    const mult = d.plan === 'community' ? 0 : d.plan === 'team' ? 1 : 8;
    td.addons = {
      active: d.addons, usage: {
        ai: { triagesThisMonth: d.nr.totalProcessed, copilotQueries: 45 * mult },
        intel: { feedsActive: d.addons.includes('intel') ? 3 : 0, iocsMatched: 12 * mult },
        reports: { generatedThisMonth: d.addons.includes('reports') ? 32 : 0 },
        api: { keysActive: d.addons.includes('api') ? 2 : 0, callsThisMonth: d.addons.includes('api') ? 9976 : 0 },
        branding: { enabled: d.addons.includes('branding') },
        support: { ticketsOpen: d.addons.includes('support') ? (d.plan === 'mssp' ? 3 : 1) : 0, slaTarget: d.addons.includes('support') ? '4h' : '48h' },
      },
    };
    if ((d as any).managedClients) {
      for (const mc of (d as any).managedClients) {
        const mcTid = 'tn_mc_' + mc.name.toLowerCase().replace(/\s/g, '_').substring(0, 16);
        platform.tenants[mcTid] = {
          id: mcTid, name: mc.name, plan: mc.plan, owner: d.email,
          members: [d.email], createdAt: now, status: mc.status,
          parentMssp: d.tid, health: mc.health, tools: mc.tools,
          openIncidents: mc.openIncidents, slaBreached: mc.slaBreached,
        };
      }
    }
    await saveTenantConfigs(d.tid, td);
  }
  platform.auditLog.push({ action: 'demo_tenants_seeded', by: adminEmail, count: demos.length, time: now });
  await savePlatformData(platform);
  return NextResponse.json({ ok: true, message: 'Seeded ' + demos.length + ' demo tenants', tenants: demos.map(d => ({ email: d.email, org: d.org, plan: d.plan, password: 'demo123' })) });
}
