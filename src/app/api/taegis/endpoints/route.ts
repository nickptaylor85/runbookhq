import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  const { getTenantFromRequest } = await import('@/lib/config-store');
  const { tenantId } = getTenantFromRequest(req);
  if (await isDemoMode(tenantId)) {
    return NextResponse.json({ endpoints: [
      { id: 'ep-001', hostname: 'WS042.corp.local', os: 'Windows', osVersion: '11 23H2', sensorVersion: '4.2.1', isolated: false, lastSeen: new Date(Date.now()-1800000).toISOString() },
      { id: 'ep-002', hostname: 'SRV-DC01.corp.local', os: 'Windows Server', osVersion: '2022', sensorVersion: '4.2.1', isolated: false, lastSeen: new Date(Date.now()-900000).toISOString() },
      { id: 'ep-003', hostname: 'WS015.corp.local', os: 'Windows', osVersion: '11 23H2', sensorVersion: '4.2.0', isolated: true, lastSeen: new Date(Date.now()-3600000).toISOString() },
      { id: 'ep-004', hostname: 'FS01.corp.local', os: 'Windows Server', osVersion: '2019', sensorVersion: '4.1.8', isolated: false, lastSeen: new Date(Date.now()-7200000).toISOString() },
      { id: 'ep-005', hostname: 'SRV-WEB02', os: 'Ubuntu', osVersion: '22.04', sensorVersion: '4.2.1', isolated: false, lastSeen: new Date(Date.now()-1200000).toISOString() },
      { id: 'ep-006', hostname: 'WS088.corp.local', os: 'Windows', osVersion: '11 23H2', sensorVersion: '4.2.1', isolated: true, lastSeen: new Date(Date.now()-600000).toISOString() },
      { id: 'ep-007', hostname: 'SRV-APP02.corp.local', os: 'Windows Server', osVersion: '2022', sensorVersion: '4.2.0', isolated: false, lastSeen: new Date(Date.now()-5400000).toISOString() },
      { id: 'ep-008', hostname: 'WS033.corp.local', os: 'Windows', osVersion: '10 22H2', sensorVersion: '4.1.8', isolated: false, lastSeen: new Date(Date.now()-14400000).toISOString() },
      { id: 'ep-009', hostname: 'VPN-GW-01', os: 'Linux', osVersion: 'RHEL 9', sensorVersion: '4.2.1', isolated: false, lastSeen: new Date(Date.now()-300000).toISOString() },
      { id: 'ep-010', hostname: 'MAIL-GW', os: 'Linux', osVersion: 'Ubuntu 20.04', sensorVersion: '4.1.5', isolated: false, lastSeen: new Date(Date.now()-2400000).toISOString() },
    ], total: 512, demo: true });
  }
  const { tenantId } = getTenantFromRequest(req);
  const taegisAuth = await getTaegisToken(tenantId || undefined);
  if (!taegisAuth) return NextResponse.json({ ok: false, error: 'Taegis auth failed', endpoints: [] });

  try {
    // Use alertsServiceSearch to find unique hosts from recent alerts
    const query = `query { alertsServiceSearch(in: { cql_query: "FROM alert EARLIEST=-7d", offset: 0, limit: 50 }) { alerts { list { id metadata { title severity } entities { hostnames devices { hostnames } } } } } }`;
    const data = await taegisGraphQL(query, {}, taegisAuth.token, taegisAuth.base);
    
    if (data.errors) {
      // Fallback: just get alert titles grouped by host
      const simpleQuery = `query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.3 EARLIEST=-7d", offset: 0, limit: 100 }) { alerts { total_results list { id metadata { title severity } status } } } }`;
      const simple = await taegisGraphQL(simpleQuery, {}, taegisAuth.token, taegisAuth.base);
      const alerts = simple.data?.alertsServiceSearch?.alerts?.list || [];
      return NextResponse.json({ ok: true, total: simple.data?.alertsServiceSearch?.alerts?.total_results || 0, endpoints: [], alerts: alerts.slice(0, 20).map((a: any) => ({ id: a.id, title: a.metadata?.title, severity: a.metadata?.severity, status: a.status })), source: 'alerts-fallback' });
    }

    const list = data.data?.alertsServiceSearch?.alerts?.list || [];
    const hostMap = new Map();
    list.forEach((a: any) => {
      const hosts = a.entities?.hostnames || a.entities?.devices?.flatMap((d: any) => d.hostnames || []) || [];
      hosts.forEach((h: string) => {
        if (!hostMap.has(h)) hostMap.set(h, { hostname: h, alertCount: 0, lastAlert: '' });
        const entry = hostMap.get(h);
        entry.alertCount++;
        entry.lastAlert = a.metadata?.title || '';
      });
    });

    return NextResponse.json({ ok: true, total: hostMap.size, endpoints: Array.from(hostMap.values()).sort((a: any, b: any) => b.alertCount - a.alertCount) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), endpoints: [] });
  }
}
