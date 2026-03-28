import { redisHGetAll } from '@/lib/redis';

export async function fireWebhook(tenantId: string, event: string, payload: Record<string, unknown>) {
  try {
    const raw = await redisHGetAll(`wt:${tenantId}:webhooks`);
    const hooks = Object.values(raw || {}).map(v => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean);
    await Promise.allSettled(
      hooks
        .filter((h: any) => h.events?.includes(event) || h.events?.includes('*'))
        .map((h: any) => fetch(h.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Watchtower-Event': event },
          body: JSON.stringify({ event, source: 'Watchtower', timestamp: new Date().toISOString(), tenantId, ...payload }),
          signal: AbortSignal.timeout(8000),
        }))
    );
  } catch { /* fire and forget */ }
}
