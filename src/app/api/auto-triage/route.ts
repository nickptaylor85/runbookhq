import { NextResponse } from 'next/server';
import { loadToolConfigs, loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const body = await req.json();
  const alerts = body.alerts || [];
  if (!alerts.length) return NextResponse.json({ alerts: [], actions: [] });

  // Check demo mode
  const { isDemoMode } = await import('@/lib/demo-check');
  if (await isDemoMode(tenantId)) return demoTriage(alerts);

  const configs = await loadToolConfigs(tenantId || undefined);
  const apiKey = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return demoTriage(alerts);

  // ═══ STEP 1: ENRICH — build context for each alert ═══
  const enriched = alerts.slice(0, 20).map((a: any, i: number) => {
    const deviceAlerts = alerts.filter((x: any) => x.device && x.device === a.device && x.id !== a.id);
    const userAlerts = alerts.filter((x: any) => x.user && x.user === a.user && x.id !== a.id);
    return {
      id: a.id, title: a.title, severity: a.severity, source: a.source,
      device: a.device, user: a.user, mitre: a.mitre, timestamp: a.timestamp,
      context: {
        deviceAlertCount: deviceAlerts.length,
        deviceAlertTitles: deviceAlerts.slice(0, 3).map((x: any) => x.title),
        userAlertCount: userAlerts.length,
        isServiceAccount: /^(admin_|svc_|service|system|backup)/i.test(a.user || ''),
        isOffHours: new Date(a.timestamp).getHours() < 7 || new Date(a.timestamp).getHours() > 19,
        minutesAgo: Math.round((Date.now() - new Date(a.timestamp).getTime()) / 60000),
      },
    };
  });

  // ═══ STEP 2: AI TRIAGE — structured prompt for consistent output ═══
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 2000,
        system: `You are an expert SOC analyst working inside the Watchtower SOAR platform. You triage security alerts with the precision of a 10-year veteran.

For each alert, you MUST return a JSON object with:
- "verdict": "tp" (true positive — real threat) | "fp" (false positive — benign) | "suspicious" (needs investigation)
- "confidence": 0-100 (your confidence in the verdict)
- "reasoning": 2-3 sentences explaining WHY. Reference the specific evidence: device history, user behaviour, MITRE technique, time of day, correlation with other alerts.
- "evidence": array of 1-3 specific facts that support your verdict (e.g. "Device has 3 other alerts in this batch", "Service account running at 3am", "T1003.001 is a high-fidelity technique")
- "actions": array of recommended actions. Use exact strings from: "auto_close", "escalate_incident", "isolate_device", "disable_user", "notify_slack", "monitor_24h", "block_ip", "run_scan"
- "runbook": 3-5 specific response steps for this exact alert type

CRITICAL RULES:
- T1003 (Credential Access), T1486 (Ransomware), T1071 (C2) are almost always TP — be suspicious of FP here
- Alerts on domain controllers and mail gateways are HIGH priority regardless of severity label
- Service accounts running unusual processes outside business hours = likely TP
- Multiple alerts on same device in short timeframe = likely attack chain, escalate
- Known FP patterns: AV scan triggers, backup software, Windows Update, SCCM deployments

Return ONLY a JSON array. No markdown, no explanation outside the JSON.`,
        messages: [{ role: 'user', content: JSON.stringify(enriched) }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const triaged = JSON.parse(text.replace(/```json|```/g, '').trim());

    // ═══ STEP 3: AUTO-ACTIONS ═══
    const actions: any[] = [];
    const triageMap: Record<string, any> = {};
    const tenantConfigs = tenantId ? await loadTenantConfigs(tenantId) : null;

    triaged.forEach((t: any, i: number) => {
      const alert = enriched.find((a: any) => a.id === t.id) || enriched[i];
      if (!alert) return;
      triageMap[alert.id] = t;

      // Auto-close FPs above 95% confidence
      if (t.verdict === 'fp' && t.confidence >= 95) {
        actions.push({ type: 'auto_close', alertId: alert.id, reason: t.reasoning });
      }

      // Auto-escalate critical TPs
      if (t.verdict === 'tp' && (alert.severity === 'critical' || t.confidence >= 90)) {
        actions.push({ type: 'escalate_incident', alertId: alert.id, title: alert.title, severity: alert.severity });
        if (t.actions?.includes('notify_slack')) {
          actions.push({ type: 'notify_slack', alertId: alert.id, message: alert.title });
        }
        if (t.actions?.includes('isolate_device') && alert.device) {
          actions.push({ type: 'recommend_isolate', alertId: alert.id, device: alert.device });
        }
      }
    });

    // ═══ STEP 4: RECORD STATS ═══
    if (tenantConfigs && tenantId) {
      const nr = (tenantConfigs as any).noiseReduction?.stats || { totalProcessed: 0, autoClosed: 0, escalated: 0, timeSavedMins: 0 };
      const fpCount = triaged.filter((t: any) => t.verdict === 'fp' && t.confidence >= 95).length;
      const tpCount = triaged.filter((t: any) => t.verdict === 'tp').length;
      nr.totalProcessed += triaged.length;
      nr.autoClosed += fpCount;
      nr.escalated += tpCount;
      nr.timeSavedMins += fpCount * 8;
      (tenantConfigs as any).noiseReduction = { ...((tenantConfigs as any).noiseReduction || {}), stats: nr };
      await saveTenantConfigs(tenantId, tenantConfigs as any);
    }

    // ═══ STEP 5: EXECUTE NOTIFICATIONS ═══
    for (const action of actions) {
      if (action.type === 'notify_slack') {
        const slackUrl = configs.tools?.slack_webhook?.credentials?.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
        const teamsUrl = configs.tools?.teams_webhook?.credentials?.TEAMS_WEBHOOK_URL || process.env.TEAMS_WEBHOOK_URL;
        const webhookUrl = slackUrl || teamsUrl;
        if (webhookUrl) {
          fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '🚨 *AUTO-ESCALATED* — ' + action.message }) }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      alerts: alerts.map((a: any) => ({ ...a, triage: triageMap[a.id] || null })),
      actions,
      stats: { total: triaged.length, tp: triaged.filter((t: any) => t.verdict === 'tp').length, fp: triaged.filter((t: any) => t.verdict === 'fp').length, suspicious: triaged.filter((t: any) => t.verdict === 'suspicious').length, autoClosed: actions.filter(a => a.type === 'auto_close').length, escalated: actions.filter(a => a.type === 'escalate_incident').length },
    });
  } catch(e) {
    return NextResponse.json({ alerts, actions: [], error: String(e) });
  }
}

/* ═══ DEMO TRIAGE — tells the "Operation Midnight" story ═══ */
function demoTriage(alerts: any[]) {
  const DEMO_TRIAGE: Record<string, any> = {
    'phish': { verdict: 'tp', confidence: 96, reasoning: 'Weaponised Office macro delivered to finance team. Sender domain registered 48h ago. Attachment hash matches known Emotet dropper from ThreatFox feed. 12 recipients targeted simultaneously — hallmark of spear-phishing campaign.', evidence: ['Domain registered <48h ago', 'Hash on ThreatFox IOC feed', '12 simultaneous targets'], actions: ['escalate_incident', 'notify_slack'], runbook: ['Quarantine email from all 12 mailboxes', 'Block sender domain at mail gateway', 'Check if any user opened the attachment', 'If opened: isolate device + capture memory dump', 'Report domain to abuse contact'] },
    'powershell': { verdict: 'tp', confidence: 94, reasoning: 'Base64-encoded PowerShell launched from outlook.exe child process — classic phishing execution chain. Decoded payload downloads secondary binary from external IP matching known C2 infrastructure. This is NOT a scheduled task or admin script.', evidence: ['Parent process: outlook.exe (phishing vector)', 'Base64 obfuscation = evasion intent', 'Download URL on C2 blocklist'], actions: ['escalate_incident', 'isolate_device', 'notify_slack'], runbook: ['Isolate WS042 from network immediately', 'Capture process tree and memory dump', 'Decode base64 payload for IOC extraction', 'Block C2 IP at firewall and ZIA', 'Check for persistence mechanisms (Run keys, scheduled tasks)'] },
    'c2': { verdict: 'tp', confidence: 97, reasoning: 'Outbound beacon to 185.220.101.42 every 60 seconds — textbook Cobalt Strike jitter pattern. This IP is listed on 4 threat intel feeds. Device WS015 has no legitimate reason to contact this IP. Combined with the PowerShell alert 3 minutes prior on a different host, this is an active compromise.', evidence: ['IP on 4 threat feeds (ThreatFox, URLhaus, CINS, Talos)', '60s beacon interval = Cobalt Strike default', 'Correlates with T1059.001 alert from 3min ago'], actions: ['escalate_incident', 'isolate_device', 'block_ip', 'notify_slack'], runbook: ['Isolate WS015 immediately', 'Block 185.220.101.42 at perimeter firewall + ZIA', 'Search proxy logs for all devices contacting this IP', 'Capture network traffic for beacon analysis', 'Correlate with credential alerts — likely same campaign'] },
    'lsass': { verdict: 'tp', confidence: 98, reasoning: 'LSASS memory access on a DOMAIN CONTROLLER by a service account that ran PowerShell 8 minutes ago on a different host. This is credential harvesting — likely Mimikatz or comsvcs.dll MiniDump. Critical: if credentials are extracted from DC01, the attacker has domain admin. This is the highest priority alert.', evidence: ['Domain controller targeted', 'Service account used across multiple hosts', 'T1003.001 is an extremely high-fidelity detection'], actions: ['escalate_incident', 'disable_user', 'notify_slack'], runbook: ['Emergency: rotate krbtgt password TWICE', 'Disable admin_svc account immediately', 'Check for golden ticket creation', 'Audit all admin_svc logons in past 24h', 'Engage IR retainer — this may be a domain compromise'] },
    'brute': { verdict: 'suspicious', confidence: 72, reasoning: '47 failed authentication attempts is above threshold, but the source IP is a known corporate VPN endpoint in Eastern Europe where your company has a satellite office. Could be a misconfigured service, a legitimate employee with a stuck password, or a genuine brute force. Need more context.', evidence: ['Source IP is in a country with company presence', 'No successful auth after failures = less likely compromise', 'Pattern suggests automated tool, not manual attempts'], actions: ['monitor_24h'], runbook: ['Check if source IP matches known employee VPN', 'Contact local IT team for the satellite office', 'If unrecognised: block IP and force password reset for targeted accounts', 'Review successful logins from this IP range in past 30 days'] },
    'exfil': { verdict: 'tp', confidence: 91, reasoning: 'Anomalous 2.4GB transfer from a contractor account that normally transfers <50MB/day. Destination IP is outside your known business partners. Combined with the lateral movement alerts earlier today, this looks like data staging and exfiltration from a compromised contractor account.', evidence: ['Transfer volume 48x normal baseline', 'Contractor account = limited expected activity', 'Correlates with lateral movement chain from earlier'], actions: ['escalate_incident', 'disable_user', 'block_ip', 'notify_slack'], runbook: ['Block destination IP immediately', 'Disable contractor-ext account', 'Identify what files were transferred (DLP logs)', 'Check if data was encrypted before transfer', 'Notify data protection officer if PII involved'] },
    'lateral': { verdict: 'tp', confidence: 89, reasoning: 'SMB lateral movement from admin_svc account — the same account flagged in the LSASS credential dump. The attacker has pivoted from the compromised workstation to the file server. This is stage 4 of the attack chain: initial access → execution → credential access → lateral movement.', evidence: ['admin_svc already flagged in credential dump', 'SMB to file server follows expected attack progression', 'Same campaign — 4 correlated alerts in 40 minutes'], actions: ['escalate_incident', 'isolate_device', 'notify_slack'], runbook: ['Isolate FS01 from network', 'Check for ransomware indicators (mass file renames, .encrypted extensions)', 'Audit SMB sessions on FS01 in past hour', 'Snapshot the file server for forensics', 'Confirm admin_svc is disabled'] },
    'ransomware': { verdict: 'tp', confidence: 99, reasoning: 'Mass file encryption detected on WS088 — file extensions changing to .locked, shadow copies being deleted, ransom note HTML being written. This is active ransomware execution. The 99% confidence is because EDR behavioural detection for mass encryption has near-zero false positive rate. Every second counts.', evidence: ['Mass file extension changes (.locked)', 'Shadow copy deletion (vssadmin) = anti-recovery', 'Ransom note generation confirmed by EDR'], actions: ['escalate_incident', 'isolate_device', 'notify_slack'], runbook: ['IMMEDIATE: isolate WS088 from ALL networks', 'Do NOT power off — preserve memory for encryption key recovery', 'Check for network shares mounted by this device', 'Assess blast radius — how many files encrypted', 'Activate incident response plan — this is a P1'] },
    'mfa': { verdict: 'suspicious', confidence: 68, reasoning: 'MFA fatigue attacks are a known technique (Uber breach 2022), but this could also be a user who genuinely cannot log in and is requesting MFA pushes. 23 pushes in 10 minutes is above normal but not definitive. Key question: did the user eventually approve a push? If yes, likely compromised.', evidence: ['23 MFA pushes = above threshold for normal usage', 'T1621 technique well-documented (Uber, Twilio)', 'No confirmed approval yet'], actions: ['monitor_24h', 'notify_slack'], runbook: ['Check if any MFA push was approved', 'If approved: treat as compromised, revoke sessions, reset MFA', 'If not approved: contact user via known phone number', 'Enforce number matching MFA if available', 'Block further MFA pushes temporarily'] },
    'kerber': { verdict: 'tp', confidence: 95, reasoning: 'Kerberoasting on the domain controller using the same admin_svc account. The attacker is requesting TGS tickets for service accounts to crack offline. This follows the LSASS dump by 11 minutes — classic privilege escalation sequence. If they crack a service account with admin rights, they have persistent access even after you change passwords.', evidence: ['Follows LSASS dump by 11 minutes — same campaign', 'admin_svc account already confirmed compromised', 'Kerberoasting targets service accounts for offline cracking'], actions: ['escalate_incident', 'notify_slack'], runbook: ['Identify all service accounts that had TGS tickets requested', 'Force password rotation on ALL targeted service accounts', 'Use 25+ character random passwords for service accounts', 'Enable AES256 only for Kerberos (disable RC4)', 'Deploy honeypot service accounts for detection'] },
    'dns': { verdict: 'tp', confidence: 86, reasoning: 'DNS query sizes averaging 180 bytes vs normal 40 bytes indicates data being encoded in DNS queries — a classic C2 and exfiltration channel. The destination is a dynamic DNS provider commonly used by threat actors. This bypasses web proxy controls because DNS is often allowed unrestricted.', evidence: ['Query size 4.5x normal average', 'Dynamic DNS destination = suspicious infrastructure', 'DNS tunnelling bypasses web proxy controls'], actions: ['escalate_incident', 'block_ip'], runbook: ['Block the dynamic DNS domain at DNS resolver', 'Capture DNS traffic from WS042 for analysis', 'Check if this correlates with the C2 beacon on WS015', 'Review DNS logs for other devices querying this domain', 'Consider deploying DNS-over-HTTPS inspection'] },
  };

  const keys = ['phish', 'powershell', 'c2', 'lsass', 'brute', 'exfil', 'lateral', 'ransomware', 'mfa', 'kerber', 'dns'];
  const results = alerts.map((a: any, i: number) => {
    const key = a.title?.toLowerCase().includes('phish') ? 'phish' : a.title?.toLowerCase().includes('powershell') ? 'powershell' : a.title?.toLowerCase().includes('c2') || a.title?.toLowerCase().includes('beacon') ? 'c2' : a.title?.toLowerCase().includes('lsass') || a.title?.toLowerCase().includes('credential dump') ? 'lsass' : a.title?.toLowerCase().includes('brute') ? 'brute' : a.title?.toLowerCase().includes('exfil') || a.title?.toLowerCase().includes('data transfer') ? 'exfil' : a.title?.toLowerCase().includes('lateral') || a.title?.toLowerCase().includes('smb') ? 'lateral' : a.title?.toLowerCase().includes('ransom') || a.title?.toLowerCase().includes('encryption') ? 'ransomware' : a.title?.toLowerCase().includes('mfa') || a.title?.toLowerCase().includes('fatigue') ? 'mfa' : a.title?.toLowerCase().includes('kerber') ? 'kerber' : a.title?.toLowerCase().includes('dns') || a.title?.toLowerCase().includes('tunnel') ? 'dns' : keys[i % keys.length];
    const t = DEMO_TRIAGE[key] || DEMO_TRIAGE[keys[i % keys.length]];
    return { ...a, triage: t };
  });

  const actions: any[] = [];
  results.forEach(r => {
    if (r.triage.verdict === 'fp' && r.triage.confidence >= 95) actions.push({ type: 'auto_close', alertId: r.id, reason: r.triage.reasoning });
    if (r.triage.verdict === 'tp' && (r.severity === 'critical' || r.triage.confidence >= 90)) {
      actions.push({ type: 'escalate_incident', alertId: r.id, title: r.title, severity: r.severity });
      actions.push({ type: 'notify_slack', alertId: r.id, message: r.title });
    }
  });

  return NextResponse.json({
    alerts: results,
    actions,
    stats: { total: results.length, tp: results.filter(r => r.triage.verdict === 'tp').length, fp: results.filter(r => r.triage.verdict === 'fp').length, suspicious: results.filter(r => r.triage.verdict === 'suspicious').length, autoClosed: actions.filter(a => a.type === 'auto_close').length, escalated: actions.filter(a => a.type === 'escalate_incident').length },
    demo: true,
    processingTime: '3.2s',
  });
}
