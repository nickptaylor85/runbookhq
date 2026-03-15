import { NextResponse } from 'next/server';
import { tenableHeaders } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { pluginId } = await req.json();
  if (!pluginId) return NextResponse.json({ error: 'No pluginId' }, { status: 400 });

  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ demo: true, hosts: demoHosts(pluginId) });

  try {
    const res = await fetch(`https://cloud.tenable.com/workbenches/vulnerabilities/${pluginId}/outputs`, { headers, cache: 'no-store' });
    const data = await res.json();
    const outputs = data.outputs || [];
    const hosts: any[] = [];
    outputs.forEach((o: any) => {
      (o.states || []).forEach((s: any) => {
        (s.results || []).forEach((r: any) => {
          (r.assets || []).forEach((a: any) => {
            hosts.push({ hostname: a.hostname || a.fqdn || a.ipv4 || 'Unknown', ip: a.ipv4 || a.ipv6 || '', os: a.operating_system || '', lastSeen: a.last_seen || '', firstSeen: a.first_seen || '', state: s.name || 'open' });
          });
        });
      });
    });

    if (hosts.length === 0) {
      // Try alternative endpoint
      const res2 = await fetch(`https://cloud.tenable.com/workbenches/assets?filter.0.filter=plugin_id&filter.0.quality=eq&filter.0.value=${pluginId}`, { headers, cache: 'no-store' });
      const data2 = await res2.json();
      (data2.assets || []).forEach((a: any) => {
        hosts.push({ hostname: a.hostname?.[0] || a.fqdn?.[0] || a.ipv4?.[0] || 'Unknown', ip: a.ipv4?.[0] || a.ipv6?.[0] || '', os: a.operating_system?.[0] || '', lastSeen: a.last_seen || '', firstSeen: a.first_seen || '', state: 'open' });
      });
    }

    return NextResponse.json({ demo: false, pluginId, hostCount: hosts.length, hosts });
  } catch (e) {
    return NextResponse.json({ demo: true, hosts: demoHosts(pluginId), error: String(e) });
  }
}

function demoHosts(pluginId: string) {
  return [
    { hostname: 'SRV-DC01.corp.local', ip: '10.1.1.10', os: 'Windows Server 2019', lastSeen: new Date(Date.now() - 3600000).toISOString(), state: 'open' },
    { hostname: 'WS042.corp.local', ip: '10.1.2.42', os: 'Windows 10 22H2', lastSeen: new Date(Date.now() - 7200000).toISOString(), state: 'open' },
    { hostname: 'FS01.corp.local', ip: '10.1.1.20', os: 'Windows Server 2016', lastSeen: new Date(Date.now() - 14400000).toISOString(), state: 'open' },
    { hostname: 'WEB01.corp.local', ip: '10.1.3.10', os: 'Ubuntu 22.04', lastSeen: new Date(Date.now() - 28800000).toISOString(), state: 'open' },
  ];
}
