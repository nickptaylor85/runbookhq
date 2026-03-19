import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
import { getTenantFromRequest } from '@/lib/config-store';
import { tenableAPI, tenableHeaders, getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  if (await isDemoMode(getTenantFromRequest(req).tenantId)) {
    return NextResponse.json({ handover: '🔄 SHIFT HANDOVER — ' + new Date().toLocaleString() + '\n\n**Outgoing:** Day Shift (08:00-16:00)\n**Incoming:** Night Shift (16:00-00:00)\n\n**Active Incidents:**\n• INC-2024-0847 (P1) — Active APT campaign. WS042 and WS015 isolated. admin_svc disabled. C2 IP blocked. Awaiting forensic analysis results.\n\n**Open Items:**\n1. Monitor WS088 for additional ransomware indicators — EDR rolled back initial encryption\n2. Tenable scan running on DMZ — results expected by 18:00\n3. Contractor access review pending — 3 accounts flagged for excessive permissions\n4. Vendor callback expected from Secureworks re: Taegis agent deployment on Mac fleet\n\n**Resolved This Shift:**\n• Phishing campaign targeting finance team — 12 emails quarantined, sender domain blocked\n• VPN brute force from Eastern European IP range — blocked at firewall, monitoring continues\n• Zscaler ZIA blocked 1,247 threats including 3 DLP violations\n\n**AI Triage Summary:** 285 alerts processed, 247 auto-closed (87% FP rate), 38 escalated. 33 analyst hours saved.', demo: true });
  }
  const { tenantId } = getTenantFromRequest(req);
  const configs = await loadToolConfigs(tenantId || undefined);
  const apiKey = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

  // Gather real data
  let context = '';
  const headers = await tenableHeaders(tenantId || undefined);
  if (headers) {
    try {
      const d = await tenableAPI('/workbenches/vulnerabilities?date_range=1');
      context += `Tenable (24h): ${d.vulnerabilities?.length || 0} vulns found. Critical: ${d.vulnerabilities?.filter((v:any)=>v.severity===4).length || 0}. `;
    } catch(e) {}
  }
  const taegisAuth = await getTaegisToken(tenantId || undefined);
  if (taegisAuth) {
    try {
      const d = await taegisGraphQL(`query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.3 EARLIEST=-8h", offset: 0, limit: 1 }) { alerts { total_results } } }`, {}, taegisAuth.token, taegisAuth.base);
      context += `Taegis (8h shift): ${d.data?.alertsServiceSearch?.alerts?.total_results || 0} alerts. `;
    } catch(e) {}
  }

  if (!apiKey) return NextResponse.json({ summary: 'Configure Anthropic API key for shift handover summaries', items: [] });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500,
        system: 'You are a SOC shift handover assistant. Generate a brief shift handover summary with 4-6 bullet items. Return ONLY a JSON object: {"summary":"1 sentence overview","items":[{"status":"open|resolved|monitoring","title":"item title","detail":"1 sentence","priority":"critical|high|medium"}]}. No markdown.',
        messages: [{ role: 'user', content: `Generate shift handover for the last 8 hours. Real data: ${context || 'No tool data available.'}` }] }),
    });
    const data = await res.json();
    const text = (data.content || []).filter((b:any) => b.type === 'text').map((b:any) => b.text).join('');
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return NextResponse.json({ ...parsed, demo: false });
    } catch(e) { return NextResponse.json({ summary: text.substring(0, 200), items: [] }); }
  } catch (e) { return NextResponse.json({ summary: 'Handover generation failed', items: [], error: String(e) }); }
}
