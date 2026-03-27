import { NextRequest, NextResponse } from 'next/server';
import { redisHSet, redisHGetAll, KEYS } from '@/lib/redis';

const ALLOWED_SETTINGS = new Set([
  'industry', 'demoMode', 'automation', 'userTier', 'clientBanner', 'theme', 'slack_webhook', 'notif_critical', 'notif_incidents', 'notif_digest', 'notif_sync'
]);

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const settings = await redisHGetAll(KEYS.TENANT_SETTINGS(tenantId));
    return NextResponse.json({ ok: true, settings });
  } catch (e: any) {
    return NextResponse.json({ ok: false, settings: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const tenantId = getTenantId(req);
    
    // Only allow whitelisted settings keys, sanitize values
    const allowed: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_SETTINGS.has(key)) continue;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
      const strVal = String(value).slice(0, 500); // max 500 chars
      allowed[key] = strVal;
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
    }

    await Promise.all(
      Object.entries(allowed).map(([key, value]) =>
        redisHSet(KEYS.TENANT_SETTINGS(tenantId), key, value)
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
