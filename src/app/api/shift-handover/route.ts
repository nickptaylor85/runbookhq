import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`ai:${userId}`, 30, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });
    const tenantId = getTenantId(req);
    const body = await req.json().catch(()=>({})) as Record<string,unknown>;
    const apiKey = await getAnthropicKey(tenantId);

    // If no API key, return a structured template
    if (!apiKey) {
      return NextResponse.json({ ok: true, handover: {
        generatedAt: new Date().toISOString(),
        summary: 'Shift handover — AI generation requires an Anthropic API key.',
        openIncidents: [],
        pendingAlerts: [],
        keyActions: ['Configure Anthropic API key in Tools → AI Engine'],
        recommendation: 'Manual handover required.',
      }});
    }

    const { openAlerts=0, critAlerts=0, openCases=0, slaBreaches=0, tools=0, posture=0, topAlert='' } = body as Record<string,unknown>;

    const prompt = `Generate a concise SOC shift handover briefing based on:
- Open alerts: ${openAlerts} (${critAlerts} critical)
- Open cases: ${openCases} (${slaBreaches} SLA breach)
- Tools connected: ${tools}
- Posture score: ${posture}/100
- Top alert: ${topAlert || 'None'}

Return JSON only with markdown formatting in string values: { "summary": "**2-3 sentence brief** using **bold** for critical items", "openIncidents": ["list key open cases"], "pendingAlerts": ["top 3 alerts needing action"], "keyActions": ["3 recommended actions for incoming analyst"], "recommendation": "one sentence priority" }`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, system: 'Return only valid JSON, no markdown.', messages: [{ role: 'user', content: prompt }] }),
    });

    if (!resp.ok) throw new Error(`AI error ${resp.status}`);
    const data = await resp.json() as { content: Array<{type:string;text:string}> };
    const text = data.content?.find((b:any)=>b.type==='text')?.text?.trim()||'{}';
    const cleaned = text.replace(/^```(?:json)?[\r\n]*/i,'').replace(/[\r\n]*```\s*$/i,'').trim();
    const handover = JSON.parse(cleaned);
    return NextResponse.json({ ok: true, handover: { ...handover, generatedAt: new Date().toISOString() } });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
