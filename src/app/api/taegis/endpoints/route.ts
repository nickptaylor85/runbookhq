import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, KEYS } from '@/lib/redis';

const CACHE_KEY = (t: string) => `wt:${t}:taegis_endpoints`;

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';

    // 5-min cache
    const cached = await redisGet(CACHE_KEY(tenantId));
    if (cached) {
      const p = JSON.parse(cached);
      if (Date.now() - p.cachedAt < 5 * 60000) {
        return NextResponse.json({ ok: true, ...p, cached: true });
      }
    }

    const credsRaw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    if (!credsRaw) return NextResponse.json({ ok: false, error: 'No credentials' }, { status: 503 });

    const creds = JSON.parse(credsRaw) as Record<string, Record<string, string>>;
    const taegis = creds.taegis;
    if (!taegis?.clientId || !taegis?.clientSecret) {
      return NextResponse.json({ ok: false, error: 'Taegis credentials not configured' }, { status: 503 });
    }

    const { clientId, clientSecret, region = 'us1' } = taegis;
    const host = region === 'us1' ? 'api.ctpx.secureworks.com' : `api.${region}.taegis.secureworks.com`;

    const tokenRes = await fetch(`https://${host}/auth/api/v2/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    if (!tokenRes.ok) return NextResponse.json({ ok: false, error: `Auth failed: ${tokenRes.status}` }, { status: 502 });
    const { access_token: token } = await tokenRes.json() as { access_token: string };

    const query = `
      query ListEndpoints {
        endpointsQuery(limit: 200) {
          assets {
            id
            hostnames
            os
            sensorVersion
            lastSeen
            isolationStatus
            networkInterfaces { addresses }
            tags
          }
        }
      }
    `;
    const res = await fetch(`https://${host}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: `GraphQL failed: ${res.status}` }, { status: 502 });

    const data = await res.json() as any;
    const assets = data?.data?.endpointsQuery?.assets || [];

    const result = { assets, count: assets.length, cachedAt: Date.now() };
    await redisSet(CACHE_KEY(tenantId), JSON.stringify(result)).catch(() => {});

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
