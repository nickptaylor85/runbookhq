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
    // Auth: decode session cookie directly (same pattern as triage route — most reliable)
    let sessionIsAdmin = false;
    let sessionTier = 'community';
    let sessionUserId = 'anon';
    const sessionToken = req.cookies.get('wt_session')?.value
      || (await cookies()).get('wt_session')?.value;
    if (sessionToken) {
      try {
        const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
        const [encoded, sig] = sessionToken.split('.');
        if (encoded && sig) {
          const { createHmac } = await import('crypto');
          const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url');
          if (sig === expectedSig) {
            const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
            if (Date.now() - payload.iat <= 86400000) {
              sessionIsAdmin = payload.isAdmin === true;
              sessionTier = payload.tier || 'community';
              sessionUserId = payload.userId || sessionUserId;
            }
          }
        }
      } catch {}
    }
    const isAdmin = req.headers.get('x-is-admin') === 'true' || sessionIsAdmin;
    const userTier = req.headers.get('x-user-tier') || sessionTier;
    const userId = req.headers.get('x-user-id') || sessionUserId;

    console.log(`[investigate] userId=${userId} tier=${userTier} isAdmin=${isAdmin} sessionIsAdmin=${sessionIsAdmin}`);

    const rl = await checkRateLimit(`ai:${userId}`, 30, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });

    const tierLevels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
    if (!isAdmin && (tierLevels[userTier] || 0) < 1) {
      console.error(`[investigate] 403 — isAdmin:${isAdmin} tier:${userTier} sessionIsAdmin:${sessionIsAdmin} sessionTier:${sessionTier}`);
      return NextResponse.json({ ok: false, error: 'This feature requires Essentials plan or above. Upgrade at /pricing.' }, { status: 403 });
    }

    const tenantId = req.headers.get('x-tenant-id') ||
      req.headers.get('x-tenant-id') || 'global';

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
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured. Add your key in the Tools tab.' }, { status: 503 });

    const hasAlerts = Array.isArray(body.alerts) && body.alerts.length > 0;
    const alertsText = hasAlerts
      ? body.alerts.map((a, i) =>
          `  ${i+1}. [${a.source}] ${a.title}${a.device ? ` on ${a.device}` : ''}${a.mitre ? ` (${a.mitre})` : ''}${a.verdict ? ` — ${a.verdict}` : ''}`
        ).join('\n')
      : `  1. [SOC Platform] ${body.title} — ${body.severity} severity incident`;

    const prompt = `You are a Tier 3 incident responder performing deep investigation. Analyse this security incident and respond ONLY with valid JSON — no markdown, no preamble, no explanation.

INCIDENT: ${body.incidentId}
Title: ${body.title}
Severity: ${body.severity}
${body.mitreTactics?.length ? `MITRE Tactics: ${body.mitreTactics.join(', ')}` : ''}
${body.aiSummary ? `AI Summary: ${body.aiSummary}` : ''}

ALERTS IN THIS INCIDENT:
${alertsText}

Provide a comprehensive Tier 2/3 investigation. Respond with exactly this JSON structure:
{
  "attackTimeline": [
    {"time": "T+0m", "event": "Initial compromise vector", "source": "tool source", "significance": "why this matters"},
    {"time": "T+Xm", "event": "Next stage", "source": "...", "significance": "..."}
  ],
  "lateralMovementPaths": ["From X, attacker could reach Y via Z"],
  "affectedScope": {
    "users": ["compromised/at-risk user accounts"],
    "devices": ["compromised/at-risk hostnames"],
    "dataAtRisk": ["sensitive data stores that may be accessed"]
  },
  "rootCause": "single paragraph root cause analysis",
  "attackerObjective": "likely goal (ransomware staging / credential theft / data exfil / etc)",
  "forensicCommands": [
    {"tool": "PowerShell/Linux/CrowdStrike RTR", "command": "exact command", "purpose": "what you are looking for"}
  ],
  "remediationSteps": [
    {"priority": "Critical", "action": "Specific action", "owner": "SOC analyst / IT / CISO"}
  ],
  "detectionGaps": ["What detection rule was missing that would have caught this earlier"],
  "iocs": ["file hash", "IP:port", "domain", "registry key"]
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: 'You are a Tier 3 incident responder. You respond ONLY with valid JSON. No preamble, no explanation, no markdown fences. Raw JSON only.', messages: [{ role: 'user', content: prompt }] }),
    });

    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });

    const data = await resp.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';

    let parsed: any;
    try {
      let clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) clean = clean.slice(start, end + 1);
      parsed = JSON.parse(clean);
    } catch {
      console.error('[investigate] JSON parse failed. Raw:', text.slice(0, 500));
      return NextResponse.json({ ok: false, error: 'Malformed AI response — the model returned invalid JSON. Retry usually fixes this.' }, { status: 502 });
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
