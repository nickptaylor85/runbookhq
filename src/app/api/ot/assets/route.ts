import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, sanitiseKeySegment, KEYS } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';
import { OT_ASSET_FETCHERS, OT_TOOL_IDS } from '@/lib/integrations/ot-adapters';

export const maxDuration = 45;

const OT_ASSETS_KEY = (t: string) => `wt:${sanitiseKeySegment(t)}:ot_assets_cache`;
const CACHE_TTL = 300; // 5 minutes — asset inventory changes slowly

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const rl = await checkRateLimit(`ot-assets:${userId}`, 20, 60);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const refresh = req.nextUrl.searchParams.get('refresh') === '1';

  try {
    // Return cached if fresh and not forced refresh
    if (!refresh) {
      const cached = await redisGet(OT_ASSETS_KEY(tenantId));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < CACHE_TTL * 1000) {
          return NextResponse.json({ ok: true, assets: parsed.assets, cachedAt: parsed.cachedAt, fromCache: true });
        }
      }
    }

    // Load stored credentials
    const rawCreds = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const storedCreds: Record<string, Record<string, string>> = rawCreds
      ? JSON.parse(decrypt(rawCreds)) : {};

    const connectedOTTools = OT_TOOL_IDS.filter(id => storedCreds[id] && OT_ASSET_FETCHERS[id]);

    if (connectedOTTools.length === 0) {
      return NextResponse.json({ ok: true, assets: [], fromLive: false, message: 'No OT tools connected' });
    }

    const settled = await Promise.allSettled(
      connectedOTTools.map(id => OT_ASSET_FETCHERS[id](storedCreds[id]))
    );

    const assets = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value);

    // Deduplicate by IP — prefer Claroty data, then Nozomi, then others
    const seen = new Map<string, any>();
    for (const asset of assets) {
      const key = asset.ip || asset.mac || asset.id;
      if (!seen.has(key) || asset.source === 'Claroty') seen.set(key, asset);
    }
    const deduped = Array.from(seen.values());

    await redisSet(OT_ASSETS_KEY(tenantId), JSON.stringify({ assets: deduped, cachedAt: Date.now() }), CACHE_TTL * 2);

    return NextResponse.json({ ok: true, assets: deduped, fromLive: true, toolCount: connectedOTTools.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
