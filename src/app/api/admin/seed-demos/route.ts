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
      email: 'community@demo.watchtower.io', org: 'NovaSec Startup', plan: 'community', tid: 'tn_demo_community',
      seats: 1, seatLimit: 1, toolLimit: 2, addons: [],
      branding: { enabled: false, companyName: 'NovaSec Startup' },
      nr: { totalProcessed: 0, autoClosed: 0, escalated: 0, timeSavedMins: 0 },
      incidents: [],
    },
    {
      email: 'team@demo.watchtower.io', org: 'Meridian Financial SOC', plan: 'team', tid: 'tn_demo_team',
      seats: 5, seatLimit: 5, toolLimit: 99, addons: ['ai', 'intel'],
      branding: { enabled: true, companyName: 'Meridian Financial', primaryColor: '#0ea5e9', accentColor: '#6366f1', supportEmail: 'soc@meridianfinancial.io', reportHeader: 'CONFIDENTIAL — Meridian Financial Security Operations' },
      nr: { totalProcessed: 1420, autoClosed: 1207, escalated: 213, timeSavedMins: 9656 },
      incidents: [
        { id: 'INC-MF-001', title: 'Credential phishing campaign targeting treasury team', severity: 'high', status: 'investigating', createdAt: new Date(Date.now() - 7200000).toISOString(), alerts: [{ id: 'mf-a1', title: 'Phishing email — fake DocuSign', addedAt: now }], timeline: [{ type: 'created', detail: 'Auto-created by AI triage (96% confidence)', by: 'Watchtower AI', time: new Date(Date.now() - 7200000).toISOString() }] },
      ],
    },
    {
      email: 'business@demo.watchtower.io', org: 'Apex Health Systems', plan: 'business', tid: 'tn_demo_business',
      seats: 8, seatLimit: 10, toolLimit: 99, addons: ['ai', 'intel', 'reports', 'api', 'support'],
      branding: { enabled: true, companyName: 'Apex Health Systems', primaryColor: '#10b981', accentColor: '#059669', supportEmail: 'security@apexhealth.nhs.uk', reportHeader: 'NHS DSPT Compliant — Apex Health Security Report', reportFooter: '© 2026 Apex Health Systems. Patient data protected under UK GDPR.' },
      nr: { totalProcessed: 4260, autoClosed: 3621, escalated: 639, timeSavedMins: 28968 },
      incidents: [
        { id: 'INC-AH-001', title: 'Ransomware indicators on imaging workstation', severity: 'critical', status: 'contained', createdAt: new Date(Date.now() - 86400000).toISOString(), alerts: [{ id: 'ah-a1', title: 'Mass file encryption attempt', addedAt: now }, { id: 'ah-a2', title: 'Shadow copy deletion', addedAt: now }], timeline: [{ type: 'created', detail: 'Auto-created by AI triage (99% confidence)', by: 'Watchtower AI', time: new Date(Date.now() - 86400000).toISOString() }, { type: 'status_change', detail: 'Status → contained. Device isolated via Taegis XDR.', by: 'Watchtower AI', time: new Date(Date.now() - 82800000).toISOString() }] },
        { id: 'INC-AH-002', title: 'Unauthorised SFTP access to patient records server', severity: 'high', status: 'investigating', createdAt: new Date(Date.now() - 3600000).toISOString(), alerts: [], timeline: [{ type: 'created', detail: 'Created by SOC analyst', by: 'business@demo.watchtower.io', time: new Date(Date.now() - 3600000).toISOString() }] },
      ],
    },
    {
      email: 'mssp@demo.watchtower.io', org: 'IronShield Managed Security', plan: 'mssp', tid: 'tn_demo_mssp',
      seats: 3, seatLimit: 99, toolLimit: 99, addons: ['ai', 'intel', 'reports', 'api', 'branding', 'support'],
      branding: { enabled: true, companyName: 'IronShield Security', primaryColor: '#dc2626', accentColor: '#991b1b', supportEmail: 'noc@ironshield.io', logoUrl: '', reportHeader: 'IronShield Managed Security — Weekly Threat Report', reportFooter: '© 2026 IronShield Security Ltd. ISO 27001 Certified.', hideWatchtowerBranding: true, customDomain: 'soc.ironshield.io' },
      nr: { totalProcessed: 11400, autoClosed: 9690, escalated: 1710, timeSavedMins: 77520 },
      incidents: [
        { id: 'INC-IS-001', title: 'APT29 indicators across 3 clients', severity: 'critical', status: 'investigating', createdAt: new Date(Date.now() - 14400000).toISOString(), alerts: [{ id: 'is-a1', title: 'C2 beacon — Client: Acme Corp', addedAt: now }, { id: 'is-a2', title: 'C2 beacon — Client: Vertex Ltd', addedAt: now }, { id: 'is-a3', title: 'Phishing IOC match — Client: BrightPath', addedAt: now }], timeline: [{ type: 'created', detail: 'Cross-client correlation detected IOC on 3 tenants', by: 'Watchtower AI', time: new Date(Date.now() - 14400000).toISOString() }] },
        { id: 'INC-IS-002', title: 'Client: Acme Corp — data exfiltration attempt', severity: 'high', status: 'contained', createdAt: new Date(Date.now() - 7200000).toISOString(), alerts: [], timeline: [{ type: 'created', detail: 'Escalated from auto-triage', by: 'Watchtower AI', time: new Date(Date.now() - 7200000).toISOString() }] },
      ],
      // MSSP gets sub-clients seeded in portfolio API
      managedClients: [
        { name: 'Acme Corp', status: 'active', health: 'red', plan: 'business', tools: 12, openIncidents: 2, slaBreached: 1, members: 4 },
        { name: 'Vertex Engineering Ltd', status: 'active', health: 'amber', plan: 'team', tools: 8, openIncidents: 1, slaBreached: 0, members: 3 },
        { name: 'BrightPath Education', status: 'active', health: 'green', plan: 'team', tools: 6, openIncidents: 0, slaBreached: 0, members: 2 },
        { name: 'Coastal Logistics', status: 'active', health: 'green', plan: 'business', tools: 10, openIncidents: 0, slaBreached: 0, members: 5 },
        { name: 'Summit Financial Group', status: 'idle', health: 'amber', plan: 'team', tools: 7, openIncidents: 1, slaBreached: 1, members: 3 },
      ],
    },
  ];

  for (const d of demos) {
    platform.users[d.email] = {
      email: d.email, password: pw, org: d.org, plan: d.plan, role: 'admin',
      tenantId: d.tid, createdAt: now,
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      totpEnabled: false, totpSecret: null, addons: d.addons,
      seats: d.seats, seatLimit: d.seatLimit,
    };
    platform.tenants[d.tid] = {
      id: d.tid, name: d.org, plan: d.plan, owner: d.email,
      members: [d.email], createdAt: now, status: 'active',
      addons: d.addons, seats: d.seats, seatLimit: d.seatLimit, toolLimit: d.toolLimit,
    };

    const td: any = { tools: {}, updatedAt: now };
    td.tools['_demo'] = { id: '_demo', enabled: true, credentials: { mode: 'demo' } };
    td.noiseReduction = { enabled: d.plan !== 'community', stats: d.nr };
    td.incidents = d.incidents;
    td.branding = d.branding;

    // Seat tracking
    td.seatTracking = {
      allocated: d.seats,
      limit: d.seatLimit,
      plan: d.plan,
      members: d.plan === 'community' ? [d.email] : d.plan === 'team' ? [d.email, 'analyst1@' + d.org.toLowerCase().replace(/\s/g, '') + '.io', 'analyst2@' + d.org.toLowerCase().replace(/\s/g, '') + '.io'] : [d.email, 'analyst1@' + d.org.toLowerCase().replace(/\s/g, '') + '.io'],
      addonSeats: Math.max(0, d.seats - (d.plan === 'team' ? 3 : d.plan === 'business' ? 10 : 1)),
    };

    // Add-on usage
    const mult = d.plan === 'community' ? 0 : d.plan === 'team' ? 1 : d.plan === 'business' ? 3 : 8;
    td.addons = {
      active: d.addons, usage: {
        ai: { triagesThisMonth: d.nr.totalProcessed, copilotQueries: 45 * mult },
        intel: { feedsActive: d.addons.includes('intel') ? 3 : 0, iocsMatched: 12 * mult },
        reports: { generatedThisMonth: d.addons.includes('reports') ? 4 * mult : 0 },
        api: { keysActive: d.addons.includes('api') ? 2 : 0, callsThisMonth: d.addons.includes('api') ? 1247 * mult : 0 },
        branding: { enabled: d.addons.includes('branding') },
        support: { ticketsOpen: d.addons.includes('support') ? (d.plan === 'mssp' ? 3 : 1) : 0, slaTarget: d.addons.includes('support') ? '4h' : '48h' },
      },
    };

    // MSSP: store managed clients for portfolio
    if ((d as any).managedClients) {
      td.managedClients = (d as any).managedClients;
      // Also create sub-tenants for portfolio
      for (const mc of (d as any).managedClients) {
        const mcTid = 'tn_mc_' + mc.name.toLowerCase().replace(/\s/g, '_').substring(0, 16);
        if (!platform.tenants[mcTid]) {
          platform.tenants[mcTid] = {
            id: mcTid, name: mc.name, plan: mc.plan, owner: d.email,
            members: [d.email], createdAt: now, status: mc.status,
            parentMssp: d.tid, health: mc.health, tools: mc.tools,
            openIncidents: mc.openIncidents, slaBreached: mc.slaBreached,
          };
        }
      }
    }

    // Client report schedules for MSSP
    if (d.plan === 'mssp') {
      td.clientReport = { enabled: true, frequency: 'weekly', recipients: ['ciso@acmecorp.com', 'it@vertexeng.co.uk'], lastSent: new Date(Date.now() - 604800000).toISOString() };
    }

    await saveTenantConfigs(d.tid, td);
  }

  platform.auditLog.push({ action: 'demo_tenants_seeded', by: adminEmail, count: demos.length, time: now });
  await savePlatformData(platform);

  return NextResponse.json({
    ok: true,
    message: 'Seeded ' + demos.length + ' demo tenants with branding and data',
    tenants: demos.map(d => ({ email: d.email, org: d.org, plan: d.plan, password: 'demo123', branding: d.branding.companyName })),
  });
}
