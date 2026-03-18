import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';
import { getTenantFromRequest } from '@/lib/config-store';

export async function POST(req: Request) {
  // Demo mode — return fake triage results
  const { isDemoMode } = await import('@/lib/demo-check');
  const { getTenantFromRequest } = await import('@/lib/config-store');
  const { tenantId } = getTenantFromRequest(req);
  if (await isDemoMode(tenantId)) {
    const body = await req.json();
    const alerts = body.alerts || [];
    const verdicts = ['tp', 'fp', 'suspicious', 'fp', 'fp', 'tp', 'fp', 'suspicious', 'fp', 'fp'];
    const reasons = ['Matches known attack pattern for this MITRE technique. Device has prior alerts.', 'Benign administrative action — scheduled task by IT service account.', 'Unusual but not conclusive. Recommend monitoring for 24h.', 'False positive — legitimate software update process triggered EDR.', 'Known false positive — antivirus scan mimics credential access pattern.', 'True positive — correlates with C2 beacon detected 2h ago on same host.', 'Benign — user connected to VPN from new location after travel.', 'Suspicious — first time this process has run on this device. Monitor closely.', 'Known FP — backup software triggers data exfiltration alerts.', 'False positive — developer testing triggered web shell detection.'];
    const results = alerts.map((a: any, i: number) => {
      const v = verdicts[i % verdicts.length];
      return { id: a.id, title: a.title, verdict: v, confidence: v === 'tp' ? 78 + Math.floor(Math.random() * 20) : v === 'fp' ? 92 + Math.floor(Math.random() * 7) : 65 + Math.floor(Math.random() * 20), reason: reasons[i % reasons.length], severity: a.severity };
    });
    return NextResponse.json({ alerts: results, demo: true });
  }
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
    } catch(e) { return NextResponse.json({ alerts }); }
  } catch(e) { return NextResponse.json({ alerts }); }
}
