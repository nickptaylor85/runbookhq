import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET() {
  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });
  try {
    const vulnData = await tenableAPI('/workbenches/vulnerabilities?date_range=30');
    const vulns = (vulnData.vulnerabilities || []).filter((v: any) => v.severity >= 3);
    
    // Group by plugin family for remediation grouping
    const families: Record<string, any[]> = {};
    vulns.forEach((v: any) => {
      const fam = v.plugin_family || 'Other';
      if (!families[fam]) families[fam] = [];
      families[fam].push(v);
    });

    // Build CSV
    const rows = ['Plugin ID,Name,Severity,CVSS3,VPR,Hosts,Family,State'];
    vulns.sort((a: any, b: any) => (b.vpr_score || 0) - (a.vpr_score || 0)).forEach((v: any) => {
      rows.push([v.plugin_id, `"${(v.plugin_name || '').replace(/"/g, '""')}"`, v.severity === 4 ? 'Critical' : 'High', v.cvss3_base_score || '', v.vpr_score || '', v.count || 0, `"${v.plugin_family || ''}"`, v.vulnerability_state || ''].join(','));
    });

    return new Response(rows.join('\n'), {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="remediation-report-${new Date().toISOString().split('T')[0]}.csv"` },
    });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }); }
}
