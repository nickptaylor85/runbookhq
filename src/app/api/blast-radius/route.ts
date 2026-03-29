import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet } from '@/lib/redis';
import { cookies } from 'next/headers';

const cacheKey = (tenantId: string, alertId: string) => `wt:${tenantId}:blast:${alertId}`;

export interface BlastRadiusResult {
  alertId: string;
  affectedScope: { users: string[]; devices: string[]; services: string[]; dataStores: string[] };
  lateralRisk: { paths: string[]; highRiskTargets: string[] };
  exposedCredentials: string[];
  immediateContainment: string[];
  forensicCommands: string[];
  estimatedSeverity: 'Contained' | 'Expanding' | 'Critical';
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
      mitre?: string;
      user?: string;
      ip?: string;
      description?: string;
    };

    if (!body.alertId) return NextResponse.json({ ok: false, error: 'alertId required' }, { status: 400 });

    // Cache check
    const ck = cacheKey(tenantId, body.alertId);
    try {
      const cached = await redisGet(ck);
      if (cached) {
        const p = JSON.parse(cached) as BlastRadiusResult;
        if (Date.now() - p.cachedAt < 6 * 3600000) return NextResponse.json({ ok: true, result: p, cached: true });
      }
    } catch {}

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });

    const prompt = `You are a senior incident responder. Perform blast radius analysis for this confirmed True Positive. Respond ONLY with valid JSON.

CONFIRMED INCIDENT:
- Alert: ${body.title}
- Severity: ${body.severity}
- Source: ${body.source}
${body.device ? `- Compromised Device: ${body.device}` : ''}
${body.mitre ? `- MITRE TTP: ${body.mitre}` : ''}
${body.user ? `- Affected User: ${body.user}` : ''}
${body.ip ? `- IP: ${body.ip}` : ''}
${body.description ? `- Details: ${body.description}` : ''}

Respond with exactly this JSON (realistic for a corporate environment):
{
  "affectedScope": {
    "users": ["list of potentially affected user accounts"],
    "devices": ["list of potentially affected hostnames"],
    "services": ["list of affected services/apps"],
    "dataStores": ["list of potentially accessed data stores"]
  },
  "lateralRisk": {
    "paths": ["Attacker could move from X to Y via Z", "..."],
    "highRiskTargets": ["DC01 — domain controller", "FILESERVER02 — file shares"]
  },
  "exposedCredentials": ["credential type/location that may be exposed"],
  "immediateContainment": ["Immediate action 1", "Immediate action 2", "Immediate action 3"],
  "forensicCommands": ["Get-WinEvent ... or similar real forensic command", "another forensic command"],
  "estimatedSeverity": "Contained" or "Expanding" or "Critical"
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });

    const data = await resp.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';

    let parsed: any;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 });
    }

    const result: BlastRadiusResult = {
      alertId: body.alertId,
      affectedScope: parsed.affectedScope || { users: [], devices: [], services: [], dataStores: [] },
      lateralRisk: parsed.lateralRisk || { paths: [], highRiskTargets: [] },
      exposedCredentials: Array.isArray(parsed.exposedCredentials) ? parsed.exposedCredentials : [],
      immediateContainment: Array.isArray(parsed.immediateContainment) ? parsed.immediateContainment : [],
      forensicCommands: Array.isArray(parsed.forensicCommands) ? parsed.forensicCommands : [],
      estimatedSeverity: parsed.estimatedSeverity || 'Expanding',
      cachedAt: Date.now(),
    };

    try { await redisSet(ck, JSON.stringify(result)); } catch {}
    return NextResponse.json({ ok: true, result, cached: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
