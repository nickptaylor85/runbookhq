import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';
import { cookies } from 'next/headers';

// Natural language → hunt query generator
// Converts plain English to Splunk SPL, Sentinel KQL, and Defender Advanced Hunting queries

export async function POST(req: NextRequest) {
  try {
  // Tier enforcement: requires Essentials (team) or above
  const userTier = req.headers.get('x-user-tier') || 'community';
  const tierLevels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
  if ((tierLevels[userTier] || 0) < 1) {
    return NextResponse.json({ ok: false, error: 'This feature requires Essentials plan or above. Upgrade at /pricing.' }, { status: 403 });
  }
    const tenantId = req.headers.get('x-tenant-id') ||
      req.headers.get('x-tenant-id') || 'global';
    const userId = req.headers.get('x-user-id') || 'anon';

    const rl = await checkRateLimit(`nl-query:${userId}`, 60, 60);
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });
    }

    const body = await req.json() as {
      query: string;
      context?: { device?: string; ip?: string; user?: string; timeRange?: string };
    };

    if (!body.query?.trim()) {
      return NextResponse.json({ ok: false, error: 'query required' }, { status: 400 });
    }

    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'No Anthropic API key configured.' }, { status: 503 });
    }

    const ctx = body.context || {};
    const contextBlock = [
      ctx.device ? `Device/hostname: ${ctx.device}` : '',
      ctx.ip ? `IP address: ${ctx.ip}` : '',
      ctx.user ? `User account: ${ctx.user}` : '',
      ctx.timeRange ? `Time range: ${ctx.timeRange}` : 'Time range: last 24 hours',
    ].filter(Boolean).join('\n');

    const prompt = `You are a detection engineering expert. Convert this natural language query into hunt queries for three SIEM platforms. Respond ONLY with valid JSON.

QUERY: "${body.query}"
${contextBlock ? `\nCONTEXT:\n${contextBlock}` : ''}

Respond with exactly this JSON:
{
  "intent": "one sentence describing what threat/activity this hunts for",
  "splunk": "complete runnable Splunk SPL query",
  "sentinel": "complete runnable Sentinel KQL query",
  "defender": "complete runnable Defender Advanced Hunting query",
  "notes": "any caveats or required indexes/permissions"
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!resp.ok) return NextResponse.json({ ok: false, error: `AI error: ${resp.status}` }, { status: 502 });

    const data = await resp.json() as { content: { type: string; text: string }[] };
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';

    let parsed: Record<string, string>;
    try {
      const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ ok: false, error: 'Malformed AI response' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, query: body.query, ...parsed });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
