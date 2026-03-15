import { NextResponse } from 'next/server';
import { getDefenderToken, defenderAPI, getMDEToken, mdeAPI, getTaegisToken, taegisGraphQL, getConfiguredTools } from '@/lib/api-clients';
import { DEMO_DEFENDER_ALERTS, DEMO_TAEGIS_ALERTS } from '@/lib/demo-data';

export async function GET() {
  const tools = await getConfiguredTools();
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
      const taegisAuth = await getTaegisToken();
      if (taegisAuth) {
        const query = `query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.6 EARLIEST=-1d", offset: 0, limit: 20 }) { reason alerts { total_results list { id metadata { title severity } status } } } }`;
        const data = await taegisGraphQL(query, {}, taegisAuth.token, taegisAuth.base);
        const alertList = data.data?.alertsServiceSearch?.alerts?.list || [];
        if (alertList.length > 0) {
          alerts.push(...alertList.map((a: any) => ({
            id: a.id, title: a.metadata?.title || 'Taegis Alert',
            severity: a.metadata?.severity >= 0.8 ? 'critical' : a.metadata?.severity >= 0.6 ? 'high' : a.metadata?.severity >= 0.4 ? 'medium' : 'low',
            status: (a.status || 'open').toLowerCase(), source: 'Taegis XDR',
            category: null, device: null, user: null,
            timestamp: new Date().toISOString(), mitre: null,
          })));
        }
        if (data.errors) errors.push('Taegis GraphQL: ' + JSON.stringify(data.errors).substring(0, 200));
      } else {
        errors.push('Taegis: Failed to obtain auth token');
      }
    } catch (e) { errors.push('Taegis: ' + (e as Error).message); }
  }

  // If no tools configured or no alerts fetched, return demo data
  if (alerts.length === 0) {
    return NextResponse.json({
      demo: true,
      alerts: [...DEMO_DEFENDER_ALERTS, ...DEMO_TAEGIS_ALERTS].filter((a: any) => a.severity === 'critical' || a.severity === 'high').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      errors: errors.length ? errors : undefined,
    });
  }

  const filtered = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json({ demo: false, alerts: filtered, errors: errors.length ? errors : undefined });
}
