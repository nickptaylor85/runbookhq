import { NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tab = url.searchParams.get('tab') || 'overview';
  const { tenantId } = getTenantFromRequest(req);

  // Demo insights — rich, actionable, per-tab
  const insights: Record<string, any[]> = {
    overview: [
      { id: 'ov1', type: 'warning', icon: '🔥', title: 'Posture score dropped 12 points in 48 hours', detail: 'Driven by 3 new critical vulns (CVE-2024-3400, CVE-2024-21762, CVE-2024-1709) and 2 stale agents. Patch PAN-OS and FortiOS within 24h to recover 8 points.', action: 'View affected assets →', actionTab: 'vulns', priority: 'critical' },
      { id: 'ov2', type: 'insight', icon: '📈', title: 'Alert volume is 34% above your 30-day baseline', detail: 'Peak hours are 09:00-11:00 UTC. 78% of the excess is Defender XDR generating duplicate alerts for the same parent incident. Consider tuning Defender alert rules or enabling dedup in Watchtower.', action: 'Review alert patterns →', actionTab: 'alerts', priority: 'medium' },
      { id: 'ov3', type: 'success', icon: '✅', title: 'AI triage saved 33 analyst hours this week', detail: 'Auto-closed 247 false positives with 99.2% accuracy. Zero false negatives confirmed. Top FP sources: Windows Update (89), SCCM deployments (67), AV scans (42).', action: null, priority: 'info' },
    ],
    alerts: [
      { id: 'al1', type: 'pattern', icon: '🔗', title: '4 alerts from WS042 in 38 minutes — likely attack chain', detail: 'Phishing → PowerShell → C2 beacon → DNS tunnelling. Same user (jsmith), escalating MITRE stages. Recommend treating as single incident and isolating WS042.', action: 'Create incident from chain →', priority: 'critical' },
      { id: 'al2', type: 'insight', icon: '🤖', title: 'Defender XDR is producing 3x more FPs than CrowdStrike', detail: 'Last 7 days: Defender 67% FP rate vs CrowdStrike 12%. Top Defender FP: "Suspicious PowerShell execution" triggered by SCCM. Consider adding SCCM exclusion.', action: 'View Defender tuning →', priority: 'medium' },
      { id: 'al3', type: 'anomaly', icon: '⚠️', title: 'admin_svc account active on 3 devices simultaneously', detail: 'SRV-DC01, WS042, and FS01 in the last hour. This service account should only be on DC01. Possible lateral movement or credential theft.', action: 'Investigate account →', priority: 'high' },
    ],
    vulns: [
      { id: 'vu1', type: 'critical', icon: '🚨', title: '3 actively exploited CVEs found on your network', detail: 'CVE-2024-3400 (PAN-OS RCE, CVSS 10.0) on 2 firewalls. CVE-2024-21762 (FortiOS, CVSS 9.8) on 1 device. CVE-2024-1709 (ConnectWise ScreenConnect) on 3 endpoints. All are on CISA KEV.', action: 'Prioritise patching →', priority: 'critical' },
      { id: 'vu2', type: 'trend', icon: '📉', title: 'Critical vulns reduced 28% vs last month', detail: 'Your patch cycle improved from 14 days to 9 days average. 8 criticals remediated. Remaining: 24 critical, 156 high across 847 assets. Focus on the 3 KEV vulns for maximum risk reduction.', action: null, priority: 'info' },
      { id: 'vu3', type: 'recommendation', icon: '🎯', title: 'Patching these 5 plugins would fix 73% of critical risk', detail: 'PAN-OS (2 hosts), FortiOS (1), Log4j (4 hosts), Exchange ProxyShell (3), Apache Struts (2). Total: 12 hosts. Estimated effort: 4-6 hours. Risk reduction: 73%.', action: 'Generate patch plan →', priority: 'high' },
    ],
    coverage: [
      { id: 'co1', type: 'gap', icon: '🔴', title: '5 devices have zero security coverage', detail: 'WS089, WS103, WS117, KIOSK-02, KIOSK-04 — no EDR, no vulnerability scanner, no agent of any kind. 3 are user workstations in the finance department. High risk.', action: 'Deploy agents →', priority: 'critical' },
      { id: 'co2', type: 'stale', icon: '⏰', title: '23 agents haven\'t checked in for 7+ days', detail: 'Likely powered-off devices or broken agents. Top affected: 8 Windows 10 laptops (possible remote workers), 6 servers in DR environment, 9 Linux hosts in staging. Recommend forced agent restart.', action: 'View stale devices →', priority: 'high' },
      { id: 'co3', type: 'recommendation', icon: '📊', title: 'Coverage would reach 95% with 28 more agent deployments', detail: 'Current: 76% (621/817). Target: 95% requires 156 more agents. Quick wins: 28 devices have Tenable but no EDR — deploy CrowdStrike Falcon sensor via SCCM push.', action: 'Export deployment list →', priority: 'medium' },
    ],
    intel: [
      { id: 'in1', type: 'match', icon: '🎯', title: '2 IOCs from today\'s CISA KEV match your network traffic', detail: '185.220.101.42 (Cobalt Strike C2) was blocked by Zscaler ZIA 3 hours ago from WS015. evil-domain.xyz resolved by DNS on WS042 6 hours ago. Both devices need investigation.', action: 'Investigate matches →', priority: 'critical' },
      { id: 'in2', type: 'trend', icon: '📈', title: 'Phishing techniques (T1566) up 45% in your industry this month', detail: 'Based on CISA and ThreatFox data, financial services is seeing a surge in macro-enabled phishing. Your Proofpoint blocked 47 attempts last week — up from 32. Consider additional user awareness training.', action: 'View phishing alerts →', actionTab: 'alerts', priority: 'high' },
      { id: 'in3', type: 'intel', icon: '🕵️', title: 'New APT campaign targeting your sector (APT29)', detail: 'CISA advisory AA24-XX released 2 days ago. TTPs include T1566.001, T1059.001, T1003.001 — all techniques we are monitoring. Your current detections cover 7/9 listed techniques.', action: 'Check MITRE coverage →', priority: 'medium' },
    ],
  };

  return NextResponse.json({ insights: insights[tab] || insights.overview, tab, demo: true });
}
