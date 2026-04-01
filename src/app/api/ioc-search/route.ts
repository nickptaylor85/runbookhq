import { NextRequest, NextResponse } from 'next/server';
import { redisGet, KEYS, getAnthropicKey } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`ioc-search:${userId}`, 15, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json() as { ioc?: unknown };
    if (!body || typeof body.ioc !== 'string' || body.ioc.length > 500) {
      return NextResponse.json({ error: 'ioc string required (max 500 chars)' }, { status: 400 });
    }

    const { ioc } = body;
    const tenantId = getTenantId(req);

    // Load connected tools
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const connected: Record<string, Record<string, string>> = raw
      ? JSON.parse(decrypt(raw))
      : {};

    const results: Record<string, unknown> = {};

    // Search Tenable if connected
    if (connected.tenable) {
      try {
        const headers = {
          'X-ApiKeys': `accessKey=${connected.tenable.access_key};secretKey=${connected.tenable.secret_key}`,
          'Accept': 'application/json',
        };
        const res = await fetch(
          `https://cloud.tenable.com/workbenches/assets?filter.0.filter=host.hostname&filter.0.quality=match&filter.0.value=${encodeURIComponent(ioc)}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json() as { assets?: unknown[] };
          results.tenable = { found: (data.assets?.length || 0) > 0, count: data.assets?.length || 0 };
        }
      } catch (e: any) {
        results.tenable = { error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message };
      }
    }

    // Generate hunt queries via AI if API key available
    const apiKey = await getAnthropicKey(tenantId);
    if (apiKey) {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          system: 'You are a threat hunting assistant. Return only detection queries, no explanation.',
          messages: [{ role: 'user', content: `Generate Splunk SPL and Sentinel KQL queries to hunt for this IOC: ${ioc}. Plain text only, no markdown.` }],
        }),
      });
      if (resp.ok) {
        const d = await resp.json() as { content: Array<{ type: string; text: string }> };
        results.huntQueries = d.content?.find((b: any) => b.type === 'text')?.text || '';
      }
    }

    return NextResponse.json({ ok: true, ioc, results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
