import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet, redisLRange } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';
import { cookies } from 'next/headers';

// Batch triage: processes up to 20 alerts in a single call
// Uses the same expert analyst persona as /api/triage but optimised for throughput
// Each alert gets: verdict + confidence + 1-sentence narrative (full investigation via /api/triage)

const BATCH_CACHE_TTL = 6 * 60 * 60 * 1000;
const cacheKey = (t: string, a: string) => `wt:${t}:triage:${a}`;
const knowledgeKey = (t: string) => `wt:${t}:knowledge`;

interface AlertInput {
  id: string;
  title: string;
  severity: string;
  source: string;
  device?: string;
  user?: string;
  ip?: string;
  mitre?: string;
  description?: string;
  confidence?: number;
  tags?: string[];
}

interface BatchResult {
  id: string;
  verdict: 'TP' | 'FP' | 'SUS';
  confidence: number;
  reasoning: string;  // 1-2 sentences for list view
  mitreId?: string;
  urgency: 'IMMEDIATE' | 'SOON' | 'ROUTINE' | 'CLOSE';
}

const BATCH_SYSTEM = `You are APEX, an elite autonomous SOC analyst. You are performing rapid batch triage — first-pass classification to identify what needs immediate attention.

For each alert: form a verdict quickly but accurately. Default to FP — evidence must demand TP. Flag SUS when genuinely uncertain rather than guessing. Your reasoning must reference specific technical indicators, not generic statements.`;

async function getTenantPattern(tenantId: string): Promise<string> {
  try {
    const raw = await redisLRange(knowledgeKey(tenantId), 0, 19).catch(() => [] as string[]);
    const entries = (raw as string[]).map((r: string) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
    if (!entries.length) return '';
    const fps = entries.filter((e: any) => e.verdict === 'FP');
    const fpBySrc: Record<string, number> = {};
    fps.forEach((e: any) => { fpBySrc[e.source] = (fpBySrc[e.source] || 0) + 1; });
    const noisySrc = Object.entries(fpBySrc).filter(([, n]) => (n as number) >= 2).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3).map(([s, n]) => `${s}(${n}FPs)`).join(', ');
    const tpRate = Math.round(entries.filter((e: any) => e.verdict === 'TP').length / entries.length * 100);
    return `\nENV CONTEXT: ${entries.length} past decisions, ${tpRate}% TP rate.${noisySrc ? ` Known noisy sources (lower confidence): ${noisySrc}.` : ''}`;
  } catch { return ''; }
}

export async function POST(req: NextRequest) {
  try {
    // Tier check
    const userTier = req.headers.get('x-user-tier') || 'community';
    const tierLevels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
    if ((tierLevels[userTier] || 0) < 1) {
      return NextResponse.json({ ok: false, error: 'Requires Essentials plan or above.' }, { status: 403 });
    }

    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`auto-triage:${userId}`, 10, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });

    const tenantId = req.headers.get('x-tenant-id') || (await cookies()).get('wt_tenant')?.value || 'global';
    const body = await req.json() as { alerts: AlertInput[] };
    if (!body.alerts?.length) return NextResponse.json({ ok: false, error: 'alerts array required' }, { status: 400 });

    const alerts = body.alerts.slice(0, 20);
    const cached: Record<string, BatchResult> = {};
    const toTriage: AlertInput[] = [];

    for (const alert of alerts) {
      const c = await redisGet(cacheKey(tenantId, alert.id)).catch(() => null);
      if (c) {
        const p = JSON.parse(c);
        if (Date.now() - p.cachedAt < BATCH_CACHE_TTL) {
          cached[alert.id] = {
            id: alert.id, verdict: p.verdict, confidence: p.confidence,
            reasoning: p.analystNarrative || p.reasoning || '',
            mitreId: p.mitreMapping?.id,
            urgency: getUrgency(p.verdict, p.confidence, alert.severity),
          };
          continue;
        }
      }
      toTriage.push(alert);
    }

    if (toTriage.length === 0) return NextResponse.json({ ok: true, results: cached, source: 'cache' });

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });

    const envContext = await getTenantPattern(tenantId);

    // Build batch prompt — each alert gets rich context
    const alertList = toTriage.map((a, i) => {
      const parts = [`${i+1}. ID:${a.id} | [${a.severity}] "${a.title}"`];
      parts.push(`   Source: ${a.source}`);
      if (a.device) parts.push(`   Device: ${a.device}`);
      if (a.user) parts.push(`   User: ${a.user}`);
      if (a.ip) parts.push(`   IP: ${a.ip}`);
      if (a.description) parts.push(`   Detail: ${a.description}`);
      if (a.mitre) parts.push(`   MITRE: ${a.mitre}`);
      if (a.tags?.length) parts.push(`   Tags: ${a.tags.join(', ')}`);
      if (a.confidence !== undefined) parts.push(`   Source confidence: ${a.confidence}%`);
      return parts.join('\n');
    }).join('\n\n');

    const prompt = `BATCH TRIAGE — ${toTriage.length} alerts requiring classification.${envContext}

ALERTS:
${alertList}

For each alert, apply expert SOC analysis:
- What specific technical indicator makes this suspicious or benign?
- Does the source's detection methodology produce high or low fidelity signals for this alert type?
- Is there a plausible benign explanation?

Respond ONLY with a JSON array (one object per alert, same order):
[
  {
    "id": "<exact alert ID>",
    "verdict": "TP" | "FP" | "SUS",
    "confidence": <0-100>,
    "reasoning": "<1-2 sentences referencing specific technical indicators — not generic. Write like a senior analyst.>",
    "mitreId": "<T1XXX.XXX or null>",
    "urgency": "IMMEDIATE" | "SOON" | "ROUTINE" | "CLOSE"
  }
]

urgency guide: IMMEDIATE=TP high/critical, SOON=TP medium or SUS high/critical, ROUTINE=SUS medium/low, CLOSE=FP
confidence guide: 90+=textbook IOC, 75-89=strong indicator one gap, 60-74=moderate, 45-59=ambiguous SUS, 30-44=likely FP, 0-29=clear FP`;

    // Haiku for batch triage — 5-10x faster than opus, excellent for SOC analysis
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1200, system: BATCH_SYSTEM, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });
    const data = await resp.json();

    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '[]';

    let parsed: BatchResult[] = [];
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = text.match(/\[[\s\S]+\]/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 }); } }
      else return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 });
    }

    const results = { ...cached };
    for (let i = 0; i < toTriage.length; i++) {
      const ai = parsed[i] || { verdict: 'SUS', confidence: 50, reasoning: 'Requires manual review', urgency: 'ROUTINE', mitreId: null };
      const result: BatchResult = {
        id: toTriage[i].id,
        verdict: ['TP', 'FP', 'SUS'].includes(ai.verdict) ? ai.verdict as 'TP' | 'FP' | 'SUS' : 'SUS',
        confidence: typeof ai.confidence === 'number' ? Math.min(100, Math.max(0, ai.confidence)) : 50,
        reasoning: ai.reasoning || '',
        mitreId: ai.mitreId || toTriage[i].mitre,
        urgency: ['IMMEDIATE', 'SOON', 'ROUTINE', 'CLOSE'].includes(ai.urgency) ? ai.urgency as any : getUrgency(ai.verdict, ai.confidence, toTriage[i].severity),
      };
      results[toTriage[i].id] = result;
      // Cache with minimal structure compatible with deep triage cache
      await redisSet(cacheKey(tenantId, toTriage[i].id), JSON.stringify({
        ...result, analystNarrative: result.reasoning, mitreMapping: { id: result.mitreId || '' },
        evidenceChain: [], cachedAt: Date.now(),
      })).catch(() => {});
    }

    return NextResponse.json({ ok: true, results, triaged: toTriage.length, fromCache: Object.keys(cached).length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function getUrgency(verdict: string, confidence: number, severity: string): 'IMMEDIATE' | 'SOON' | 'ROUTINE' | 'CLOSE' {
  if (verdict === 'FP') return 'CLOSE';
  const isHigh = ['Critical', 'High'].includes(severity);
  if (verdict === 'TP' && confidence >= 70 && isHigh) return 'IMMEDIATE';
  if (verdict === 'TP' || (verdict === 'SUS' && isHigh)) return 'SOON';
  if (verdict === 'FP' && confidence < 50) return 'ROUTINE';
  return 'ROUTINE';
}
