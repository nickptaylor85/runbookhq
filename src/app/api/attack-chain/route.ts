import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';

export async function GET() {
  const configs = await loadToolConfigs();
  const apiKey = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ nodes: [], edges: [], noData: true, reason: 'No Anthropic API key' });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 600,
        system: 'Return ONLY valid JSON. No markdown. Generate a realistic attack chain graph for an enterprise SOC dashboard. Format: {"nodes":[{"id":"ID","type":"device|user|ip","label":"name","sev":"critical|high|medium"}],"edges":[{"from":"ID","to":"ID","label":"action","sev":"critical|high","mitre":"T1234"}]}. Use 6-8 nodes and 5-7 edges showing a realistic attack path.',
        messages: [{ role: 'user', content: 'Generate an attack chain showing a phishing-to-lateral-movement-to-exfiltration scenario.' }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ ...parsed, demo: false });
      }
    } catch {}
    return NextResponse.json({ nodes: [], edges: [], error: 'Parse failed' });
  } catch (e) {
    return NextResponse.json({ nodes: [], edges: [], error: String(e) });
  }
}
