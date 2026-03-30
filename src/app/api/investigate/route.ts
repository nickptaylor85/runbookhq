import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ratelimit';

export interface InvestigationResult {
  incidentId: string;
  attackTimeline: { time: string; event: string; source: string; significance: string }[];
  lateralMovementPaths: string[];
  affectedScope: { users: string[]; devices: string[]; dataAtRisk: string[] };
  rootCause: string;
  attackerObjective: string;
  forensicCommands: { tool: string; command: string; purpose: string }[];
  remediationSteps: { priority: 'Critical' | 'High' | 'Medium'; action: string; owner: string }[];
  detectionGaps: string[];
  iocs: string[];
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`ai:${userId}`, 30, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });
  // Tier enforcement: requires Essentials (team) or above. Admins always pass.
  const userTier = req.headers.get('x-user-tier') || 'community';
  const isAdmin = req.headers.get('x-is-admin') === 'true';
  const tierLevels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
  if (!isAdmin && (tierLevels[userTier] || 0) < 1) {
    return NextResponse.json({ ok: false, error: 'This feature requires Essentials plan or above. Upgrade at /pricing.' }, { status: 403 });
  }
    const tenantId = req.headers.get('x-tenant-id') ||
      (await cookies()).get('wt_tenant')?.value || 'global';

    const body = await req.json() as {
      incidentId: string;
      title: string;
      severity: string;
      alerts: Array<{ title: string; source: string; device?: string; mitre?: string; verdict?: string; time?: string }>;
      devices?: string[];
      mitreTactics?: string[];
      aiSummary?: string;
    };

    if (!body.incidentId) {
      return NextResponse.json({ ok: false, error: 'incidentId required' }, { status: 400 });
    }

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });

    const hasAlerts = Array.isArray(body.alerts) && body.alerts.length > 0;
    const alertsText = hasAlerts
      ? body.alerts.map((a, i) =>
          `  ${i+1}. [${a.source}] ${a.title}${a.device ? ` on ${a.device}` : ''}${a.mitre ? ` (${a.mitre})` : ''}${a.verdict ? ` — ${a.verdict}` : ''}`
        ).join('\n')
      : `  1. [SOC Platform] ${body.title} — ${body.severity} severity incident`;

    const prompt = `You are a Tier 3 incident responder performing deep investigation. Analyse this security incident and respond ONLY with valid JSON.

INCIDENT: ${body.incidentId}
Title: ${body.title}
Severity: ${body.severity}
${body.mitreTactics?.length ? `MITRE Tactics: ${body.mitreTactics.join(', ')}` : ''}
${body.devices?.length ? `Affected Devices: ${body.devices.join(', ')}` : ''}

ALERTS IN THIS INCIDENT:
${alertsText}

${body.aiSummary ? `AI Summary: ${body.aiSummary}` : ''}

Provide a comprehensive Tier 2/3 investigation. Respond with exactly this JSON:
{
  "attackTimeline": [
    {"time": "T+0m", "event": "Initial compromise vector", "source": "tool source", "significance": "why this matters"},
    {"time": "T+Xm", "event": "Next stage", "source": "...", "significance": "..."}
  ],
  "lateralMovementPaths": ["From X, attacker could reach Y via Z", "..."],
  "affectedScope": {
    "users": ["compromised/at-risk user accounts"],
    "devices": ["compromised/at-risk hostnames"],
    "dataAtRisk": ["sensitive data stores that may be accessed"]
  },
  "rootCause": "single paragraph root cause analysis",
  "attackerObjective": "likely goal (ransomware staging / credential theft / data exfil / etc)",
  "forensicCommands": [
    {"tool": "PowerShell/Linux/CrowdStrike RTR", "command": "exact command", "purpose": "what you are looking for"},
    {"tool": "...", "command": "...", "purpose": "..."}
  ],
  "remediationSteps": [
    {"priority": "Critical", "action": "Specific action", "owner": "SOC analyst / IT / CISO"},
    {"priority": "High", "action": "...", "owner": "..."},
    {"priority": "Medium", "action": "...", "owner": "..."}
  ],
  "detectionGaps": ["What detection rule was missing that would have caught this earlier", "..."],
  "iocs": ["file hash", "IP:port", "domain", "registry key — specific IOCs"]
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });

    const data = await resp.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';

    let parsed: any;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ ok: false, error: 'Malformed AI response', raw: text.slice(0, 300) }, { status: 502 });
    }

    const result: InvestigationResult = {
      incidentId: body.incidentId,
      attackTimeline: Array.isArray(parsed.attackTimeline) ? parsed.attackTimeline : [],
      lateralMovementPaths: Array.isArray(parsed.lateralMovementPaths) ? parsed.lateralMovementPaths : [],
      affectedScope: parsed.affectedScope || { users: [], devices: [], dataAtRisk: [] },
      rootCause: parsed.rootCause || '',
      attackerObjective: parsed.attackerObjective || '',
      forensicCommands: Array.isArray(parsed.forensicCommands) ? parsed.forensicCommands : [],
      remediationSteps: Array.isArray(parsed.remediationSteps) ? parsed.remediationSteps : [],
      detectionGaps: Array.isArray(parsed.detectionGaps) ? parsed.detectionGaps : [],
      iocs: Array.isArray(parsed.iocs) ? parsed.iocs : [],
    };

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
