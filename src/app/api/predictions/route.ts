import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
import { getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const configs = await loadToolConfigs(tenantId || undefined);
  const apiKey = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ predictions: [], noPredictions: true, reason: 'No Anthropic API key configured' });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 800,
        system: 'You are a SOC predictive analytics engine. Return ONLY a JSON array of 5 predictions based on common security patterns. Each: {"id":"p1","type":"volume|exploit|phishing|coverage|sla","confidence":80,"title":"short title","detail":"1 sentence detail","impact":"1 sentence impact","action":"1 sentence recommended action","timeframe":"Monday|48h|This week|Friday|Tonight","severity":"critical|high|medium","icon":"📈|🔴|🎣|📉|⏱"}. No markdown, no backticks.',
        messages: [{ role: 'user', content: 'Generate 5 realistic SOC predictions for the coming week based on typical enterprise security patterns. Make them actionable and specific.' }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return NextResponse.json({ predictions: JSON.parse(jsonMatch[0]), demo: false });
    } catch {}
    return NextResponse.json({ predictions: [], error: 'Failed to parse predictions' });
  } catch (e) {
    return NextResponse.json({ predictions: [], error: String(e) });
  }
}
