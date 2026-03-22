import { NextRequest, NextResponse } from 'next/server';
import { ADAPTERS } from '@/lib/integrations';
import type { SyncResult } from '@/lib/integrations';

export async function POST(req: NextRequest) {
  try {
    const { integrations, since } = await req.json();
    // integrations: [{id: 'crowdstrike', credentials: {...}}]

    if (!Array.isArray(integrations) || integrations.length === 0) {
      return NextResponse.json({ results: [], totalAlerts: 0 });
    }

    const results: SyncResult[] = await Promise.allSettled(
      integrations.map(async ({ id, credentials }: { id: string; credentials: Record<string, string> }) => {
        const adapter = ADAPTERS[id];
        if (!adapter) return { toolId: id, alerts: [], error: 'Unknown integration', count: 0 };
        try {
          const alerts = await adapter.fetchAlerts(credentials, since);
          return { toolId: id, alerts, count: alerts.length };
        } catch(e: any) {
          console.error(`Integration sync error [${id}]:`, e.message);
          return { toolId: id, alerts: [], error: e.message, count: 0 };
        }
      })
    ).then(settled => settled.map(r => r.status === 'fulfilled' ? r.value : { toolId: 'unknown', alerts: [], error: 'Promise rejected', count: 0 }));

    const totalAlerts = results.reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({ results, totalAlerts, syncedAt: new Date().toISOString() });
  } catch(e: any) {
    console.error('Sync route error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
