import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, KEYS } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

// Unified alerts: merges live alerts from all connected tools stored in Redis after sync
// Returns a unified feed with source attribution and deduplication

function getTenantId(req: NextRequest) {
  return req.headers.get('x-tenant-id') || 'global';
}

const CACHE_KEY = (t: string) => `wt:${t}:unified_alerts`;

interface UnifiedAlert {
  id: string;
  title: string;
  severity: string;
  source: string;
  device: string;
  time: string;
  rawTime?: string;
  verdict: string;
  confidence?: number;
  mitre?: string;
  description?: string;
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = getTenantId(req);
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 1000);
    const severity = url.searchParams.get('severity');
    const source = url.searchParams.get('source');

    // Try cache first (60s TTL)
    const cached = await redisGet(CACHE_KEY(tenantId));
    let alerts: UnifiedAlert[] = [];

    if (cached) {
      const parsed = JSON.parse(cached) as { alerts: UnifiedAlert[]; cachedAt: number };
      if (Date.now() - parsed.cachedAt < 60000) {
        alerts = parsed.alerts;
      }
    }

    // If no cache, check per-tool alert stores from sync
    if (alerts.length === 0) {
      const syncKey = `wt:${tenantId}:last_sync_results`;
      const syncRaw = await redisGet(syncKey);
      if (syncRaw) {
        const syncResults = JSON.parse(syncRaw) as Record<string, { alerts: UnifiedAlert[] }>;
        const seen = new Set<string>();
        for (const [toolId, result] of Object.entries(syncResults)) {
          if (result?.alerts) {
            for (const a of result.alerts) {
              // Deduplicate by title+device
              const dedupeKey = `${a.title}:${a.device || ''}`;
              if (!seen.has(dedupeKey)) {
                seen.add(dedupeKey);
                alerts.push({ ...a, source: a.source || toolId });
              }
            }
          }
        }
        // Sort by severity then time
        const sevOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        alerts.sort((a, b) => (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4));
        // Cache merged result
        await redisSet(CACHE_KEY(tenantId), JSON.stringify({ alerts, cachedAt: Date.now() }));
      }
    }

    // Filter
    let filtered = alerts;
    if (severity) filtered = filtered.filter(a => a.severity === severity);
    if (source) filtered = filtered.filter(a => a.source.toLowerCase().includes(source.toLowerCase()));

    return NextResponse.json({
      ok: true,
      alerts: filtered.slice(0, limit),
      total: filtered.length,
      sources: [...new Set(alerts.map(a => a.source))],
      cachedAt: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, alerts: [] }, { status: 500 });
  }
}
