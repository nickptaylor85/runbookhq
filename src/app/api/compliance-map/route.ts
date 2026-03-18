import { NextResponse } from 'next/server';
import { loadTenantConfigs, getTenantFromRequest } from '@/lib/config-store';
import { isDemoMode } from '@/lib/demo-check';

const FRAMEWORKS: Record<string, { name: string; controls: { id: string; name: string; category: string; watchtowerFeature: string; status: 'automated'|'supported'|'manual' }[] }> = {
  soc2: {
    name: 'SOC 2 Type II',
    controls: [
      { id: 'CC6.1', name: 'Logical Access Controls', category: 'Security', watchtowerFeature: 'RBAC, 2FA/TOTP, session management, API key auth', status: 'automated' },
      { id: 'CC6.6', name: 'System Boundary Protection', category: 'Security', watchtowerFeature: 'Zscaler ZIA/ZPA integration, web filtering monitoring', status: 'supported' },
      { id: 'CC6.8', name: 'Malicious Software Prevention', category: 'Security', watchtowerFeature: 'Defender/CrowdStrike/SentinelOne EDR monitoring, alert triage', status: 'automated' },
      { id: 'CC7.1', name: 'Detection & Monitoring', category: 'Security', watchtowerFeature: 'Unified alert feed, Taegis/Splunk/Sentinel SIEM, real-time posture score', status: 'automated' },
      { id: 'CC7.2', name: 'Incident Response Procedures', category: 'Security', watchtowerFeature: 'Custom runbooks, incident timeline, SLA tracking, shift handover', status: 'automated' },
      { id: 'CC7.3', name: 'Security Event Evaluation', category: 'Security', watchtowerFeature: 'AI auto-triage (TP/FP/Suspicious), noise reduction, confidence scoring', status: 'automated' },
      { id: 'CC7.4', name: 'Incident Remediation', category: 'Security', watchtowerFeature: 'Taegis device isolation, response actions, investigation creation', status: 'supported' },
      { id: 'CC3.1', name: 'Risk Assessment', category: 'Risk Management', watchtowerFeature: 'Tenable vulnerability scanning, risk-based patch priority (VPR x hosts)', status: 'automated' },
      { id: 'CC3.2', name: 'Risk Mitigation', category: 'Risk Management', watchtowerFeature: 'Remediation reports, SLA deadlines on critical vulns, compliance checks', status: 'supported' },
      { id: 'CC5.1', name: 'Control Activities & Audit', category: 'Control Activities', watchtowerFeature: 'Full audit log, login tracking, admin actions, API key usage', status: 'automated' },
      { id: 'CC5.2', name: 'Segregation of Duties', category: 'Control Activities', watchtowerFeature: 'RBAC (admin/analyst/viewer), team management, per-tenant isolation', status: 'automated' },
    ],
  },
  iso27001: {
    name: 'ISO 27001:2022',
    controls: [
      { id: 'A.5.24', name: 'Incident Management Planning', category: 'Incident Management', watchtowerFeature: 'Custom runbooks, incident creation, response playbooks, escalation via SLA', status: 'automated' },
      { id: 'A.5.25', name: 'Assessment of Security Events', category: 'Incident Management', watchtowerFeature: 'AI triage with confidence scoring, auto-close FPs, severity classification', status: 'automated' },
      { id: 'A.5.26', name: 'Response to Incidents', category: 'Incident Management', watchtowerFeature: 'Device isolation, IOC search, investigation creation, incident timeline', status: 'automated' },
      { id: 'A.5.27', name: 'Learning from Incidents', category: 'Incident Management', watchtowerFeature: 'Incident timeline with notes, shift handover reports, noise reduction metrics', status: 'supported' },
      { id: 'A.8.7', name: 'Protection Against Malware', category: 'Technology', watchtowerFeature: 'EDR monitoring (Defender/CrowdStrike), AI alert analysis, live threat intel feeds', status: 'automated' },
      { id: 'A.8.8', name: 'Vulnerability Management', category: 'Technology', watchtowerFeature: 'Tenable integration — scan, prioritise by VPR, track remediation, compliance checks', status: 'automated' },
      { id: 'A.8.15', name: 'Logging', category: 'Technology', watchtowerFeature: 'Centralised alert feed, audit logging, per-tenant data isolation in Redis', status: 'automated' },
      { id: 'A.8.16', name: 'Monitoring Activities', category: 'Technology', watchtowerFeature: 'Real-time posture score, live alert stream, TV wall mode, daily email digests', status: 'automated' },
      { id: 'A.5.1', name: 'Information Security Policies', category: 'Organisational', watchtowerFeature: 'Policy documentation support via PDF reports, compliance dashboards', status: 'manual' },
      { id: 'A.8.5', name: 'Secure Authentication', category: 'Technology', watchtowerFeature: '2FA/TOTP, PBKDF2 password hashing, rate limiting, session management', status: 'automated' },
      { id: 'A.5.23', name: 'Cloud Service Security', category: 'Organisational', watchtowerFeature: 'Zscaler ZIA/ZPA monitoring, cloud asset coverage tracking', status: 'supported' },
      { id: 'A.8.1', name: 'User Endpoint Devices', category: 'Technology', watchtowerFeature: 'Agent coverage tracking, stale device detection, OS breakdown, endpoint inventory', status: 'automated' },
    ],
  },
};

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const url = new URL(req.url);
  const framework = url.searchParams.get('framework') || 'soc2';

  const fw = FRAMEWORKS[framework];
  if (!fw) return NextResponse.json({ error: 'Unknown framework', available: Object.keys(FRAMEWORKS) }, { status: 400 });

  let enabledTools: string[] = [];
  let hasRunbooks = false, hasIncidents = false, hasSLA = false;

  if (tenantId) {
    try {
      const configs = await loadTenantConfigs(tenantId);
      enabledTools = Object.values(configs.tools || {}).filter((t: any) => t.enabled).map((t: any) => t.id);
      hasRunbooks = ((configs as any).customRunbooks || []).length > 0;
      hasIncidents = ((configs as any).incidents || []).length > 0;
      hasSLA = ((configs as any).slaTracking || []).length > 0;
    } catch(e) {}
  }

  const demo = await isDemoMode(tenantId);
  const controls = fw.controls.map(ctrl => ({
    ...ctrl,
    statusLabel: ctrl.status === 'automated' ? 'Automated by Watchtower' : ctrl.status === 'supported' ? 'Supported — needs configuration' : 'Manual process required',
    statusColor: ctrl.status === 'automated' ? 'green' : ctrl.status === 'supported' ? 'amber' : 'red',
  }));

  const automated = controls.filter(c => c.status === 'automated').length;
  const supported = controls.filter(c => c.status === 'supported').length;
  const manual = controls.filter(c => c.status === 'manual').length;

  return NextResponse.json({
    framework, name: fw.name, controls, totalControls: controls.length,
    automated, supported, manual,
    coveragePct: Math.round((automated + supported * 0.5) / controls.length * 100),
    enabledTools, demo,
    available: Object.keys(FRAMEWORKS),
  });
}
