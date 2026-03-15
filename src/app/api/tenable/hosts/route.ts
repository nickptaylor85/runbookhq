import { NextResponse } from 'next/server';
import { tenableHeaders } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { pluginId } = await req.json();
  if (!pluginId) return NextResponse.json({ error: 'No pluginId' }, { status: 400 });

  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ demo: true, hosts: [] });

  const pid = String(pluginId).replace('CVE-','').replace('PID-','');

  try {
    // Get assets affected by this plugin
    const res = await fetch(`https://cloud.tenable.com/workbenches/assets?filter.0.filter=plugin_id&filter.0.quality=eq&filter.0.value=${pid}`, { headers, cache: 'no-store' });
    const data = await res.json();
    const hosts = (data.assets || []).map((a: any) => ({
      hostname: a.agent_name?.[0] || a.fqdn?.[0] || a.netbios_name?.[0] || a.hostname?.[0] || a.ipv4?.[0] || 'Unknown',
      ip: a.ipv4?.[0] || '',
      os: a.operating_system?.[0] || '',
      lastSeen: a.last_seen || '',
      hasAgent: a.has_agent || false,
      state: 'open',
    }));

    return NextResponse.json({ demo: false, pluginId: pid, hostCount: hosts.length, hosts });
  } catch (e) {
    return NextResponse.json({ demo: true, hosts: [], error: String(e) });
  }
}
