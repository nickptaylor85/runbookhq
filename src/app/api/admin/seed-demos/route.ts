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
  const demos = [
    { email: 'community@demo.watchtower.io', org: 'StartupSec Inc', plan: 'community', role: 'admin', tid: 'tn_demo_community', addons: [] },
    { email: 'team@demo.watchtower.io', org: 'MidCorp Security', plan: 'team', role: 'admin', tid: 'tn_demo_team', addons: ['ai', 'intel'] },
    { email: 'business@demo.watchtower.io', org: 'GlobalBank SOC', plan: 'business', role: 'admin', tid: 'tn_demo_business', addons: ['ai', 'intel', 'reports', 'api', 'support'] },
    { email: 'mssp@demo.watchtower.io', org: 'ShieldForce MSSP', plan: 'mssp', role: 'admin', tid: 'tn_demo_mssp', addons: ['ai', 'intel', 'reports', 'api', 'branding', 'support'] },
  ];

  for (const d of demos) {
    platform.users[d.email] = {
      email: d.email, password: pw, org: d.org, plan: d.plan, role: d.role,
      tenantId: d.tid, createdAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      totpEnabled: false, totpSecret: null, addons: d.addons,
      seats: d.plan === 'team' ? 5 : d.plan === 'business' ? 10 : d.plan === 'mssp' ? 3 : 1,
    };
    platform.tenants[d.tid] = {
      id: d.tid, name: d.org, plan: d.plan, owner: d.email,
      members: [d.email], createdAt: new Date().toISOString(), status: 'active', addons: d.addons,
    };
    const td: any = { tools: {}, updatedAt: new Date().toISOString() };
    td.tools['_demo'] = { id: '_demo', enabled: true, credentials: { mode: 'demo' } };
    const mult = d.plan === 'community' ? 0 : d.plan === 'team' ? 1 : d.plan === 'business' ? 3 : 8;
    td.noiseReduction = { enabled: d.plan !== 'community', stats: { totalProcessed: 285 * mult, autoClosed: 247 * mult, escalated: 38 * mult, timeSavedMins: 33 * 60 * mult } };
    td.incidents = d.plan === 'community' ? [] : [
      { id: 'INC-' + d.tid.slice(-4) + '-001', title: 'Credential harvesting campaign — DC01', severity: 'critical', status: d.plan === 'mssp' ? 'contained' : 'investigating', createdAt: new Date(Date.now() - 7200000).toISOString(), alerts: [{ id: 'a1', title: 'LSASS access on DC01', addedAt: new Date().toISOString() }], timeline: [{ type: 'created', detail: 'Incident auto-created by AI triage', by: 'Watchtower AI', time: new Date(Date.now() - 7200000).toISOString() }] },
      { id: 'INC-' + d.tid.slice(-4) + '-002', title: 'Phishing campaign targeting finance', severity: 'high', status: 'open', createdAt: new Date(Date.now() - 3600000).toISOString(), alerts: [], timeline: [{ type: 'created', detail: 'Incident created manually', by: d.email, time: new Date(Date.now() - 3600000).toISOString() }] },
    ];
    td.addons = {
      active: d.addons,
      usage: {
        ai: { triagesThisMonth: 285 * mult, copilotQueries: 45 * mult },
        intel: { feedsActive: d.addons.includes('intel') ? 3 : 0, iocsMatched: 12 * mult },
        reports: { generatedThisMonth: d.addons.includes('reports') ? 4 * mult : 0 },
        api: { keysActive: d.addons.includes('api') ? 2 : 0, callsThisMonth: d.addons.includes('api') ? 1247 * mult : 0 },
        branding: { enabled: d.addons.includes('branding') },
        support: { ticketsOpen: d.addons.includes('support') ? 1 : 0, slaTarget: d.addons.includes('support') ? '4h' : '48h' },
      },
    };
    await saveTenantConfigs(d.tid, td);
  }
  platform.auditLog.push({ action: 'demo_tenants_seeded', by: adminEmail, count: demos.length, time: new Date().toISOString() });
  await savePlatformData(platform);
  return NextResponse.json({ ok: true, message: 'Seeded ' + demos.length + ' demo tenants', tenants: demos.map(d => ({ email: d.email, org: d.org, plan: d.plan, password: 'demo123' })) });
}
