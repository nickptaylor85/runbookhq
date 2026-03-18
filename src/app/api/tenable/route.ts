import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  const demoMode = await isDemoMode(getTenantFromRequest(req).tenantId);
  if (demoMode) {
    const { DEMO_TENABLE_VULNS } = await import('@/lib/demo-data');
    return NextResponse.json({ ...DEMO_TENABLE_VULNS, demo: true, source: 'demo-mode' });
  }
  const { tenantId } = getTenantFromRequest(req);
  const headers = await tenableHeaders(tenantId || undefined);
  if (!headers) return NextResponse.json({ demo: false, summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, assetCounts: { total: 0, scanned: 0, withCritical: 0, withHigh: 0 }, scanHealth: { coverage: 0 }, allVulns: [], topCritical: [], topHosts: [], noCredentials: true });

  try {
    const [vulnData, assetData] = await Promise.all([
      tenableAPI('/workbenches/vulnerabilities?date_range=30').catch(() => null),
      tenableAPI('/assets').catch(() => null),
    ]);

    const vulnList = vulnData?.vulnerabilities || [];
    const assetList = assetData?.assets || [];

    const critical = vulnList.filter((v: any) => v.severity === 4).length;
    const high = vulnList.filter((v: any) => v.severity === 3).length;
    const medium = vulnList.filter((v: any) => v.severity === 2).length;
    const low = vulnList.filter((v: any) => v.severity === 1).length;

    const allVulns = vulnList.map((v: any) => ({
      id: v.plugin_id || 0,
      cve: null,
      name: v.plugin_name || 'Unknown',
      family: v.plugin_family || '',
      severity: v.severity || 0,
      sevLabel: ['info','low','medium','high','critical'][v.severity] || 'info',
      cvss: v.cvss3_base_score || v.cvss_base_score || 0,
      cvss2: v.cvss_base_score || 0,
      vpr: v.vpr_score || 0,
      hosts: v.count || 0,
      state: v.vulnerability_state || 'Active',
      accepted: v.accepted_count || 0,
      recasted: v.recasted_count || 0,
    }));

    // Parse real assets
    const topHosts = assetList.slice(0, 50).map((a: any) => ({
      hostname: a.agent_name?.[0] || a.fqdn?.[0] || a.netbios_name?.[0] || a.hostname?.[0] || a.ipv4?.[0] || 'Unknown',
      ip: a.ipv4?.[0] || '',
      os: a.operating_system?.[0] || '',
      hasAgent: a.has_agent || false,
      lastSeen: a.last_seen || '',
      exposureScore: a.exposure_score || 0,
      acrScore: a.acr_score || 0,
    })).sort((a: any, b: any) => (b.exposureScore || 0) - (a.exposureScore || 0)).slice(0, 15);

    const agentCount = assetList.filter((a: any) => a.has_agent).length;

    return NextResponse.json({
      demo: false, source: 'tenable-live',
      summary: { total: vulnList.length, critical, high, medium, low },
      assetCounts: { total: assetList.length, scanned: agentCount, withCritical: Math.min(critical, assetList.length), withHigh: Math.min(high, assetList.length) },
      scanHealth: { coverage: assetList.length > 0 ? Math.round(agentCount / assetList.length * 100) : 0 },
      allVulns: allVulns.sort((a: any, b: any) => b.severity - a.severity || b.vpr - a.vpr || b.hosts - a.hosts),
      topCritical: allVulns.filter((v: any) => v.severity === 4).slice(0, 10).map((v: any) => ({ id: `PID-${v.id}`, name: v.name, cvss: v.cvss, vpr: v.vpr, hosts: v.hosts, family: v.family })),
      topHosts,
    });
  } catch (e) {
    return NextResponse.json({ demo: false, summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, assetCounts: { total: 0, scanned: 0, withCritical: 0, withHigh: 0 }, scanHealth: { coverage: 0 }, allVulns: [], topCritical: [], topHosts: [], error: String(e) });
  }
}
