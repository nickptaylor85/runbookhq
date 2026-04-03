import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { randomBytes, createHmac } from 'crypto';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}
const apiKeysKey = (t: string) => `wt:${t}:api_keys`;

interface ApiKey {
  id: string; name: string; prefix: string;
  hash: string; createdAt: number; lastUsed?: number; scopes: string[];
}

function hashKey(key: string): string {
  return createHmac('sha256', process.env.WATCHTOWER_SESSION_SECRET || 'wt-dev-secret').update(key).digest('hex');
}

export async function GET(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 200, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  try {
    const tenantId = getTenantId(req);
    const raw = await redisGet(apiKeysKey(tenantId));
    const keys: ApiKey[] = raw ? JSON.parse(raw) : [];
    // Never return the hash — return only safe fields
    return NextResponse.json({ ok: true, keys: keys.map(({ id, name, prefix, createdAt, lastUsed, scopes }) => ({ id, name, prefix, createdAt, lastUsed, scopes })) });
  } catch {
    return NextResponse.json({ ok: true, keys: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    // Provisioned tenant users cannot create API keys — only global tenant (staff) can
    if (tenantId !== 'global') {
      return NextResponse.json({ ok: false, error: 'API key creation is not available for this account type.' }, { status: 403 });
    }
    const body = await req.json() as { name: string; scopes?: string[] };
    const { name, scopes = ['read:alerts', 'read:incidents'] } = body;
    if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });

    const raw = await redisGet(apiKeysKey(tenantId));
    const keys: ApiKey[] = raw ? JSON.parse(raw) : [];
    if (keys.length >= 10) return NextResponse.json({ ok: false, error: 'Max 10 API keys per tenant' }, { status: 400 });

    const secret = `wt_live_${randomBytes(24).toString('hex')}`;
    const prefix = secret.slice(0, 14);
    const newKey: ApiKey = { id: randomBytes(8).toString('hex'), name, prefix, hash: hashKey(secret), createdAt: Date.now(), scopes };
    keys.push(newKey);
    await redisSet(apiKeysKey(tenantId), JSON.stringify(keys));

    // Return the full key only once — never again
    return NextResponse.json({ ok: true, key: secret, id: newKey.id, prefix, scopes });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as { id: string };
    const raw = await redisGet(apiKeysKey(tenantId));
    const keys: ApiKey[] = raw ? JSON.parse(raw) : [];
    const filtered = keys.filter(k => k.id !== body.id);
    await redisSet(apiKeysKey(tenantId), JSON.stringify(filtered));
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
