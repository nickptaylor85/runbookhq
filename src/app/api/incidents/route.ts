import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const configs = await loadTenantConfigs(tenantId);
  const incidents = (configs.incidents || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ incidents, total: incidents.length });
}

export async function POST(req: Request) {
  const { tenantId, email } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { action, incidentId, title, severity, description, alertId, alertTitle, note, status } = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  if (!configs.incidents) configs.incidents = [];

  if (action === 'create') {
    const id = 'INC-' + Date.now().toString(36).toUpperCase();
    const incident = { id, title: title || 'New Incident', severity: severity || 'high', status: 'open', description: description || '', createdAt: new Date().toISOString(), createdBy: email, timeline: [{ type: 'created', time: new Date().toISOString(), by: email, detail: 'Incident created' }], alerts: [], assignee: email };
    if (alertId) { incident.alerts.push({ id: alertId, title: alertTitle || '', addedAt: new Date().toISOString() }); incident.timeline.push({ type: 'alert_added', time: new Date().toISOString(), by: email, detail: `Alert added: ${alertTitle || alertId}` }); }
    configs.incidents.push(incident);
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, incident });
  }

  if (action === 'add_alert' && incidentId && alertId) {
    const inc = configs.incidents.find((i: any) => i.id === incidentId);
    if (!inc) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    if (inc.alerts.find((a: any) => a.id === alertId)) return NextResponse.json({ error: 'Alert already in incident' }, { status: 409 });
    inc.alerts.push({ id: alertId, title: alertTitle || '', addedAt: new Date().toISOString() });
    inc.timeline.push({ type: 'alert_added', time: new Date().toISOString(), by: email, detail: `Alert added: ${alertTitle || alertId}` });
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true });
  }

  if (action === 'add_note' && incidentId && note) {
    const inc = configs.incidents.find((i: any) => i.id === incidentId);
    if (!inc) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    inc.timeline.push({ type: 'note', time: new Date().toISOString(), by: email, detail: note });
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    const incidentId = body.incidentId;
    if (!incidentId) return NextResponse.json({ error: 'incidentId required' }, { status: 400 });
    const idx = incidents.findIndex((i: any) => i.id === incidentId);
    if (idx >= 0) {
      incidents.splice(idx, 1);
      (configs as any).incidents = incidents;
      await saveTenantConfigs(tenantId, configs as any);
      return NextResponse.json({ ok: true, deleted: incidentId });
    }
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  if (action === 'update_status' && incidentId && status) {
    const inc = configs.incidents.find((i: any) => i.id === incidentId);
    if (!inc) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    const prev = inc.status;
    inc.status = status;
    if (status === 'closed') inc.closedAt = new Date().toISOString();
    inc.timeline.push({ type: 'status_change', time: new Date().toISOString(), by: email, detail: `Status: ${prev} → ${status}` });
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
