import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI, getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { ioc } = await req.json();
  if (!ioc || ioc.length < 3) return NextResponse.json({ ioc, resultCount: 0, results: [] });

  const results: any[] = [];
  const q = ioc.toLowerCase();

  // Search Tenable
  const headers = await tenableHeaders();
  if (headers) {
    try {
      const data = await tenableAPI(`/workbenches/assets?filter.0.filter=host.hostname&filter.0.quality=match&filter.0.value=${encodeURIComponent(ioc)}`);
      (data.assets || []).forEach((a: any) => {
        results.push({ tool: 'Tenable.io', type: 'asset', severity: 'info', match: a.agent_name?.[0] || a.fqdn?.[0] || a.ipv4?.[0] || ioc, detail: `OS: ${a.operating_system?.[0] || 'Unknown'}, IP: ${a.ipv4?.[0] || ''}` });
      });
    } catch {}

    // Also search vulns
    try {
      const data = await tenableAPI('/workbenches/vulnerabilities?date_range=30');
      (data.vulnerabilities || []).filter((v: any) => (v.plugin_name || '').toLowerCase().includes(q) || String(v.plugin_id).includes(q)).slice(0, 5).forEach((v: any) => {
        results.push({ tool: 'Tenable.io', type: 'vulnerability', severity: v.severity >= 4 ? 'critical' : v.severity >= 3 ? 'high' : 'medium', match: v.plugin_name, detail: `Plugin ${v.plugin_id}, ${v.count || 0} hosts, VPR ${v.vpr_score || 'N/A'}` });
      });
    } catch {}
  }

  // Search Taegis
  const taegisAuth = await getTaegisToken();
  if (taegisAuth) {
    try {
      const query = `query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.4 AND (metadata.title CONTAINS '${ioc.replace(/'/g, '')}') EARLIEST=-7d", offset: 0, limit: 5 }) { alerts { list { id metadata { title severity } status } } } }`;
      const data = await taegisGraphQL(query, {}, taegisAuth.token, taegisAuth.base);
      (data.data?.alertsServiceSearch?.alerts?.list || []).forEach((a: any) => {
        results.push({ tool: 'Taegis XDR', type: 'alert', severity: (a.metadata?.severity || 0) >= 0.8 ? 'critical' : 'high', match: a.metadata?.title || 'Taegis Alert', detail: `Status: ${a.status || 'unknown'}` });
      });
    } catch {}
  }

  return NextResponse.json({ ioc, resultCount: results.length, results, demo: false });
}
