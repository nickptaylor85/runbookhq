import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  const demoMode = await isDemoMode(getTenantFromRequest(req).tenantId);
  if (demoMode) {
    return NextResponse.json({
      summary: { critical: 24, high: 142, medium: 891, low: 2340, total: 3397 },
      vulnerabilities: [
        { id: 168191, name: 'PAN-OS GlobalProtect RCE', severity: 4, sevLabel: 'critical', cvss: 10.0, vpr: 9.8, hosts: 4, family: 'Palo Alto', state: 'Active' },
        { id: 187654, name: 'Ivanti Connect Secure Auth Bypass', severity: 4, sevLabel: 'critical', cvss: 9.1, vpr: 9.4, hosts: 2, family: 'Ivanti', state: 'Active' },
        { id: 190233, name: 'ConnectWise ScreenConnect RCE', severity: 4, sevLabel: 'critical', cvss: 10.0, vpr: 9.6, hosts: 1, family: 'ConnectWise', state: 'Active' },
        { id: 192100, name: 'FortiManager Missing Auth', severity: 4, sevLabel: 'critical', cvss: 9.8, vpr: 9.2, hosts: 1, family: 'Fortinet', state: 'Active' },
        { id: 195020, name: 'Log4Shell in Internal App', severity: 4, sevLabel: 'critical', cvss: 10.0, vpr: 10.0, hosts: 3, family: 'Apache', state: 'Active' },
        { id: 183201, name: 'OpenSSH Pre-Auth RCE (regreSSHion)', severity: 3, sevLabel: 'high', cvss: 8.1, vpr: 8.4, hosts: 45, family: 'OpenSSH', state: 'Active' },
        { id: 178432, name: 'Windows Print Spooler EoP', severity: 3, sevLabel: 'high', cvss: 7.8, vpr: 7.2, hosts: 120, family: 'Windows', state: 'Active' },
        { id: 165789, name: 'Apache Struts RCE', severity: 3, sevLabel: 'high', cvss: 9.8, vpr: 8.8, hosts: 8, family: 'Apache', state: 'Active' },
        { id: 171234, name: 'Microsoft Exchange ProxyShell', severity: 3, sevLabel: 'high', cvss: 9.8, vpr: 9.0, hosts: 2, family: 'Microsoft', state: 'Resurfaced' },
        { id: 159876, name: 'Cisco IOS XE Web UI RCE', severity: 3, sevLabel: 'high', cvss: 10.0, vpr: 9.1, hosts: 6, family: 'Cisco', state: 'Active' },
        { id: 188765, name: 'jQuery XSS via HTML injection', severity: 2, sevLabel: 'medium', cvss: 6.1, vpr: 4.2, hosts: 234, family: 'Web', state: 'Active' },
        { id: 176543, name: 'TLS 1.0 Deprecated Protocol', severity: 2, sevLabel: 'medium', cvss: 5.3, vpr: 3.1, hosts: 89, family: 'Network', state: 'Active' },
      ],
      patchPriority: [
        { id: 195020, name: 'Log4Shell in Internal App', vpr: 10.0, hosts: 3, cvss: 10.0, family: 'Apache' },
        { id: 168191, name: 'PAN-OS GlobalProtect RCE', vpr: 9.8, hosts: 4, cvss: 10.0, family: 'Palo Alto' },
        { id: 183201, name: 'OpenSSH Pre-Auth RCE', vpr: 8.4, hosts: 45, cvss: 8.1, family: 'OpenSSH' },
        { id: 165789, name: 'Apache Struts RCE', vpr: 8.8, hosts: 8, cvss: 9.8, family: 'Apache' },
        { id: 178432, name: 'Windows Print Spooler EoP', vpr: 7.2, hosts: 120, cvss: 7.8, family: 'Windows' },
      ],
      assetCounts: { total: 847, scanned: 710, withCritical: 11, withHigh: 312 },
      scanHealth: { coverage: 84, lastFullScan: new Date(Date.now()-86400000*2).toISOString() },
      topHosts: [
        { hostname: 'SRV-DC01.corp.local', ip: '10.0.1.10', os: 'Windows Server 2022', exposureScore: 820, acrScore: 9, hasAgent: true, lastSeen: new Date(Date.now()-3600000).toISOString() },
        { hostname: 'SRV-WEB02', ip: '10.0.1.25', os: 'Ubuntu 22.04', exposureScore: 710, acrScore: 8, hasAgent: true, lastSeen: new Date(Date.now()-7200000).toISOString() },
        { hostname: 'FW-EDGE-01', ip: '10.0.0.1', os: 'PAN-OS 11.1', exposureScore: 690, acrScore: 10, hasAgent: false, lastSeen: new Date(Date.now()-1800000).toISOString() },
        { hostname: 'WS042.corp.local', ip: '10.0.2.42', os: 'Windows 11', exposureScore: 650, acrScore: 6, hasAgent: true, lastSeen: new Date(Date.now()-1800000).toISOString() },
        { hostname: 'SRV-EXCH01', ip: '10.0.1.15', os: 'Windows Server 2019', exposureScore: 620, acrScore: 9, hasAgent: true, lastSeen: new Date(Date.now()-900000).toISOString() },
      ],
      demo: true, source: 'demo-mode'
    });
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
