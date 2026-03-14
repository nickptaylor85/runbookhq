import { NextResponse } from 'next/server';
import { getConfiguredTools } from '@/lib/api-clients';
import { DEMO_COVERAGE, DEMO_METRICS, DEMO_ZSCALER } from '@/lib/demo-data';

export async function GET() {
  const tools = await getConfiguredTools();
  const anyConfigured = Object.values(tools).some(Boolean);

  // Always return demo metrics/coverage for now
  // In production, each tool API would be queried for device/agent counts
  return NextResponse.json({
    demo: !anyConfigured,
    coverage: DEMO_COVERAGE,
    metrics: DEMO_METRICS,
    zscaler: DEMO_ZSCALER,
    tools,
    configuredTools: Object.entries(tools).filter(([_, v]) => v).map(([k]) => k),
  });
}
