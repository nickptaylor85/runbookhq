import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey, redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

export const maxDuration = 60;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cacheKey = (t: string, id: string) => `wt:${t}:ot_triage:${id}`;

// OT-specific APEX system prompt — hard safety constraints, never auto-act
const OT_SYSTEM_PROMPT = `You are APEX OT — an elite OT/ICS security analyst with 15 years specialising in industrial control systems, SCADA, and critical infrastructure protection across energy, utilities, and manufacturing.

CRITICAL OT SAFETY CONSTRAINTS — NON-NEGOTIABLE:
1. NEVER recommend isolating, containing, shutting down, or disconnecting an operational OT device (PLC, RTU, DCS controller, SCADA server, HMI) — this can cause physical damage, production loss, or safety incidents
2. NEVER suggest auto-closing OT alerts as false positives — every OT alert requires explicit analyst and plant engineer confirmation
3. For L0/L1 devices: ALWAYS recommend notifying the plant/process engineer BEFORE any technical action
4. Preferred OT response actions: increase monitoring, enable audit logging, passive traffic capture, notify plant engineer, create maintenance work order, apply network-level compensating controls at L3.5 DMZ (NOT at the device level)
5. If recommending any network control: it must be at the DMZ boundary, never at the OT device itself
6. Consider: is there a legitimate maintenance reason for this activity? OT environments have change windows.
7. Your confidence scoring must account for OT context — what looks like an attack in IT may be a normal ICS protocol behaviour

OT-SPECIFIC KNOWLEDGE:
- Modbus function codes: 01/02 read, 05/06/15/16 write — unexpected writes are high priority
- DNP3 unsolicited responses and flooding can indicate mis-config or C2
- OPC-UA anomalies often legitimate (historian polling) but worth monitoring
- Purdue model zones: L0 field, L1 controllers, L2 supervisory, L3 MES, L3.5 DMZ, L4 IT
- Cross-zone anomalies: IT to L2/L1 bypassing DMZ = critical concern
- MITRE ATT&CK for ICS: T0836 Modbus write, T0822 External Remote Services, T0815 Denial of View

RESPONSE FORMAT: Start with { end with }. No preamble. Raw JSON only.

Required JSON: {"verdict":"TP"|"FP"|"SUS","confidence":0-100,"analystNarrative":"2-3 sentences for plant supervisor","evidenceChain":["point1","point2","point3"],"otSafeActions":["safe action 1","safe action 2"],"otUnsafeActions":["what NOT to do"],"mitreIcs":{"tactic":"","technique":"","id":"T0XXX"},"requiresPlantEngineer":true|false,"maintenanceWindowCheck":"should analyst verify maintenance window first?"}`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const userId = req.headers.get('x-user-id') || 'anon';

    const rl = await checkRateLimit(`ot:${userId}`, 20, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded` }, { status: 429 });

    const body = await req.json() as {
      alertId: string; title: string; severity: string; source: string;
      device?: string; zone?: string; protocol?: string; description?: string;
      mitre?: string; forceRefresh?: boolean;
    };

    if (!body.alertId || !body.title) return NextResponse.json({ ok: false, error: 'alertId and title required' }, { status: 400 });

    const key = cacheKey(tenantId, body.alertId);
    if (!body.forceRefresh) {
      try {
        const cached = await redisGet(key);
        if (cached) {
          const p = JSON.parse(cached);
          if (Date.now() - p.cachedAt < CACHE_TTL_MS) return NextResponse.json({ ok: true, result: p, cached: true });
        }
      } catch {}
    }

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });

    const prompt = `OT ALERT INVESTIGATION
──────────────────────────────
ID: ${body.alertId}
Title: ${body.title}
Severity: ${body.severity}
Source: ${body.source}
${body.device ? `Device: ${body.device}` : ''}
${body.zone ? `Purdue Zone: ${body.zone}` : ''}
${body.protocol ? `Protocol: ${body.protocol}` : ''}
${body.description ? `Description: ${body.description}` : ''}
${body.mitre ? `MITRE ICS Tag: ${body.mitre}` : ''}

REMEMBER: OT Safety constraints apply. Never recommend isolating live process devices.
Respond in JSON only starting with {`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, system: OT_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error ${resp.status}` }, { status: 502 });
    const data = await resp.json();
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');

    let parsed: any;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = text.match(/\{[\s\S]+\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 }); } }
      else return NextResponse.json({ ok: false, error: 'No JSON in response' }, { status: 502 });
    }

    const result = {
      alertId: body.alertId,
      verdict: ['TP','FP','SUS'].includes(parsed.verdict) ? parsed.verdict : 'SUS',
      confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
      analystNarrative: parsed.analystNarrative || '',
      evidenceChain: Array.isArray(parsed.evidenceChain) ? parsed.evidenceChain : [],
      otSafeActions: Array.isArray(parsed.otSafeActions) ? parsed.otSafeActions : [],
      otUnsafeActions: Array.isArray(parsed.otUnsafeActions) ? parsed.otUnsafeActions : [],
      mitreIcs: parsed.mitreIcs || { tactic: '', technique: '', id: '' },
      requiresPlantEngineer: parsed.requiresPlantEngineer !== false,
      maintenanceWindowCheck: parsed.maintenanceWindowCheck || '',
      cachedAt: Date.now(),
      modelVersion: 'apex-ot',
    };

    await redisSet(key, JSON.stringify(result)).catch(() => {});
    return NextResponse.json({ ok: true, result, cached: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
