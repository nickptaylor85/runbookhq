import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';
import { cookies } from 'next/headers';

// Noise reduction analysis — identifies FP patterns across recent alerts
// to suggest suppression rules and tuning recommendations

const CACHE_KEY = (t: string) => `wt:${t}:noise_analysis`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') ||
      req.headers.get('x-tenant-id') || 'global';
    const userId = req.headers.get('x-user-id') || 'anon';

    const rl = await checkRateLimit(`noise:${userId}`, 5, 300);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });

    // Return cached if fresh (1h)
    const cached = await redisGet(CACHE_KEY(tenantId));
    if (cached) {
      const p = JSON.parse(cached);
      if (Date.now() - p.cachedAt < 3600000) return NextResponse.json({ ok: true, ...p, cached: true });
    }

    const body = await req.json() as {
      alerts: Array<{ id: string; title: string; source: string; severity: string; verdict: string; device?: string; mitre?: string }>;
    };

    if (!body.alerts?.length) return NextResponse.json({ ok: false, error: 'alerts required' }, { status: 400 });

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });

    const fpAlerts = body.alerts.filter(a => a.verdict === 'FP');
    const allAlerts = body.alerts.slice(0, 50);

    const alertSummary = allAlerts.map(a =>
      `[${a.verdict||'Pending'}] ${a.title} | ${a.source} | ${a.severity}${a.device ? ` | ${a.device}` : ''}`
    ).join('\n');

    const prompt = `You are a SOC noise reduction specialist. Analyse these ${allAlerts.length} recent alerts (${fpAlerts.length} confirmed false positives) and provide tuning recommendations. Respond ONLY with valid JSON.

ALERTS:
${alertSummary}

Respond with:
{
  "noiseSources": [
    {"source": "tool name", "fpCount": 5, "pattern": "what makes these FP", "recommendation": "how to suppress/tune"}
  ],
  "suppressionRules": [
    {"type": "splunk|kql|description", "rule": "specific rule to add", "impact": "estimated FPs/day reduced"}
  ],
  "topNoisyAlerts": ["alert title pattern to suppress 1", "alert title pattern 2"],
  "summary": "2-sentence summary of noise situation and top recommendation",
  "estimatedFpReduction": "percentage reduction achievable with these changes"
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });

    const data = await resp.json() as { content: { type: string; text: string }[] };
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
    let parsed: Record<string, unknown>;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch { return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 }); }

    const result = { ...parsed, analysedAlerts: allAlerts.length, fpAlerts: fpAlerts.length, cachedAt: Date.now() };
    await redisSet(CACHE_KEY(tenantId), JSON.stringify(result)).catch(() => {});
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
