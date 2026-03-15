import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET() {
  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });
  try {
    // Get compliance audit results
    const data = await tenableAPI('/workbenches/vulnerabilities?filter.0.filter=plugin_type&filter.0.quality=eq&filter.0.value=compliance&date_range=30');
    const vulns = data.vulnerabilities || [];
    const passed = vulns.filter((v: any) => v.severity === 0).length;
    const warn = vulns.filter((v: any) => v.severity === 1 || v.severity === 2).length;
    const failed = vulns.filter((v: any) => v.severity === 3 || v.severity === 4).length;
    return NextResponse.json({
      ok: true,
      summary: { total: vulns.length, passed, warn, failed, pct: vulns.length > 0 ? Math.round(passed / vulns.length * 100) : 0 },
      checks: vulns.slice(0, 30).map((v: any) => ({ id: v.plugin_id, name: v.plugin_name, severity: v.severity, hosts: v.count || 0, family: v.plugin_family || '' })),
    });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }); }
}
