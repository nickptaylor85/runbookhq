import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { redisGet, redisSet } from '@/lib/redis';

const CACHE_KEY = (tenantId: string) => `wt:tenable_news:${tenantId}`;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, items: [] });

    // Check cache first
    try {
      const cached = await redisGet(CACHE_KEY(tenantId));
      if (cached) {
        const parsed = JSON.parse(cached as string);
        if (parsed.ts && Date.now() - parsed.ts < CACHE_TTL_MS) {
          return NextResponse.json({ ok: true, items: parsed.items, cached: true });
        }
      }
    } catch(e) {}

    const today = new Date().toISOString().split('T')[0];
    const prompt = `Today is ${today}. Generate 3 recent CVE security advisories in the style of Tenable Research blog posts.

Return ONLY a valid JSON array with exactly 3 objects. No markdown, no explanation. Start with [

Each object must have exactly:
{
  "id": "tn-live-1",
  "title": "Product — VulnType (CVE-YYYY-NNNNN)",
  "summary": "2-3 sentences: product/version affected, vuln class, CVSS score, exploitation status, fix available.",
  "severity": "Critical",
  "source": "Tenable Research",
  "url": "https://www.tenable.com/security/research/tra-2024-NN",
  "time": "2d ago",
  "iocs": ["CVE-YYYY-NNNNN"],
  "mitre": "T1190",
  "industrySpecific": false
}

Use specific real CVEs from 2024-2025. Include CVSS scores. Note if actively exploited.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: 'Return ONLY valid JSON arrays. No markdown. Start with [ and end with ].',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) return NextResponse.json({ ok: false, items: [] });

    const data = await resp.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content?.find((b: any) => b.type === 'text')?.text?.trim() || '';
    const cleaned = text.replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```\s*$/i, '').trim();

    const items = JSON.parse(cleaned);
    if (!Array.isArray(items)) throw new Error('Not array');

    const validated = items.slice(0, 3).map((item: any, i: number) => ({
      id: item.id || `tn-live-${i+1}`,
      title: item.title || 'Security Advisory',
      summary: item.summary || '',
      severity: ['Critical','High','Medium'].includes(item.severity) ? item.severity : 'High',
      source: 'Tenable Research',
      url: item.url || 'https://www.tenable.com/security/research',
      time: item.time || `${i+2}d ago`,
      iocs: Array.isArray(item.iocs) ? item.iocs : [],
      mitre: item.mitre || 'T1190',
      industrySpecific: false,
    }));

    // Cache for 6h
    try {
      await redisSet(CACHE_KEY(tenantId), JSON.stringify({ ts: Date.now(), items: validated }));
    } catch(e) {}

    return NextResponse.json({ ok: true, items: validated });
  } catch(e: any) {
    return NextResponse.json({ ok: false, items: [], error: e.message });
  }
}
