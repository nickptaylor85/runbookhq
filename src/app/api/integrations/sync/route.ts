import { NextRequest, NextResponse } from 'next/server';
import { ADAPTERS } from '@/lib/integrations';
import { validateCredentials } from '@/lib/ssrf';
import { checkRateLimit } from '@/lib/ratelimit';
import type { SyncResult } from '@/lib/integrations';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 30 syncs/min per user
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`sync:${userId}`, 30, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json() as { integrations: unknown; since: unknown };
    
    if (!Array.isArray(body.integrations) || body.integrations.length === 0) {
      return NextResponse.json({ results: [], totalAlerts: 0 });
    }

    // Limit to 20 integrations max
    const integrations = body.integrations.slice(0, 20);
    const since = typeof body.since === 'number' ? body.since : Date.now() - 7 * 86400000;

    const results: SyncResult[] = await Promise.allSettled(
      integrations.map(async (item: any) => {
        if (!item || typeof item.id !== 'string' || typeof item.credentials !== 'object') {
          return { toolId: 'unknown', alerts: [], error: 'Invalid integration spec', count: 0 };
        }
        const { id, credentials } = item as { id: string; credentials: Record<string, string> };
        
        // SSRF check on all URL fields
        const ssrfCheck = validateCredentials(id, credentials);
        if (!ssrfCheck.ok) {
          return { toolId: id, alerts: [], error: `SSRF blocked: ${ssrfCheck.error}`, count: 0 };
        }

        const adapter = ADAPTERS[id];
        if (!adapter) return { toolId: id, alerts: [], error: 'Unknown integration', count: 0 };
        try {
          const alerts = await adapter.fetchAlerts(credentials, since);
          return { toolId: id, alerts, count: alerts.length };
        } catch (e: any) {
          console.error(`Sync error [${id}]:`, e.message);
          return { toolId: id, alerts: [], error: e.message, count: 0 };
        }
      })
    ).then(settled => settled.map(r => r.status === 'fulfilled' ? r.value : 
      { toolId: 'unknown', alerts: [], error: 'Promise rejected', count: 0 }));

    return NextResponse.json({ 
      results, 
      totalAlerts: results.reduce((s, r) => s + r.count, 0),
      syncedAt: new Date().toISOString() 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
