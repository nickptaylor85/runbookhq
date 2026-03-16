import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
import { tenableAPI, tenableHeaders, getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { query } = await req.json();
  const configs = await loadToolConfigs();
  const apiKey = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ answer: 'Configure Anthropic API key to use NL Query', results: [] });

  // Gather context from real sources
  let context = '';
  const headers = await tenableHeaders();
  if (headers) {
    try {
      const vulnData = await tenableAPI('/workbenches/vulnerabilities?date_range=30');
      const vulns = vulnData.vulnerabilities || [];
      context += `Tenable: ${vulns.length} vulns (${vulns.filter((v:any)=>v.severity===4).length} critical, ${vulns.filter((v:any)=>v.severity===3).length} high). Top: ${vulns.slice(0,5).map((v:any)=>v.plugin_name).join('; ')}. `;
    } catch {}
  }
  const taegisAuth = await getTaegisToken();
  if (taegisAuth) {
    try {
      const data = await taegisGraphQL(`query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.4 EARLIEST=-7d", offset: 0, limit: 5 }) { alerts { total_results list { id metadata { title severity } } } } }`, {}, taegisAuth.token, taegisAuth.base);
      const total = data.data?.alertsServiceSearch?.alerts?.total_results || 0;
      const list = data.data?.alertsServiceSearch?.alerts?.list || [];
      context += `Taegis: ${total} critical+high alerts in 24h. Recent: ${list.map((a:any)=>a.metadata?.title).join('; ')}. `;
    } catch {}
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300,
        system: 'You are a SOC query assistant. Answer questions about the security data provided. Be concise.',
        messages: [{ role: 'user', content: `Security data context: ${context || 'No tools connected.'}\n\nUser query: ${query}` }] }),
    });
    const data = await res.json();
    const text = (data.content || []).filter((b:any) => b.type === 'text').map((b:any) => b.text).join('');
    return NextResponse.json({ answer: text, results: [], demo: false });
  } catch (e) {
    return NextResponse.json({ answer: 'Query failed: ' + String(e), results: [] });
  }
}
