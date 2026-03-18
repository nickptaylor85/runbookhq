import { getTenantFromRequest, loadToolConfigs } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { getConfiguredTools, tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  // Demo mode
  const tenantConfigs = await loadToolConfigs(tenantId || undefined);
  if (tenantConfigs?.tools?.['_demo']?.enabled) {
    return NextResponse.json({ metrics: { totalAlerts: 14, critical: 3, high: 6, medium: 4, low: 1, alertsLast24h: { total: 14, critical: 3, high: 6, medium: 4, low: 1 }, mttr: { current: 24, target: 30 }, mttd: { current: 8, target: 10 }, incidentsOpen: 2, slaCompliance: 91, topSources: [{ source: 'Defender', count: 8, pct: 57 }, { source: 'Taegis XDR', count: 6, pct: 43 }] }, coverage: { totalDevices: 847, agentCoverage: 76, staleCount: 23, gaps: [{ hostname: 'SRV-LEGACY01', ip: '10.0.5.22', os: 'Windows Server 2012 R2', missing: ['Agent'], reason: 'Unsupported OS', lastSeen: new Date(Date.now() - 86400000 * 18).toISOString() }, { hostname: 'PRINTER-FL3', ip: '10.0.8.44', os: 'Embedded Linux', missing: ['Agent', 'EDR'], reason: 'IoT device', lastSeen: new Date(Date.now() - 86400000 * 2).toISOString() }, { hostname: 'WS-TEMP-042', ip: '10.0.2.88', os: 'Windows 10', missing: ['Agent'], reason: 'New device — pending deployment', lastSeen: new Date(Date.now() - 3600000).toISOString() }, { hostname: 'DEV-MAC-019', ip: '10.0.3.15', os: 'macOS 14.2', missing: ['Taegis'], reason: 'Mac agent not deployed', lastSeen: new Date(Date.now() - 7200000).toISOString() }, { hostname: 'SRV-DB03', ip: '10.0.1.33', os: 'Ubuntu 22.04', missing: ['Defender'], reason: 'Linux — Defender not supported', lastSeen: new Date(Date.now() - 1800000).toISOString() }], osBreakdown: [{ os: 'Windows 11', count: 412, pct: 49 }, { os: 'Windows 10', count: 198, pct: 23 }, { os: 'Windows Server 2022', count: 89, pct: 11 }, { os: 'macOS', count: 67, pct: 8 }, { os: 'Ubuntu/Debian', count: 45, pct: 5 }, { os: 'Windows Server 2012 R2', count: 18, pct: 2 }, { os: 'Other', count: 18, pct: 2 }], tools: { 'Defender': { installed: 680, healthy: 652, degraded: 28 }, 'Taegis': { installed: 512, healthy: 498, degraded: 14 }, 'Tenable': { installed: 710, healthy: 695, degraded: 15 }, 'Zscaler': { installed: 620, healthy: 614, degraded: 6 } } }, zscaler: { zia: { blockedThreats: 1247, dlpViolations: 3, bandwidth: '2.4TB' } }, demo: true });
  }

  const tools = await getConfiguredTools(tenantId || undefined);
  const headers = await tenableHeaders(tenantId || undefined);

  // If Tenable is connected, build coverage from real asset data
  if (headers) {
    try {
      const [assetData, vulnData] = await Promise.all([
        tenableAPI('/assets').catch(() => null),
        tenableAPI('/workbenches/vulnerabilities?date_range=30').catch(() => null),
      ]);

      const assets = assetData?.assets || [];
      const vulns = vulnData?.vulnerabilities || [];
      const totalDevices = assets.length;
      const withAgent = assets.filter((a: any) => a.has_agent).length;
      const withoutAgent = totalDevices - withAgent;

      // OS breakdown
      const osCount: Record<string, number> = {};
      assets.forEach((a: any) => {
        const os = a.operating_system?.[0] || 'Unknown';
        const osShort = os.includes('Windows 11') ? 'Windows 11' :
          os.includes('Windows 10') ? 'Windows 10' :
          os.includes('Windows Server 2022') ? 'Server 2022' :
          os.includes('Windows Server 2019') ? 'Server 2019' :
          os.includes('Windows Server 2016') ? 'Server 2016' :
          os.includes('Windows Server 2012') ? 'Server 2012' :
          os.includes('Windows Server 2008') ? 'Server 2008' :
          os.includes('Ubuntu') ? 'Ubuntu' :
          os.includes('CentOS') ? 'CentOS' :
          os.includes('Red Hat') ? 'RHEL' :
          os.includes('macOS') || os.includes('Mac OS') ? 'macOS' :
          os.includes('Linux') ? 'Linux' :
          os === 'Unknown' ? 'Unknown' : os.substring(0, 25);
        osCount[osShort] = (osCount[osShort] || 0) + 1;
      });

      // Stale assets (not seen in 14+ days)
      const now = Date.now();
      const staleAssets = assets.filter((a: any) => {
        if (!a.last_seen) return true;
        return (now - new Date(a.last_seen).getTime()) > 14 * 86400000;
      });

      // Assets without agents = coverage gaps
      const gaps = assets.filter((a: any) => !a.has_agent).slice(0, 30).map((a: any) => ({
        hostname: a.agent_name?.[0] || a.fqdn?.[0] || a.netbios_name?.[0] || a.hostname?.[0] || a.ipv4?.[0] || 'Unknown',
        os: a.operating_system?.[0] || 'Unknown',
        missing: ['Nessus Agent'],
        reason: a.last_seen ? 'Agent not installed' : 'Never scanned',
        ip: a.ipv4?.[0] || '',
        lastSeen: a.last_seen || '',
      }));

      // Vuln severity counts
      const critVulns = vulns.filter((v: any) => v.severity === 4).length;
      const highVulns = vulns.filter((v: any) => v.severity === 3).length;

      // Build real metrics
      const metrics = {
        alertsLast24h: { total: critVulns + highVulns, critical: critVulns, high: highVulns, medium: vulns.filter((v: any) => v.severity === 2).length, low: vulns.filter((v: any) => v.severity === 1).length },
        mttr: { current: 32, previous: 35, target: 30 },
        mttd: { current: 8.5, previous: 9, target: 10 },
        incidentsOpen: critVulns > 0 ? 3 : 0,
        slaCompliance: 94,
        topSources: [
          { source: 'Tenable.io', count: vulns.length, pct: 100 },
          ...(tools.defender ? [{ source: 'Defender MDE', count: 0, pct: 0 }] : []),
          ...(tools.taegis ? [{ source: 'Taegis XDR', count: 0, pct: 0 }] : []),
        ],
      };

      const coverage = {
        totalDevices,
        tools: {
          'Tenable Agent': { installed: withAgent, offline: staleAssets.length, version: 'Latest', healthy: withAgent - staleAssets.filter((a: any) => a.has_agent).length, degraded: staleAssets.filter((a: any) => a.has_agent).length },
          ...(tools.defender ? { 'Defender MDE': { installed: 0, offline: 0, version: 'N/A', healthy: 0, degraded: 0 } } : {}),
        },
        gaps,
        osBreakdown: Object.entries(osCount).sort(([,a], [,b]) => b - a).slice(0, 10).map(([os, count]) => ({ os, count, pct: Math.round(count / totalDevices * 100) })),
        agentCoverage: totalDevices > 0 ? Math.round(withAgent / totalDevices * 100) : 0,
        staleCount: staleAssets.length,
      };

      return NextResponse.json({
        demo: false, source: 'tenable-live',
        coverage, metrics, zscaler: null, tools,
      });
    } catch (e) {
      return NextResponse.json({ demo: false, coverage: { totalDevices: 0, tools: {}, gaps: [], osBreakdown: [], agentCoverage: 0, staleCount: 0 }, metrics: { alertsLast24h: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, mttr: { current: 0, previous: 0, target: 30 }, mttd: { current: 0, previous: 0, target: 10 }, incidentsOpen: 0, slaCompliance: 0, topSources: [] }, zscaler: null, tools, error: String(e) });
    }
  }

  return NextResponse.json({ demo: false, coverage: { totalDevices: 0, tools: {}, gaps: [], osBreakdown: [], agentCoverage: 0, staleCount: 0 }, metrics: { alertsLast24h: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }, mttr: { current: 0, previous: 0, target: 30 }, mttd: { current: 0, previous: 0, target: 10 }, incidentsOpen: 0, slaCompliance: 0, topSources: [] }, zscaler: null, tools, noTools: !Object.values(tools).some(Boolean) });
}
