import { NextResponse } from 'next/server';
import { getDefenderToken, defenderAPI, getMDEToken, mdeAPI, getTaegisToken, taegisGraphQL, getConfiguredTools } from '@/lib/api-clients';
import { getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const tools = await getConfiguredTools(tenantId || undefined);
  const alerts: any[] = [];
  const errors: string[] = [];

  if (tools.defender) {
    try {
      const token = await getMDEToken();
      if (token) {
        const data = await mdeAPI('/alerts?$top=20&$orderby=alertCreationTime desc', token);
        if (data.value) {
          alerts.push(...data.value.map((a: any) => ({
            id: a.id, title: a.title, severity: a.severity?.toLowerCase(),
            status: a.status?.toLowerCase(), source: 'Defender MDE',
            category: a.category, device: a.computerDnsName,
            user: a.relatedUser?.userName, timestamp: a.alertCreationTime,
            mitre: a.mitreTechniques?.[0] || null,
          })));
        }
      }
    } catch (e) { errors.push('Defender MDE: ' + (e as Error).message); }
  }

  if (tools.defender) {
    try {
      const token = await getDefenderToken();
      if (token) {
        const data = await defenderAPI('/incidents?$top=10&$orderby=createdDateTime desc', token);
        if (data.value) {
          alerts.push(...data.value.map((i: any) => ({
            id: i.incidentId, title: i.incidentName, severity: i.severity?.toLowerCase(),
            status: i.status?.toLowerCase(), source: 'Defender XDR',
            category: i.classification || 'Incident', device: null,
            user: null, timestamp: i.createdDateTime, mitre: null,
          })));
        }
      }
    } catch (e) { errors.push('Defender XDR: ' + (e as Error).message); }
  }

  if (tools.taegis) {
    try {
      const taegisAuth = await getTaegisToken(tenantId || undefined);
      if (taegisAuth) {
        const query = `query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.4 EARLIEST=-7d", offset: 0, limit: 50 }) { reason alerts { total_results list { id metadata { title severity } status } } } }`;
        const data = await taegisGraphQL(query, {}, taegisAuth.token, taegisAuth.base);
        const alertList = data.data?.alertsServiceSearch?.alerts?.list || [];
        if (alertList.length > 0) {
          alerts.push(...alertList.map((a: any) => ({
            id: a.id, title: a.metadata?.title || 'Taegis Alert',
            severity: a.metadata?.severity >= 0.7 ? 'critical' : a.metadata?.severity >= 0.5 ? 'high' : a.metadata?.severity >= 0.3 ? 'medium' : 'low',
            status: (a.status || 'open').toLowerCase(), source: 'Taegis XDR',
            category: null, device: null, user: null,
            timestamp: a.id?.match(/:(\d+):/)?.[1] ? new Date(parseInt(a.id.match(/:(\d+):/)[1])).toISOString() : new Date().toISOString(), mitre: null,
          })));
        }
        if (data.errors) errors.push('Taegis GraphQL: ' + JSON.stringify(data.errors).substring(0, 200));
      } else {
        errors.push('Taegis: Failed to obtain auth token');
      }
    } catch (e) { errors.push('Taegis: ' + (e as Error).message); }
  }

  if (alerts.length === 0) {
    return NextResponse.json({ demo: false, alerts: [], errors: errors.length ? errors : ['No alerts from connected tools'], noTools: !Object.values(tools).some(Boolean), _debug: { tools, errorCount: errors.length } });
  }

  const filtered = alerts.filter(a => a.severity === 'critical');
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json({ demo: false, alerts: filtered, totalBeforeFilter: alerts.length, errors: errors.length ? errors : undefined, _debug: { tools, sources: [...new Set(alerts.map((a:any)=>a.source))] } });
}
