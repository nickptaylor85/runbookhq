import { NextResponse } from 'next/server';
import { loadTenantConfigs, getTenantFromRequest, loadToolConfigs } from '@/lib/config-store';

const FRAMEWORKS: Record<string, { name: string; controls: { id: string; name: string; category: string; tools: string[]; checks: string[] }[] }> = {
  soc2: {
    name: 'SOC 2 Type II',
    controls: [
      { id: 'CC6.1', name: 'Logical & Physical Access Controls', category: 'Security', tools: ['defender', 'crowdstrike', 'zscaler'], checks: ['2FA enabled', 'RBAC configured', 'Session management'] },
      { id: 'CC6.6', name: 'System Boundary Protection', category: 'Security', tools: ['zscaler', 'defender'], checks: ['Web filtering active', 'DLP policies', 'Firewall rules'] },
      { id: 'CC6.8', name: 'Malicious Software Prevention', category: 'Security', tools: ['defender', 'crowdstrike', 'sentinelone'], checks: ['EDR deployed', 'Real-time scanning', 'Definition updates'] },
      { id: 'CC7.1', name: 'Monitoring & Detection', category: 'Security', tools: ['taegis', 'splunk', 'sentinel'], checks: ['SIEM active', 'Alert rules configured', '24/7 monitoring'] },
      { id: 'CC7.2', name: 'Incident Response', category: 'Security', tools: ['taegis', 'anthropic'], checks: ['IR plan documented', 'Runbooks created', 'SLA tracking active'] },
      { id: 'CC7.3', name: 'Security Event Evaluation', category: 'Security', tools: ['taegis', 'anthropic'], checks: ['AI triage enabled', 'Alert correlation', 'Root cause analysis'] },
      { id: 'CC7.4', name: 'Incident Remediation', category: 'Security', tools: ['taegis', 'defender'], checks: ['Device isolation capability', 'Response actions documented', 'Post-incident review'] },
      { id: 'CC8.1', name: 'Change Management', category: 'Availability', tools: [], checks: ['Change tracking', 'Approval workflows', 'Rollback procedures'] },
      { id: 'CC3.1', name: 'Risk Assessment', category: 'Risk', tools: ['tenable', 'qualys'], checks: ['Vulnerability scanning', 'Risk scoring', 'Remediation tracking'] },
      { id: 'CC3.2', name: 'Risk Mitigation', category: 'Risk', tools: ['tenable'], checks: ['Patch management', 'Vulnerability remediation SLAs', 'Exception process'] },
      { id: 'CC5.1', name: 'Accountability & Control Activities', category: 'Control Activities', tools: [], checks: ['Audit logging', 'Access reviews', 'Segregation of duties'] },
    ],
  },
  iso27001: {
    name: 'ISO 27001:2022',
    controls: [
      { id: 'A.5.1', name: 'Policies for Information Security', category: 'Organizational', tools: [], checks: ['Security policy documented', 'Policy review schedule', 'Staff acknowledgement'] },
      { id: 'A.5.23', name: 'Information Security for Cloud Services', category: 'Organizational', tools: ['zscaler'], checks: ['Cloud access controls', 'Data classification', 'Cloud monitoring'] },
      { id: 'A.6.1', name: 'Screening', category: 'People', tools: [], checks: ['Background checks', 'NDA signed', 'Security awareness training'] },
      { id: 'A.8.1', name: 'User Endpoint Devices', category: 'Technological', tools: ['defender', 'crowdstrike'], checks: ['EDR coverage', 'Encryption enforced', 'Patch compliance'] },
      { id: 'A.8.5', name: 'Secure Authentication', category: 'Technological', tools: ['defender', 'zscaler'], checks: ['MFA enforced', 'Password policy', 'SSO configured'] },
      { id: 'A.8.7', name: 'Protection Against Malware', category: 'Technological', tools: ['defender', 'crowdstrike', 'sentinelone'], checks: ['AV/EDR active', 'Signatures current', 'Behavioral detection'] },
      { id: 'A.8.8', name: 'Management of Technical Vulnerabilities', category: 'Technological', tools: ['tenable', 'qualys', 'rapid7'], checks: ['Regular scanning', 'Remediation SLAs', 'Risk-based prioritisation'] },
      { id: 'A.8.15', name: 'Logging', category: 'Technological', tools: ['taegis', 'splunk', 'sentinel'], checks: ['Centralized logging', 'Log retention', 'Tamper protection'] },
      { id: 'A.8.16', name: 'Monitoring Activities', category: 'Technological', tools: ['taegis', 'splunk'], checks: ['Real-time monitoring', 'Anomaly detection', 'Alert thresholds'] },
      { id: 'A.5.24', name: 'Information Security Incident Management', category: 'Organizational', tools: ['taegis', 'anthropic'], checks: ['Incident process defined', 'Classification scheme', 'Communication plan'] },
      { id: 'A.5.25', name: 'Assessment & Decision on Security Events', category: 'Organizational', tools: ['taegis', 'anthropic'], checks: ['Triage process', 'Escalation criteria', 'Response procedures'] },
      { id: 'A.5.26', name: 'Response to Security Incidents', category: 'Organizational', tools: ['taegis'], checks: ['Response playbooks', 'Containment procedures', 'Evidence preservation'] },
    ],
  },
};

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const url = new URL(req.url);
  const framework = url.searchParams.get('framework') || 'soc2';

  const configs = await loadTenantConfigs(tenantId);
  const enabledTools = Object.values(configs.tools || {}).filter((t: any) => t.enabled).map((t: any) => t.id);

  const fw = FRAMEWORKS[framework];
  if (!fw) return NextResponse.json({ error: 'Unknown framework', available: Object.keys(FRAMEWORKS) }, { status: 400 });

  // Check Watchtower features
  const has2fa = true; // Platform supports it
  const hasRBAC = true;
  const hasSessions = true;
  const hasAudit = true;
  const hasSLA = (configs.slaTracking || []).length > 0;
  const hasRunbooks = (configs.customRunbooks || []).length > 0;
  const hasAI = enabledTools.includes('anthropic');
  const hasIncidents = (configs.incidents || []).length > 0;

  const controls = fw.controls.map(ctrl => {
    const toolsCovered = ctrl.tools.filter(t => enabledTools.includes(t));
    const toolCoverage = ctrl.tools.length > 0 ? Math.round(toolsCovered.length / ctrl.tools.length * 100) : 0;

    // Check Watchtower feature coverage
    let featureChecks = 0;
    let featureTotal = ctrl.checks.length;
    ctrl.checks.forEach(check => {
      const cl = check.toLowerCase();
      if (cl.includes('2fa') && has2fa) featureChecks++;
      else if (cl.includes('rbac') && hasRBAC) featureChecks++;
      else if (cl.includes('session') && hasSessions) featureChecks++;
      else if (cl.includes('audit') && hasAudit) featureChecks++;
      else if (cl.includes('sla') && hasSLA) featureChecks++;
      else if (cl.includes('runbook') && hasRunbooks) featureChecks++;
      else if (cl.includes('ai') && hasAI) featureChecks++;
      else if (cl.includes('triage') && hasAI) featureChecks++;
      else if (cl.includes('incident') && hasIncidents) featureChecks++;
      else if (cl.includes('edr') && enabledTools.some(t => ['defender', 'crowdstrike', 'sentinelone'].includes(t))) featureChecks++;
      else if (cl.includes('siem') && enabledTools.some(t => ['taegis', 'splunk', 'sentinel'].includes(t))) featureChecks++;
      else if (cl.includes('scanning') && enabledTools.some(t => ['tenable', 'qualys', 'rapid7'].includes(t))) featureChecks++;
      else if (cl.includes('monitoring') && enabledTools.some(t => ['taegis', 'splunk', 'sentinel'].includes(t))) featureChecks++;
      else if (cl.includes('log') && enabledTools.some(t => ['taegis', 'splunk', 'sentinel'].includes(t))) featureChecks++;
      else if (cl.includes('isolation') && enabledTools.includes('taegis')) featureChecks++;
      else if (cl.includes('alert') && enabledTools.length > 0) featureChecks++;
      else if (cl.includes('web filter') && enabledTools.includes('zscaler')) featureChecks++;
      else if (cl.includes('dlp') && enabledTools.includes('zscaler')) featureChecks++;
      else if (cl.includes('patch') && enabledTools.includes('tenable')) featureChecks++;
      else if (cl.includes('vuln') && enabledTools.includes('tenable')) featureChecks++;
      else if (cl.includes('mfa') && has2fa) featureChecks++;
      else if (cl.includes('correlat') && hasAI) featureChecks++;
    });

    const coverage = featureTotal > 0 ? Math.round(featureChecks / featureTotal * 100) : toolCoverage;
    const status = coverage >= 80 ? 'covered' : coverage >= 40 ? 'partial' : 'gap';

    return { ...ctrl, toolsCovered, toolCoverage, featureChecks, featureTotal, coverage, status };
  });

  const overall = Math.round(controls.reduce((s, c) => s + c.coverage, 0) / controls.length);
  const covered = controls.filter(c => c.status === 'covered').length;
  const partial = controls.filter(c => c.status === 'partial').length;
  const gaps = controls.filter(c => c.status === 'gap').length;

  return NextResponse.json({ framework, name: fw.name, controls, overall, covered, partial, gaps, totalControls: controls.length, enabledTools, available: Object.keys(FRAMEWORKS) });
}
