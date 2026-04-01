import { NextRequest, NextResponse } from 'next/server';
import { redisHSet, redisHGetAll, redisHDel, KEYS , sanitiseTenantId } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}

function webhooksKey(tenantId: string) {
  return `wt:${tenantId}:webhooks`;
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = getTenantId(req);
    const raw = await redisHGetAll(webhooksKey(tenantId));
    const webhooks = Object.entries(raw || {}).map(([id, val]) => {
      try { return { id, ...JSON.parse(val) }; } catch { return { id, url: val, events: ['alert.critical'] }; }
    });
    return NextResponse.json({ ok: true, webhooks });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, webhooks: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as { url?: string; events?: string[]; id?: string; action?: string };

    // Delete action
    if (body.action === 'delete' && body.id) {
      await redisHDel(webhooksKey(tenantId), body.id);
      return NextResponse.json({ ok: true, deleted: body.id });
    }

    // Validate URL
    if (!body.url) return NextResponse.json({ error: 'url required' }, { status: 400 });
    let parsedUrl: URL;
    try { parsedUrl = new URL(body.url); } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'URL must be http or https' }, { status: 400 });
    }
    // SSRF protection: block private/internal IP ranges and localhost
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivate = (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname === '169.254.169.254' || // AWS metadata
      hostname === 'metadata.google.internal' || // GCP metadata
      /^fd[0-9a-f]{2}:/i.test(hostname) || // IPv6 ULA
      hostname === '::1' // IPv6 localhost
    );
    if (isPrivate) {
      return NextResponse.json({ error: 'Webhook URL cannot point to internal/private addresses' }, { status: 400 });
    }

    const id = body.id || `wh_${Date.now()}`;
    const events = body.events?.length ? body.events : ['alert.critical', 'incident.created'];
    await redisHSet(webhooksKey(tenantId), id, JSON.stringify({ url: body.url, events, createdAt: new Date().toISOString() }));

    // Send a test ping
    try {
      await fetch(body.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Watchtower-Event': 'webhook.test' },
        body: JSON.stringify({ event: 'webhook.test', source: 'Watchtower', timestamp: new Date().toISOString(), message: 'Webhook registered successfully' }),
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* test ping failed — still save */ }

    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}

