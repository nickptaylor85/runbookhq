import { NextRequest, NextResponse } from 'next/server';
import { ADAPTERS } from '@/lib/integrations';
import { validateCredentials } from '@/lib/ssrf';
import { checkRateLimit } from '@/lib/ratelimit';
import { redisGet, KEYS } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import type { SyncResult } from '@/lib/integrations';

// Extend max execution time — Tenable makes 2 sequential API calls, needs headroom
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`sync:${userId}`, 30, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json() as { integrations?: unknown; since?: unknown };
    const since = typeof body.since === 'number' ? body.since : Date.now() - 7 * 86400000;

    // Load credentials directly from Redis — never trust client-supplied creds
    // This prevents masked values (••••••••) from being used in sync
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const storedCreds: Record<string, Record<string, string>> = raw
      ? JSON.parse(decrypt(raw))
      : {};

    // Use client-supplied tool IDs to know which tools to sync,
    // but use the server-side decrypted credentials
    const requestedIds: string[] = Array.isArray(body.integrations)
      ? body.integrations
          .filter((i: any) => typeof i?.id === 'string')
          .map((i: any) => i.id)
          .slice(0, 20)
      : Object.keys(storedCreds);

    // Only sync tools that are actually connected
    const toSync = requestedIds.filter(id => storedCreds[id]);

    if (toSync.length === 0) {
      return NextResponse.json({ results: [], totalAlerts: 0, syncedAt: new Date().toISOString() });
    }

    const results: SyncResult[] = await Promise.allSettled(
      toSync.map(async (id) => {
        const credentials = storedCreds[id];

        // SSRF check on credential URL fields
        const ssrfCheck = validateCredentials(id, credentials);
        if (!ssrfCheck.ok) {
          return { toolId: id, alerts: [], error: `SSRF blocked: ${ssrfCheck.error}`, count: 0 };
        }

        const adapter = ADAPTERS[id];
        if (!adapter) return { toolId: id, alerts: [], error: 'Unknown integration', count: 0 };
        try {
          const t0 = Date.now();
          const alerts = await adapter.fetchAlerts(credentials, since);
          const durationMs = Date.now() - t0;
          console.log(`[sync] ${id}: ${alerts.length} records ${durationMs}ms`);
          return { toolId: id, alerts, count: alerts.length, durationMs };
        } catch (e: any) {
          const errMsg = e?.message || String(e);
          const cause = e?.cause?.message || e?.cause?.code || '';
          const fullErr = cause ? `${errMsg} (${cause})` : errMsg;
          console.error(`Sync error [${id}]: ${fullErr}`);
          return { toolId: id, alerts: [], error: fullErr, count: 0 };
        }
      })
    ).then(settled => settled.map(r =>
      r.status === 'fulfilled' ? r.value :
      { toolId: 'unknown', alerts: [], error: 'Promise rejected', count: 0 }
    ));

    return NextResponse.json({
      results,
      totalAlerts: results.reduce((s, r) => s + r.count, 0),
      syncedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
