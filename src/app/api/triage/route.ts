import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet } from '@/lib/redis';
import { cookies } from 'next/headers';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const triageCacheKey = (tenantId: string, alertId: string) => `wt:${tenantId}:triage:${alertId}`;

export interface TriageResult {
  alertId: string;
  verdict: 'TP' | 'FP' | 'SUS';
  confidence: number;
  reasoning: string;
  evidenceChain: string[];
  huntQueries: { splunk: string; sentinel: string; defender: string };
  mitreMapping: { tactic: string; technique: string; id: string };
  immediateActions: string[];
  blastRadius?: string;
  cachedAt: number;
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') ||
      (await cookies()).get('wt_tenant')?.value || 'global';

    const body = await req.json() as {
      alertId: string;
      title: string;
      severity: string;
      source: string;
      device?: string;
      description?: string;
      mitre?: string;
      ip?: string;
      user?: string;
      confidence?: number;
      tenantKnowledge?: string;
    };

    if (!body.alertId || !body.title) {
      return NextResponse.json({ ok: false, error: 'alertId and title required' }, { status: 400 });
    }

    // Return cached triage if available
    const cacheKey = triageCacheKey(tenantId, body.alertId);
    try {
      const cached = await redisGet(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as TriageResult;
        if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
          return NextResponse.json({ ok: true, result: parsed, cached: true });
        }
      }
    } catch {}

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });
    }

    const knowledgeBlock = body.tenantKnowledge
      ? `\n\nTENANT HISTORICAL CONTEXT (learn from these past analyst decisions):\n${body.tenantKnowledge}\n`
      : '';

    const prompt = `You are a senior SOC analyst. Triage this security alert and respond ONLY with valid JSON, no prose, no markdown.

ALERT:
- Title: ${body.title}
- Severity: ${body.severity}
- Source: ${body.source}
${body.device ? `- Device: ${body.device}` : ''}
${body.description ? `- Description: ${body.description}` : ''}
${body.mitre ? `- MITRE: ${body.mitre}` : ''}
${body.ip ? `- IP: ${body.ip}` : ''}
${body.user ? `- User: ${body.user}` : ''}
${body.confidence !== undefined ? `- Raw confidence: ${body.confidence}%` : ''}
${knowledgeBlock}

Respond with exactly this JSON structure:
{
  "verdict": "TP" or "FP" or "SUS",
  "confidence": integer 0-100,
  "reasoning": "2-3 sentence analytical explanation referencing specific alert fields",
  "evidenceChain": ["step 1 — what this indicator means", "step 2 — cross-source correlation", "step 3 — verdict justification", "step 4 — risk context (optional)"],
  "huntQueries": {
    "splunk": "index=* host=\\"${body.device || '*'}\\" | specific SPL query to hunt for this threat",
    "sentinel": "SecurityEvent | specific KQL query to hunt for this threat",
    "defender": "DeviceProcessEvents | specific Defender Advanced Hunting query"
  },
  "mitreMapping": {
    "tactic": "e.g. Credential Access",
    "technique": "e.g. OS Credential Dumping",
    "id": "e.g. T1003"
  },
  "immediateActions": ["Action 1", "Action 2", "Action 3"]
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });
    }

    const data = await resp.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';

    let parsed: any;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ ok: false, error: 'AI returned malformed JSON', raw: text.slice(0, 200) }, { status: 502 });
    }

    const result: TriageResult = {
      alertId: body.alertId,
      verdict: parsed.verdict || 'SUS',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
      reasoning: parsed.reasoning || '',
      evidenceChain: Array.isArray(parsed.evidenceChain) ? parsed.evidenceChain : [],
      huntQueries: parsed.huntQueries || { splunk: '', sentinel: '', defender: '' },
      mitreMapping: parsed.mitreMapping || { tactic: '', technique: '', id: '' },
      immediateActions: Array.isArray(parsed.immediateActions) ? parsed.immediateActions : [],
      cachedAt: Date.now(),
    };

    // Cache result
    try { await redisSet(cacheKey, JSON.stringify(result)); } catch {}

    return NextResponse.json({ ok: true, result, cached: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const alertId = new URL(req.url).searchParams.get('alertId');
    if (!alertId) return NextResponse.json({ ok: false, error: 'alertId required' }, { status: 400 });

    const cached = await redisGet(triageCacheKey(tenantId, alertId));
    if (!cached) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, result: JSON.parse(cached), cached: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
