import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';
import { DEMO_TENABLE_VULNS } from '@/lib/demo-data';

export async function GET() {
  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ demo: true, ...DEMO_TENABLE_VULNS });

  try {
    const [vulnData, assetData] = await Promise.all([
      tenableAPI('/workbenches/vulnerabilities?date_range=30').catch(() => null),
      tenableAPI('/assets').catch(() => null),
    ]);

    const vulnList = vulnData?.vulnerabilities || [];
    const assetList = assetData?.assets || [];
    const now = Date.now();

    const critical = vulnList.filter((v: any) => v.severity === 4).length;
    const high = vulnList.filter((v: any) => v.severity === 3).length;
    const medium = vulnList.filter((v: any) => v.severity === 2).length;
    const low = vulnList.filter((v: any) => v.severity === 1).length;

    // Build enriched vuln list
    const allVulns = vulnList.map((v: any) => {
      const firstFound = v.first_found || v.discovery?.seen_first;
      const ageDays = firstFound ? Math.floor((now - new Date(firstFound).getTime()) / 86400000) : 0;
      return {
        id: v.plugin_id || 0,
        cve: (v.cve || []).join(', ') || null,
        name: v.plugin_name || 'Unknown',
        severity: v.severity || 0,
        sevLabel: ['info','low','medium','high','critical'][v.severity] || 'info',
        cvss: v.severity_base_score || v.cvss3_base_score || v.cvss_base_score || 0,
        hosts: v.host_count || v.count || 0,
        exploitable: v.exploit_available === true || v.exploit_framework_metasploit === true,
        firstFound: firstFound || null,
        ageDays,
        slaBreached: (v.severity === 4 && ageDays > 14) || (v.severity === 3 && ageDays > 30) || (v.severity === 2 && ageDays > 90),
        slaDays: v.severity === 4 ? 14 : v.severity === 3 ? 30 : v.severity === 2 ? 90 : 365,
        solution: v.solution || null,
        synopsis: v.synopsis || null,
      };
    });

    // Parse assets correctly: agent_name > fqdn > netbios_name > hostname > ipv4
    const topHosts = assetList.slice(0, 50).map((a: any) => ({
      hostname: a.agent_name?.[0] || a.fqdn?.[0] || a.netbios_name?.[0] || a.hostname?.[0] || a.ipv4?.[0] || 'Unknown',
      ip: a.ipv4?.[0] || '',
      os: a.operating_system?.[0] || '',
      hasAgent: a.has_agent || false,
      lastSeen: a.last_seen || '',
      exposureScore: a.exposure_score || 0,
      acrScore: a.acr_score || 0,
    })).sort((a: any, b: any) => (b.exposureScore || 0) - (a.exposureScore || 0)).slice(0, 15);

    return NextResponse.json({
      demo: false, source: 'tenable-live',
      summary: { total: vulnList.length, critical, high, medium, low },
      assetCounts: { total: assetList.length, scanned: assetList.filter((a:any) => a.has_agent).length, withCritical: Math.min(critical, assetList.length), withHigh: Math.min(high, assetList.length) },
      scanHealth: { coverage: assetList.length > 0 ? Math.round(assetList.filter((a:any) => a.has_agent).length / assetList.length * 100) : 0 },
      allVulns: allVulns.sort((a: any, b: any) => b.severity - a.severity || b.hosts - a.hosts),
      topCritical: allVulns.filter((v: any) => v.severity === 4).slice(0, 10).map((v: any) => ({ id: v.cve || `PID-${v.id}`, name: v.name, cvss: v.cvss, epss: 0.5, hosts: v.hosts, firstSeen: v.firstFound, exploitable: v.exploitable, ageDays: v.ageDays, slaBreached: v.slaBreached, solution: v.solution })),
      topHosts,
      slaStats: { breached: allVulns.filter((v:any) => v.slaBreached).length, total: allVulns.length, critOverdue: allVulns.filter((v:any) => v.severity === 4 && v.ageDays > 14).length, highOverdue: allVulns.filter((v:any) => v.severity === 3 && v.ageDays > 30).length },
    });
  } catch (e) {
    return NextResponse.json({ demo: true, ...DEMO_TENABLE_VULNS, error: String(e) });
  }
}
