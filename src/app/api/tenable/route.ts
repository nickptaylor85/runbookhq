import { NextResponse } from 'next/server';
import { tenableAPI, tenableHeaders } from '@/lib/api-clients';
import { DEMO_TENABLE_VULNS } from '@/lib/demo-data';

export async function GET() {
  if (!tenableHeaders()) {
    return NextResponse.json({ demo: true, ...DEMO_TENABLE_VULNS });
  }

  try {
    // Vuln counts by severity
    const counts = await tenableAPI('/workbenches/vulnerabilities?date_range=30&filter.0.filter=severity&filter.0.quality=eq&filter.0.value=4');
    const assets = await tenableAPI('/assets');
    const critVulns = await tenableAPI('/workbenches/vulnerabilities?filter.0.filter=severity&filter.0.quality=eq&filter.0.value=4&sort=count:desc');

    return NextResponse.json({
      demo: false,
      summary: counts,
      assets: assets,
      topCritical: critVulns?.vulnerabilities?.slice(0, 10) || [],
    });
  } catch (e) {
    return NextResponse.json({ demo: true, ...DEMO_TENABLE_VULNS, error: (e as Error).message });
  }
}
