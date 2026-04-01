import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';
import { cookies } from 'next/headers';

// Daily AI insight — generates a contextual security insight cached for 6 hours

const CACHE_KEY = (t: string) => `wt:${t}:ai_insight`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') ||
      req.headers.get('x-tenant-id') || 'global';
    const userId = req.headers.get('x-user-id') || 'anon';

    const rl = await checkRateLimit(`insight:${userId}`, 10, 3600);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });

    const cached = await redisGet(CACHE_KEY(tenantId));
    if (cached) {
      const p = JSON.parse(cached);
      if (Date.now() - p.cachedAt < 6 * 3600000) return NextResponse.json({ ok: true, ...p, cached: true });
    }

    const body = await req.json() as {
      totalAlerts: number; critAlerts: number; posture: number;
      topMitre?: string[]; coveredPct?: number; openCases?: number;
    };

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });

    const prompt = `You are a cyber threat intelligence analyst. Generate a brief, actionable security insight for a SOC team based on their current posture. Respond ONLY with valid JSON.

CURRENT POSTURE:
- Total active alerts: ${body.totalAlerts}
- Critical unresolved: ${body.critAlerts}
- Posture score: ${body.posture}/100
- Estate coverage: ${body.coveredPct || 'unknown'}%
- Open incidents: ${body.openCases || 0}
${body.topMitre?.length ? `- Top MITRE techniques: ${body.topMitre.join(', ')}` : ''}

Respond with:
{
  "headline": "one punchy headline (max 10 words)",
  "insight": "2-3 sentence security insight referencing the specific data above",
  "priority": "Critical|High|Medium|Low",
  "actionItem": "one specific action the team should do today",
  "trend": "improving|stable|deteriorating"
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });

    const data = await resp.json() as { content: { type: string; text: string }[] };
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
    let parsed: Record<string, unknown>;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch { return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 }); }

    const result = { ...parsed, cachedAt: Date.now() };
    await redisSet(CACHE_KEY(tenantId), JSON.stringify(result)).catch(() => {});
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
