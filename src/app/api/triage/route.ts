import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet, redisLRange } from '@/lib/redis';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ratelimit';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const triageCacheKey = (t: string, a: string) => `wt:${t}:triage:${a}`;
const knowledgeKey = (t: string) => `wt:${t}:knowledge`;

export interface TriageResult {
  alertId: string;
  verdict: 'TP' | 'FP' | 'SUS';
  confidence: number;
  analystNarrative: string;
  evidenceChain: string[];
  counterarguments: string[];
  mitreMapping: { tactic: string; technique: string; id: string; subtechnique?: string };
  huntQueries: { splunk: string; sentinel: string; defender: string; elastic: string };
  immediateActions: { priority: string; action: string; timeframe: string; owner: string }[];
  blastRadius: string;
  attackerObjective: string;
  campaignIndicators: string[];
  escalationTriggers: string[];
  cachedAt: number;
  modelVersion: string;
}

const SYSTEM_PROMPT = `You are APEX — an elite autonomous SOC analyst with 15 years of experience across Fortune 500 incident response, red team operations, and threat intelligence.

Your analytical methodology:
- Think attacker-first: what would an adversary do from this position, and does this alert fit that pattern?
- Correlate across tools: single-source alerts are noise; corroborated multi-source signals are fact
- Calibrate confidence precisely: 95%+ = textbook IOC with multiple independent signals; 70-85% = strong indicator with one gap; below 60% = SUS not TP
- Default hypothesis is FP — most alerts are. Evidence must demand TP
- Name specific adversary TTPs, malware families, campaign patterns when patterns match
- Give concrete executable actions — not "investigate further" but the specific query to run right now
- Acknowledge uncertainty: explicitly state what evidence would flip your verdict
- Output ONLY valid JSON — no prose, no markdown wrapper`;

function buildAlertContext(body: any): string {
  const lines = [
    'ALERT UNDER INVESTIGATION',
    '─────────────────────────',
    `ID: ${body.alertId}`,
    `Title: ${body.title}`,
    `Severity: ${body.severity}`,
    `Detection Source: ${body.source}`,
  ];
  if (body.description) lines.push(`Description: ${body.description}`);
  if (body.device) lines.push(`Affected Device: ${body.device}`);
  if (body.user) lines.push(`User Context: ${body.user}`);
  if (body.ip) lines.push(`IP/Network: ${body.ip}`);
  if (body.mitre) lines.push(`MITRE ATT&CK Tag: ${body.mitre}`);
  if (body.tags?.length) lines.push(`Tags: ${(body.tags as string[]).join(', ')}`);
  if (body.rawTime) lines.push(`Event Time: ${new Date(body.rawTime as number).toISOString()}`);
  if (body.confidence !== undefined) lines.push(`Source Confidence: ${body.confidence}%`);

  if (body.relatedAlerts?.length) {
    lines.push('\nCO-OCCURRING ALERTS (same device/user, last 24h):');
    (body.relatedAlerts as any[]).slice(0, 8).forEach((a: any, i: number) => {
      lines.push(`  ${i+1}. [${a.severity}] ${a.title} — ${a.source} (${a.verdict || 'Pending'})`);
    });
  }

  if (body.deviceVulns?.length) {
    lines.push('\nKNOWN VULNERABILITIES ON DEVICE:');
    (body.deviceVulns as any[]).slice(0, 5).forEach((v: any) => {
      lines.push(`  • ${v.cve}: ${v.title} (CVSS ${v.cvss}${v.kev ? ', KEV listed' : ''})`);
    });
  }

  if (body.assetContext) {
    const ac = body.assetContext;
    lines.push('\nASSET CONTEXT:');
    if (ac.isDomainController) lines.push('  ⚠ DOMAIN CONTROLLER — highest value target');
    if (ac.isServer) lines.push(`  Server: ${ac.role || 'role unknown'}`);
    if (ac.isExecutive) lines.push('  ⚠ EXECUTIVE ACCOUNT — elevated exfil risk');
    if (ac.hasPrivilegedAccess) lines.push('  Has privileged/admin access');
    if (ac.lastPatchDate) lines.push(`  Last patched: ${ac.lastPatchDate}`);
  }

  if (body.iocMatches?.length) {
    lines.push('\nTHREAT INTEL MATCHES:');
    (body.iocMatches as any[]).forEach((ioc: any) => {
      lines.push(`  IOC: ${ioc.indicator} — ${ioc.source} (${ioc.threatActor || ioc.malwareFamily || 'unknown actor'})`);
    });
  }

  return lines.join('\n');
}

async function getTenantContext(tenantId: string): Promise<string> {
  try {
    const knowledgeRaw = await redisLRange(knowledgeKey(tenantId), 0, 29).catch(() => [] as string[]);
    const knowledge = (knowledgeRaw as string[]).map((r: string) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
    if (knowledge.length === 0) return '';

    const fps = knowledge.filter((k: any) => k.verdict === 'FP');
    const tps = knowledge.filter((k: any) => k.verdict === 'TP');
    const lines = ['\nORGANISATIONAL CONTEXT (incorporate into analysis):'];
    lines.push(`Analyst verdict history: ${knowledge.length} decisions — ${tps.length} TP (${Math.round(tps.length/knowledge.length*100)}%), ${fps.length} FP (${Math.round(fps.length/knowledge.length*100)}%)`);

    const fpBySrc: Record<string, number> = {};
    fps.forEach((f: any) => { fpBySrc[f.source] = (fpBySrc[f.source] || 0) + 1; });
    const noisySources = Object.entries(fpBySrc).filter(([, n]) => n >= 2).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 4);
    if (noisySources.length > 0) {
      lines.push(`Noisy sources in this env (lower confidence threshold): ${noisySources.map(([s, n]) => `${s}(${n}FPs)`).join(', ')}`);
    }

    lines.push('Recent analyst decisions (calibrate your verdict against these):');
    knowledge.slice(0, 12).forEach((k: any) => {
      const ago = Math.round((Date.now() - k.ts) / 3600000);
      const note = k.analystNote ? ` — analyst note: "${k.analystNote}"` : '';
      lines.push(`  [${k.verdict}] "${k.alertTitle}" | ${k.source}${k.mitre ? ` | ${k.mitre}` : ''}${k.device ? ` | ${k.device}` : ''} | ${ago}h ago${note}`);
    });
    return lines.join('\n');
  } catch { return ''; }
}

function buildPrompt(alertContext: string, tenantContext: string, isHighSeverity: boolean): string {
  return `${alertContext}
${tenantContext}

${isHighSeverity ? '⚠ HIGH/CRITICAL SEVERITY — false negatives are unacceptable. Apply maximum analytical rigour.' : ''}

INVESTIGATION TASK:
1. Does this alert pattern match known attack TTPs or legitimate activity?
2. What does the detection source signal fidelity tell us? (EDR process injection > SIEM correlation rule)
3. What corroborating evidence would exist if this were TP — is it present or absent?
4. What is the strongest case for FP? Be honest about uncertainty.
5. How does organisational context (past decisions, noisy sources) affect your confidence?

Respond ONLY with this JSON (no markdown, no prose):
{
  "verdict": "TP" | "FP" | "SUS",
  "confidence": <0-100, see calibration guide>,
  "analystNarrative": "<2-4 sentences. Write like briefing a CISO. Reference specific indicators. State what makes this verdict confident or uncertain.>",
  "evidenceChain": [
    "<what this specific indicator means and why it matters>",
    "<cross-source correlation or absence of expected benign context>",
    "<attacker TTP match or benign explanation with reasoning>",
    "<risk context — consequence if TP and missed>",
    "<optional: additional corroborating or contradicting signal>"
  ],
  "counterarguments": [
    "<strongest reason this verdict could be wrong, and what evidence would flip it>"
  ],
  "mitreMapping": {
    "tactic": "<exact MITRE tactic>",
    "technique": "<exact technique name>",
    "id": "<T1XXX.XXX>",
    "subtechnique": "<optional>"
  },
  "huntQueries": {
    "splunk": "<specific SPL using real field names — not generic>",
    "sentinel": "<specific KQL>",
    "defender": "<specific Advanced Hunting KQL>",
    "elastic": "<specific EQL or KQL>"
  },
  "immediateActions": [
    { "priority": "CRITICAL", "action": "<specific, concrete action>", "timeframe": "<e.g. within 15 minutes>", "owner": "SOC L2" },
    { "priority": "HIGH", "action": "...", "timeframe": "...", "owner": "..." }
  ],
  "blastRadius": "<what attacker in this position could reach — specific not generic>",
  "attackerObjective": "<most likely goal: ransomware staging / credential theft / data exfiltration / persistence / C2 establishment / recon>",
  "campaignIndicators": ["<signal suggesting coordinated campaign vs isolated event>"],
  "escalationTriggers": ["<specific observable that would immediately upgrade this to Critical P1>"]
}

CONFIDENCE CALIBRATION:
95-100: Textbook IOC, multiple independent corroborating signals, known hash/IOC in threat intel
85-94: Strong indicator, high-fidelity source (EDR process injection), no benign explanation
70-84: Good indicator but evidence gap, or plausible benign explanation exists
55-69: Ambiguous — verdict SUS, not TP or FP
40-54: More likely FP, but concerning enough to flag
0-39: High-confidence FP based on known-good patterns in this environment`;
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`ai:${userId}`, 30, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });
    const tenantId = req.headers.get('x-tenant-id') || (await cookies()).get('wt_tenant')?.value || 'global';

    const body = await req.json() as {
      alertId: string; title: string; severity: string; source: string;
      device?: string; description?: string; mitre?: string; ip?: string;
      user?: string; confidence?: number; tags?: string[]; rawTime?: number;
      relatedAlerts?: any[]; deviceVulns?: any[]; assetContext?: any; iocMatches?: any[];
      forceRefresh?: boolean;
    };

    if (!body.alertId || !body.title) return NextResponse.json({ ok: false, error: 'alertId and title required' }, { status: 400 });

    const cacheKey = triageCacheKey(tenantId, body.alertId);
    if (!body.forceRefresh) {
      try {
        const cached = await redisGet(cacheKey);
        if (cached) {
          const p = JSON.parse(cached) as TriageResult;
          if (Date.now() - p.cachedAt < CACHE_TTL_MS) return NextResponse.json({ ok: true, result: p, cached: true });
        }
      } catch {}
    }

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured. Add your key in the Tools tab.' }, { status: 503 });

    const isHighSeverity = ['Critical', 'High'].includes(body.severity);
    const alertContext = buildAlertContext(body);
    const tenantContext = await getTenantContext(tenantId);
    const prompt = buildPrompt(alertContext, tenantContext, isHighSeverity);

    // Try opus first, fall back to haiku
    let data: any;
    let modelVersion = 'opus';
    const opusResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-opus-4-6', max_tokens: 2000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
    });
    if (opusResp.ok) {
      data = await opusResp.json();
    } else {
      modelVersion = 'haiku';
      const haikuResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1600, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!haikuResp.ok) return NextResponse.json({ ok: false, error: `AI error: ${opusResp.status}` }, { status: 502 });
      data = await haikuResp.json();
    }

    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    let parsed: any;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = text.match(/\{[\s\S]+\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { return NextResponse.json({ ok: false, error: 'Malformed AI response', raw: text.slice(0, 300) }, { status: 502 }); } }
      else return NextResponse.json({ ok: false, error: 'Malformed AI response', raw: text.slice(0, 300) }, { status: 502 });
    }

    const result: TriageResult = {
      alertId: body.alertId,
      verdict: ['TP', 'FP', 'SUS'].includes(parsed.verdict) ? parsed.verdict : 'SUS',
      confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
      analystNarrative: parsed.analystNarrative || parsed.reasoning || '',
      evidenceChain: Array.isArray(parsed.evidenceChain) ? parsed.evidenceChain : [],
      counterarguments: Array.isArray(parsed.counterarguments) ? parsed.counterarguments : [],
      mitreMapping: parsed.mitreMapping || { tactic: '', technique: '', id: '' },
      huntQueries: { splunk: '', sentinel: '', defender: '', elastic: '', ...parsed.huntQueries },
      immediateActions: Array.isArray(parsed.immediateActions) ? parsed.immediateActions : [],
      blastRadius: parsed.blastRadius || '',
      attackerObjective: parsed.attackerObjective || '',
      campaignIndicators: Array.isArray(parsed.campaignIndicators) ? parsed.campaignIndicators : [],
      escalationTriggers: Array.isArray(parsed.escalationTriggers) ? parsed.escalationTriggers : [],
      cachedAt: Date.now(),
      modelVersion,
    };

    await redisSet(cacheKey, JSON.stringify(result)).catch(() => {});
    return NextResponse.json({ ok: true, result, cached: false, modelVersion });
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
