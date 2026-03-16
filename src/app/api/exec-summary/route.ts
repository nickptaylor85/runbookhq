import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
import { getTenantFromRequest } from '@/lib/config-store';

async function getApiKey(): Promise<string | null> {
  // Check env first, then Redis
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try { const c = await loadToolConfigs(tenantId || undefined); return c.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || null; } catch { return null; }
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { metrics, alerts, coverage, vulns } = await req.json();
  const apiKey = await getApiKey();

  const context = `Current SOC Dashboard State:
- Alerts (24h): ${metrics?.alertsLast24h?.total || 0} total, ${metrics?.alertsLast24h?.critical || 0} critical, ${metrics?.alertsLast24h?.high || 0} high
- MTTR: ${metrics?.mttr?.current || 0} min (target: ${metrics?.mttr?.target || 30} min)
- MTTD: ${metrics?.mttd?.current || 0} min (target: ${metrics?.mttd?.target || 10} min)
- Open Incidents: ${metrics?.incidentsOpen || 0}
- SLA Compliance: ${metrics?.slaCompliance || 0}%
- Devices: ${coverage?.totalDevices || 0} total, ${coverage?.gaps?.length || 0} with coverage gaps
- Top alerts: ${(alerts || []).slice(0, 5).map((a: any) => `${a.severity}: ${a.title}`).join('; ')}`;

  if (!apiKey) {
    return NextResponse.json({ demo: true, summary: demoSummary(metrics, alerts, coverage), _reason: 'No Anthropic API key' });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 500,
        system: 'You are a CISO-level security briefing generator. Write a concise 3-4 paragraph executive summary suitable for leadership. Be factual, highlight risks, recommend priorities. Flowing prose only, no bullet points.',
        messages: [{ role: 'user', content: `Generate an executive security summary:\n\n${context}` }],
      }),
    });
    const data = await res.json();
    if (data.content?.[0]?.text) {
      return NextResponse.json({ summary: data.content[0].text, demo: false });
    }
    return NextResponse.json({ summary: demoSummary(metrics, alerts, coverage), demo: true, _error: data.error || 'No text in response', _raw: JSON.stringify(data).substring(0, 300) });
  } catch (e) {
    return NextResponse.json({ summary: demoSummary(metrics, alerts, coverage), demo: true, _error: String(e) });
  }
}

function demoSummary(m: any, a: any[], c: any): string {
  return `The security operations centre processed ${m?.alertsLast24h?.total || 147} alerts over the past 24 hours, with ${m?.alertsLast24h?.critical || 8} classified as critical and ${m?.alertsLast24h?.high || 34} as high severity. Mean time to respond stands at ${m?.mttr?.current || 32} minutes against a target of ${m?.mttr?.target || 30} minutes. Three incidents remain open and under active investigation, including a suspected credential compromise on a domain controller.\n\nEndpoint coverage across the primary security tools remains above 95% on managed devices. ${c?.gaps?.length || 8} devices have coverage gaps, primarily legacy servers and OT infrastructure. These represent accepted risk with compensating controls in place.\n\nPriority actions for the coming period: (1) contain and remediate the DC01 credential compromise, (2) emergency patch VPN gateways for CVE-2024-3400, and (3) accelerate agent rollout to remaining unscanned endpoints.`;
}
