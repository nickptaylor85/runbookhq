import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
import { getTenantFromRequest } from '@/lib/config-store';
async function getAnthropicKeyFromRedis(): Promise<string|null> {
  try { const c = await loadToolConfigs(tenantId || undefined); return c.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || null; } catch { return null; }
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { alert, question, context } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY || await getAnthropicKeyFromRedis();

  if (!apiKey) {
    return NextResponse.json({ demo: true, response: generateDemoResponse(alert, question) });
  }

  try {
    const systemPrompt = `You are a senior SOC analyst AI co-pilot embedded in a security operations dashboard. You have access to alerts from Microsoft Defender (MDE + XDR), Secureworks Taegis, Tenable, Zscaler ZIA/ZPA, CrowdStrike, SentinelOne, and Darktrace.

Be concise, tactical, and actionable. Use bullet points. Prioritise: what is this, how bad is it, what to do next. Reference MITRE ATT&CK techniques where relevant.`;

    const userMsg = alert
      ? `Alert context:
Title: ${alert.title}
Source: ${alert.source}
Severity: ${alert.severity}
Status: ${alert.status}
Device: ${alert.device || 'N/A'}
User: ${alert.user || 'N/A'}
MITRE: ${alert.mitre || 'N/A'}
Time: ${alert.timestamp}
Category: ${alert.category || 'N/A'}

${question || 'Analyse this alert. What is it, how serious is it, and what should I do next?'}`
      : question || 'Summarise the current security posture.';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: context ? `Dashboard context:\n${context}\n\n${userMsg}` : userMsg }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || 'No response generated.';
    return NextResponse.json({ response: text, demo: false });
  } catch (e) {
    return NextResponse.json({ response: generateDemoResponse(alert, question), demo: true, error: (e as Error).message });
  }
}

function generateDemoResponse(alert: any, question: string): string {
  if (!alert) return '**Security Posture Summary**\n\n- 3 active incidents, 2 critical\n- MTTR trending down (32min, target 30min) — good progress\n- 2 critical CVEs on internet-facing assets need urgent patching\n- ZIA blocked 4,280 threats in 24h — defences holding\n- Coverage gap: 8 devices missing agents, 2 are OT (accepted risk)\n\n**Priority actions:**\n1. Investigate credential dumping on SRV-DC01 — potential domain compromise\n2. Patch CVE-2024-3400 on VPN gateways (CVSS 10.0, actively exploited)\n3. Review C2 beacon from WS042 — may be related to DC01 incident';

  const responses: Record<string, string> = {
    'critical': `**🔴 Critical Alert Analysis**\n\n**What:** ${alert.title}\n**MITRE:** ${alert.mitre || 'Requires mapping'}\n**Risk:** HIGH — This indicates active adversary presence.\n\n**Immediate actions:**\n1. Isolate ${alert.device || 'affected device'} from the network\n2. Check for lateral movement from this host in last 4 hours\n3. Review ${alert.user || 'associated user'} account for compromise indicators\n4. Preserve memory dump and event logs before remediation\n5. Escalate to incident commander\n\n**Related checks:**\n- Search for ${alert.device || 'this host'} across Taegis, Defender, and Zscaler logs\n- Check if this IP/hash appears in Recorded Future\n- Verify no data exfiltration via Zscaler DLP`,
    'high': `**🟠 High Severity Analysis**\n\n**What:** ${alert.title}\n**Source:** ${alert.source}\n\n**Assessment:** Likely ${alert.category || 'malicious activity'} requiring investigation within SLA.\n\n**Next steps:**\n1. Triage: verify if this is a true positive\n2. Check ${alert.device || 'endpoint'} for additional IOCs\n3. Review user ${alert.user || 'account'} recent activity\n4. Document findings in incident journal\n5. Escalate if lateral movement confirmed`,
  };

  return responses[alert.severity] || `**Alert Analysis: ${alert.title}**\n\nSeverity: ${alert.severity}\nSource: ${alert.source}\n\nThis appears to be a ${alert.severity}-level ${alert.category || 'security'} event. Review the alert details, check for related activity across your tool stack, and follow your standard triage procedure.`;
}
