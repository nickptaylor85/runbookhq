import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { tenableHeaders } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  if (await isDemoMode(getTenantFromRequest(req).tenantId)) {
    return NextResponse.json({ hosts: [
      { hostname: 'SRV-DC01.corp.local', ip: '10.0.1.10', os: 'Windows Server 2022', exposureScore: 820, acrScore: 9, hasAgent: true, lastSeen: new Date(Date.now()-3600000).toISOString() },
      { hostname: 'SRV-WEB02.corp.local', ip: '10.0.1.25', os: 'Ubuntu 22.04', exposureScore: 710, acrScore: 8, hasAgent: true, lastSeen: new Date(Date.now()-7200000).toISOString() },
      { hostname: 'WS042.corp.local', ip: '10.0.2.42', os: 'Windows 11', exposureScore: 650, acrScore: 6, hasAgent: true, lastSeen: new Date(Date.now()-1800000).toISOString() },
      { hostname: 'SRV-DB03.corp.local', ip: '10.0.1.33', os: 'Windows Server 2019', exposureScore: 580, acrScore: 7, hasAgent: false, lastSeen: new Date(Date.now()-14400000).toISOString() },
    ], demo: true });
  }
  const { tenantId } = getTenantFromRequest(req);
  const { pluginId } = await req.json();
  if (!pluginId) return NextResponse.json({ error: 'No pluginId' }, { status: 400 });

  const headers = await tenableHeaders(tenantId || undefined);
  if (!headers) return NextResponse.json({ demo: true, hosts: [] });

  const pid = String(pluginId).replace('PID-','');

  try {
    const res = await fetch(`https://cloud.tenable.com/workbenches/vulnerabilities/${pid}/outputs`, { headers, cache: 'no-store' });
    const data = await res.json();

    // Parse the nested structure: outputs[].states[].results[].assets[]
    const hostMap = new Map();
    (data.outputs || []).forEach((output: any) => {
      // Extract CVEs from plugin_output
      const cveMatch = output.plugin_output?.match(/Cves\s*:\s*(.+)/);
      const cves = cveMatch ? cveMatch[1].trim() : '';

      (output.states || []).forEach((state: any) => {
        (state.results || []).forEach((result: any) => {
          (result.assets || []).forEach((asset: any) => {
            const key = asset.id || asset.uuid;
            if (!hostMap.has(key)) {
              hostMap.set(key, {
                hostname: asset.hostname || asset.fqdn?.split('.')[0] || asset.netbios_name || asset.ipv4?.split(',')[0] || 'Unknown',
                fqdn: asset.fqdn || '',
                ip: asset.ipv4?.split(',')[0] || '',
                netbios: asset.netbios_name || '',
                firstSeen: asset.first_seen || '',
                lastSeen: asset.last_seen || '',
                state: state.name || 'active',
                severity: result.severity || 0,
                port: result.port || 0,
                protocol: result.transport_protocol || '',
                cves,
              });
            }
          });
        });
      });
    });

    const hosts = Array.from(hostMap.values()).sort((a: any, b: any) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    return NextResponse.json({ demo: false, pluginId: pid, hostCount: hosts.length, hosts });
  } catch (e) {
    return NextResponse.json({ demo: true, hosts: [], error: String(e) });
  }
}
