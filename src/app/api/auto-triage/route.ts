import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
import { getTenantFromRequest } from '@/lib/config-store';

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { alerts } = await req.json();
  const configs = await loadToolConfigs(tenantId || undefined);
  const apiKey = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey || !alerts?.length) {
    return NextResponse.json({ alerts: alerts || [] });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 600,
        system: 'You are a SOC triage engine. For each alert, return a JSON array of objects with: {"id":"alert_id","triage":{"confidence":85,"verdict":"true_positive|false_positive|suspicious","reasoning":"1 sentence","recommended_action":"1 sentence"}}. Return ONLY the JSON array.',
        messages: [{ role: 'user', content: `Triage these alerts: ${JSON.stringify(alerts.slice(0, 10).map((a: any) => ({ id: a.id, title: a.title, severity: a.severity, source: a.source, device: a.device })))}` }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    try {
      const triaged = JSON.parse(text.replace(/```json|```/g, '').trim());
      const triageMap: Record<string, any> = {};
      triaged.forEach((t: any) => { triageMap[t.id] = t.triage; });
      return NextResponse.json({ alerts: alerts.map((a: any) => ({ ...a, triage: triageMap[a.id] || null })), demo: false });
    } catch { return NextResponse.json({ alerts }); }
  } catch { return NextResponse.json({ alerts }); }
}
