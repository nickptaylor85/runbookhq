import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
async function getAnthropicKeyFromRedis(): Promise<string|null> {
  try { const c = await loadToolConfigs(); return c.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || null; } catch { return null; }
}
import { DEMO_DEFENDER_ALERTS, DEMO_TAEGIS_ALERTS, DEMO_METRICS, DEMO_COVERAGE, DEMO_TENABLE_VULNS } from '@/lib/demo-data';
export async function POST(req: Request) {
  const { query } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY || await getAnthropicKeyFromRedis();
  const allAlerts = [...DEMO_DEFENDER_ALERTS, ...DEMO_TAEGIS_ALERTS];
  if (!apiKey) return NextResponse.json({ demo: true, ...demoQ(query, allAlerts) });
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, system: 'You are a SOC query engine. Answer using the provided data. Return JSON: { "answer": "summary", "results": [items], "query_interpreted": "what you searched", "count": number }',
        messages: [{ role: 'user', content: `Data: ${JSON.stringify({alerts:allAlerts,metrics:DEMO_METRICS})}\n\nQuery: ${query}` }] }) });
    const data = await res.json(); const text = data.content?.[0]?.text || '{}';
    try { return NextResponse.json({ demo: false, ...JSON.parse(text.replace(/```json|```/g,'').trim()) }); } catch { return NextResponse.json({ demo: false, answer: text, results: [], count: 0 }); }
  } catch (e) { return NextResponse.json({ demo: true, ...demoQ(query, allAlerts) }); }
}
function demoQ(q: string, alerts: any[]) {
  const ql = q.toLowerCase(); let results = alerts; let interp = q;
  if (ql.includes('critical')) { results = alerts.filter(a => a.severity === 'critical'); interp = 'Critical alerts'; }
  else if (ql.includes('high')) { results = alerts.filter(a => a.severity === 'high'); interp = 'High alerts'; }
  else if (ql.includes('defender')) { results = alerts.filter(a => a.source.includes('Defender')); interp = 'Defender alerts'; }
  else if (ql.includes('taegis')) { results = alerts.filter(a => a.source.includes('Taegis')); interp = 'Taegis alerts'; }
  else if (ql.includes('powershell')||ql.includes('t1059')) { results = alerts.filter(a => a.mitre?.includes('T1059') || a.title.toLowerCase().includes('powershell')); interp = 'PowerShell alerts'; }
  else if (ql.includes('lateral')) { results = alerts.filter(a => a.category?.includes('Lateral')); interp = 'Lateral movement'; }
  else if (ql.includes('credential')||ql.includes('brute')) { results = alerts.filter(a => a.category?.includes('Credential') || a.title.toLowerCase().includes('brute')); interp = 'Credential attacks'; }
  return { answer: `Found ${results.length} results`, results, count: results.length, query_interpreted: interp };
}
