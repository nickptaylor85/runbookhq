import { NextResponse } from 'next/server';
import { getDefenderToken, defenderAPI, getMDEToken, mdeAPI, getTaegisToken, taegisGraphQL, getConfiguredTools } from '@/lib/api-clients';
import { DEMO_DEFENDER_ALERTS, DEMO_TAEGIS_ALERTS } from '@/lib/demo-data';

export async function GET() {
  const tools = getConfiguredTools();
  const alerts: any[] = [];
  const errors: string[] = [];

  // Defender MDE alerts
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

  // Defender XDR incidents
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
            user: null, timestamp: i.createdDateTime,
            mitre: null,
          })));
        }
      }
    } catch (e) { errors.push('Defender XDR: ' + (e as Error).message); }
  }

  // Taegis alerts
  if (tools.taegis) {
    try {
      const token = await getTaegisToken();
      if (token) {
        const query = `query { alerts(first: 20, orderBy: { field: CREATED_AT, direction: DESC }) { edges { node { id title severity status createdAt } } } }`;
        const data = await taegisGraphQL(query, {}, token);
        if (data.data?.alerts?.edges) {
          alerts.push(...data.data.alerts.edges.map((e: any) => ({
            id: e.node.id, title: e.node.title, severity: e.node.severity?.toLowerCase(),
            status: e.node.status?.toLowerCase(), source: 'Taegis XDR',
            category: null, device: null, user: null,
            timestamp: e.node.createdAt, mitre: null,
          })));
        }
      }
    } catch (e) { errors.push('Taegis: ' + (e as Error).message); }
  }

  // If no tools configured, return demo data
  if (!tools.defender && !tools.taegis) {
    return NextResponse.json({
      demo: true,
      alerts: [...DEMO_DEFENDER_ALERTS, ...DEMO_TAEGIS_ALERTS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    });
  }

  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json({ demo: false, alerts, errors: errors.length ? errors : undefined });
}
