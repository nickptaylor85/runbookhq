import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, sanitiseKeySegment, KEYS } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import { ADAPTERS } from '@/lib/integrations';
import { checkRateLimit } from '@/lib/ratelimit';
import { OT_TOOL_IDS } from '@/lib/integrations/ot-adapters';

export const maxDuration = 30;

const OT_ALERTS_KEY = (t: string) => `wt:${sanitiseKeySegment(t)}:ot_alerts_cache`;
const CACHE_TTL = 120; // 2 minutes

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const rl = await checkRateLimit(`ot-alerts:${userId}`, 60, 60);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const refresh = req.nextUrl.searchParams.get('refresh') === '1';

  try {
    // Return cached if fresh and not forced refresh
    if (!refresh) {
      const cached = await redisGet(OT_ALERTS_KEY(tenantId));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < CACHE_TTL * 1000) {
          return NextResponse.json({ ok: true, alerts: parsed.alerts, cachedAt: parsed.cachedAt, fromCache: true });
        }
      }
    }

    // Load stored credentials
    const rawCreds = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const storedCreds: Record<string, Record<string, string>> = rawCreds
      ? JSON.parse(decrypt(rawCreds)) : {};

    // Only pull from connected OT tools
    const connectedOTTools = OT_TOOL_IDS.filter(id => storedCreds[id]);

    if (connectedOTTools.length === 0) {
      return NextResponse.json({ ok: true, alerts: [], fromLive: false, message: 'No OT tools connected' });
    }

    const since = Date.now() - 7 * 86400000;
    const settled = await Promise.allSettled(
      connectedOTTools.map(async (id) => {
        const adapter = ADAPTERS[id];
        if (!adapter) return [];
        const alerts = await adapter.fetchAlerts(storedCreds[id], since);
        // Tag all alerts as OT
        return alerts.map(a => ({ ...a, tags: [...(a.tags || []), 'ot', 'ics'], _otSource: id }));
      })
    );

    const alerts = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value);

    // Cache result
    await redisSet(OT_ALERTS_KEY(tenantId), JSON.stringify({ alerts, cachedAt: Date.now() }), CACHE_TTL * 2);

    return NextResponse.json({ ok: true, alerts, fromLive: true, toolCount: connectedOTTools.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
