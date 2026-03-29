import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';
import { cookies } from 'next/headers';

// Batch triage: triages up to 20 alerts in a single AI call
// Returns verdicts for each alert without the full evidence chain (use /api/triage for that)

const CACHE_KEY = (tenantId: string, alertId: string) => `wt:${tenantId}:triage:${alertId}`;

interface AlertInput {
  id: string;
  title: string;
  severity: string;
  source: string;
  device?: string;
  mitre?: string;
}

interface TriageBatchResult {
  id: string;
  verdict: 'TP' | 'FP' | 'SUS';
  confidence: number;
  reasoning: string;
}

export async function POST(req: NextRequest) {
  try {
  // Tier enforcement: requires Essentials (team) or above
  const userTier = req.headers.get('x-user-tier') || 'community';
  const tierLevels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
  if ((tierLevels[userTier] || 0) < 1) {
    return NextResponse.json({ ok: false, error: 'This feature requires Essentials plan or above. Upgrade at /pricing.' }, { status: 403 });
  }
    const tenantId = req.headers.get('x-tenant-id') ||
      (await cookies()).get('wt_tenant')?.value || 'global';
    const userId = req.headers.get('x-user-id') || 'anon';

    const rl = await checkRateLimit(`auto-triage:${userId}`, 5, 60);
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });
    }

    const body = await req.json() as { alerts: AlertInput[] };
    if (!body.alerts?.length) {
      return NextResponse.json({ ok: false, error: 'alerts array required' }, { status: 400 });
    }

    const alerts = body.alerts.slice(0, 20);

    // Return cached results for already-triaged alerts
    const cached: Record<string, TriageBatchResult> = {};
    const toTriage: AlertInput[] = [];

    for (const alert of alerts) {
      const c = await redisGet(CACHE_KEY(tenantId, alert.id)).catch(() => null);
      if (c) {
        const parsed = JSON.parse(c);
        if (Date.now() - parsed.cachedAt < 24 * 3600000) {
          cached[alert.id] = { id: alert.id, verdict: parsed.verdict, confidence: parsed.confidence, reasoning: parsed.reasoning };
          continue;
        }
      }
      toTriage.push(alert);
    }

    if (toTriage.length === 0) {
      return NextResponse.json({ ok: true, results: cached, source: 'cache' });
    }

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });
    }

    const alertList = toTriage.map((a, i) =>
      `${i + 1}. [${a.severity}] "${a.title}" | Source: ${a.source}${a.device ? ` | Device: ${a.device}` : ''}${a.mitre ? ` | MITRE: ${a.mitre}` : ''}`
    ).join('\n');

    const prompt = `You are a SOC analyst. Triage these ${toTriage.length} security alerts. Respond ONLY with valid JSON — an array of objects.

ALERTS:
${alertList}

Respond with exactly this JSON array (one entry per alert, in the same order):
[
  {"id":"${toTriage[0].id}","verdict":"TP","confidence":85,"reasoning":"Brief 1-sentence reason"},
  ...
]

verdict must be exactly: TP, FP, or SUS. confidence is 0-100.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });
    }

    const data = await resp.json() as { content: { type: string; text: string }[] };
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '[]';

    let parsed: TriageBatchResult[] = [];
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 });
    }

    // Map results back to alert IDs and cache them
    const results = { ...cached };
    for (let i = 0; i < toTriage.length; i++) {
      const aiResult = parsed[i] || { verdict: 'SUS', confidence: 50, reasoning: 'Requires manual review' };
      const result: TriageBatchResult = {
        id: toTriage[i].id,
        verdict: ['TP', 'FP', 'SUS'].includes(aiResult.verdict) ? aiResult.verdict as 'TP' | 'FP' | 'SUS' : 'SUS',
        confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : 50,
        reasoning: aiResult.reasoning || '',
      };
      results[toTriage[i].id] = result;
      // Cache with minimal structure
      await redisSet(CACHE_KEY(tenantId, toTriage[i].id), JSON.stringify({ ...result, cachedAt: Date.now() })).catch(() => {});
    }

    return NextResponse.json({ ok: true, results, triaged: toTriage.length, fromCache: Object.keys(cached).length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
