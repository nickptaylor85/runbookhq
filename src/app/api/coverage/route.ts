import { NextResponse } from 'next/server';
import { getConfiguredTools } from '@/lib/api-clients';
import { DEMO_COVERAGE, DEMO_METRICS, DEMO_ZSCALER } from '@/lib/demo-data';

export async function GET() {
  const tools = getConfiguredTools();
  const anyConfigured = Object.values(tools).some(Boolean);

  if (!anyConfigured) {
    return NextResponse.json({ demo: true, coverage: DEMO_COVERAGE, metrics: DEMO_METRICS, zscaler: DEMO_ZSCALER, tools });
  }

  // When live, each tool API would be queried for device/agent counts
  // For now, return demo data flagged with which tools are connected
  return NextResponse.json({ demo: true, coverage: DEMO_COVERAGE, metrics: DEMO_METRICS, zscaler: DEMO_ZSCALER, tools });
}
