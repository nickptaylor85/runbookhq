import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
async function getAnthropicKeyFromRedis(): Promise<string|null> {
  try { const c = await loadToolConfigs(); return c.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || null; } catch { return null; }
}

export async function POST(req: Request) {
  const { metrics, alerts, coverage, vulns } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY || await getAnthropicKeyFromRedis();

  const context = `Current SOC Dashboard State:
- Alerts (24h): ${metrics?.alertsLast24h?.total || 0} total, ${metrics?.alertsLast24h?.critical || 0} critical, ${metrics?.alertsLast24h?.high || 0} high
- MTTR: ${metrics?.mttr?.current || 0} min (target: ${metrics?.mttr?.target || 30} min)
- MTTD: ${metrics?.mttd?.current || 0} min (target: ${metrics?.mttd?.target || 10} min)
- Open Incidents: ${metrics?.incidentsOpen || 0}
- SLA Compliance: ${metrics?.slaCompliance || 0}%
- Devices: ${coverage?.totalDevices || 0} total, ${coverage?.gaps?.length || 0} with coverage gaps
- Top alerts: ${(alerts || []).slice(0, 5).map((a: any) => `${a.severity}: ${a.title}`).join('; ')}
- Vulnerability summary: ${vulns?.critical || 0} critical, ${vulns?.high || 0} high CVEs`;

  if (!apiKey) {
    return NextResponse.json({ demo: true, summary: generateDemoSummary(metrics, alerts, coverage) });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: 'You are a CISO-level security briefing generator. Write a concise 3-4 paragraph executive summary suitable for a board or leadership audience. Be factual, highlight risks, and recommend priorities. No bullet points — flowing prose only.',
        messages: [{ role: 'user', content: `Generate an executive security summary from this data:\n\n${context}` }],
      }),
    });
    const data = await res.json();
    return NextResponse.json({ summary: data.content?.[0]?.text || 'Summary generation failed.', demo: false });
  } catch (e) {
    return NextResponse.json({ demo: true, summary: generateDemoSummary(metrics, alerts, coverage), error: (e as Error).message });
  }
}

function generateDemoSummary(m: any, alerts: any[], cov: any): string {
  return `The security operations centre processed ${m?.alertsLast24h?.total || 147} alerts over the past 24 hours, with ${m?.alertsLast24h?.critical || 8} classified as critical and ${m?.alertsLast24h?.high || 34} as high severity. Mean time to respond stands at ${m?.mttr?.current || 32} minutes against a target of ${m?.mttr?.target || 30} minutes — marginally outside SLA but trending positively from last period. Three incidents remain open and under active investigation, including a suspected nation-state intrusion involving credential dumping on a domain controller.

Endpoint coverage across the four primary security tools (Defender, Taegis, Tenable, Zscaler) remains above 95% on managed devices. ${cov?.gaps?.length || 8} devices have been identified with coverage gaps, primarily legacy servers and OT infrastructure where agent deployment is constrained. These represent accepted risk with compensating controls in place.

The vulnerability landscape requires attention: ${m?.alertsLast24h?.critical || 5} critical CVEs affect internet-facing infrastructure, including a CVSS 10.0 VPN gateway vulnerability with confirmed exploitation in the wild. Zscaler web security continues to perform strongly, blocking over 4,200 threats including C2 callbacks and credential phishing attempts. Priority actions for the coming period are: (1) contain and remediate the DC01 credential compromise, (2) emergency patch VPN gateways for CVE-2024-3400, and (3) accelerate Tenable agent rollout to the remaining unscanned endpoints.`;
}
