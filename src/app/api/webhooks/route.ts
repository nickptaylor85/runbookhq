import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const configs = await loadTenantConfigs(tenantId);
  return NextResponse.json({ webhooks: configs.webhooks || [] });
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { action, url, events, name, webhookId } = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  if (!configs.webhooks) configs.webhooks = [];

  if (action === 'create' && url) {
    const id = 'wh_' + Date.now().toString(36);
    configs.webhooks.push({ id, name: name || url, url, events: events || ['alert.critical', 'sla.breach', 'incident.created'], enabled: true, createdAt: new Date().toISOString() });
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, id });
  }

  if (action === 'delete' && webhookId) {
    configs.webhooks = configs.webhooks.filter((w: any) => w.id !== webhookId);
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true });
  }

  if (action === 'fire') {
    // Fire a webhook event to all matching webhooks
    const { event, payload } = await req.json().catch(() => ({ event: null, payload: null }));
    const matching = configs.webhooks.filter((w: any) => w.enabled && (!w.events || w.events.includes(event)));
    const results = await Promise.all(matching.map(async (w: any) => {
      try {
        const r = await fetch(w.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Watchtower-Event': event || 'unknown' }, body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }) });
        return { url: w.url, ok: r.ok, status: r.status };
      } catch (e) { return { url: w.url, ok: false, error: String(e) }; }
    }));
    return NextResponse.json({ ok: true, fired: results.length, results });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
