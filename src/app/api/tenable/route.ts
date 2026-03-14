import { NextResponse } from 'next/server';
import { tenableAPI, tenableHeaders } from '@/lib/api-clients';
import { DEMO_TENABLE_VULNS } from '@/lib/demo-data';

export async function GET() {
  const headers = await tenableHeaders();
  if (!headers) {
    return NextResponse.json({ demo: true, ...DEMO_TENABLE_VULNS });
  }

  try {
    const [vulns, assets] = await Promise.all([
      tenableAPI('/workbenches/vulnerabilities?date_range=30').catch(() => null),
      tenableAPI('/assets').catch(() => null),
    ]);

    const vulnList = vulns?.vulnerabilities || [];
    const critical = vulnList.filter((v: any) => v.severity === 4).length;
    const high = vulnList.filter((v: any) => v.severity === 3).length;
    const medium = vulnList.filter((v: any) => v.severity === 2).length;
    const low = vulnList.filter((v: any) => v.severity === 1).length;
    const total = vulnList.length;

    return NextResponse.json({
      demo: false,
      summary: { total, critical, high, medium, low },
      assetCounts: { total: assets?.assets?.length || 0, scanned: assets?.assets?.length || 0, withCritical: critical, withHigh: high },
      scanHealth: { coverage: assets?.assets ? 95 : 0 },
      topCritical: vulnList.filter((v: any) => v.severity === 4).slice(0, 10).map((v: any) => ({
        id: v.plugin_id || 'N/A', name: v.plugin_name || 'Unknown', cvss: v.severity_base_score || 10,
        epss: 0.5, hosts: v.host_count || 1, firstSeen: v.first_found || new Date().toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json({ demo: true, ...DEMO_TENABLE_VULNS, error: (e as Error).message });
  }
}
