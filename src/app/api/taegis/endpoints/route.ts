import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function GET(req: Request) {
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
