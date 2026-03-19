import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

// GET: Get SLA config + current status
export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  if (await isDemoMode(getTenantFromRequest(req).tenantId)) {
    return NextResponse.json({ active: [
      { id: 'sla-1', alertId: 'da-002', alertTitle: 'Credential dumping via LSASS', severity: 'critical', createdAt: new Date(Date.now() - 2400000).toISOString(), targetMins: 60, remainingMins: 20, breached: false, urgent: false },
      { id: 'sla-2', alertId: 'da-003', alertTitle: 'C2 beacon to threat actor IP', severity: 'critical', createdAt: new Date(Date.now() - 3000000).toISOString(), targetMins: 60, remainingMins: 8, breached: false, urgent: true },
      { id: 'sla-3', alertId: 'ta-001', alertTitle: 'Brute force on VPN gateway', severity: 'high', createdAt: new Date(Date.now() - 7200000).toISOString(), targetMins: 240, remainingMins: 120, breached: false, urgent: false },
    ], targets: { critical: 60, high: 240, medium: 480 }, compliance: 91, demo: true });
  }
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const configs = await loadTenantConfigs(tenantId);
  const sla = configs.slaConfig || { critical: { respondMins: 15, resolveMins: 240 }, high: { respondMins: 60, resolveMins: 480 }, medium: { respondMins: 240, resolveMins: 1440 } };
  const tracked = configs.slaTracking || [];
  const now = Date.now();
  const active = tracked.filter((t: any) => !t.resolvedAt).map((t: any) => {
    const deadlineMins = sla[t.severity]?.resolveMins || 240;
    const createdMs = new Date(t.createdAt).getTime();
    const deadlineMs = createdMs + deadlineMins * 60000;
    const remainingMs = deadlineMs - now;
    return { ...t, deadlineAt: new Date(deadlineMs).toISOString(), remainingMs, remainingMins: Math.floor(remainingMs / 60000), breached: remainingMs <= 0, urgent: remainingMs > 0 && remainingMs < 30 * 60000 };
  });
  return NextResponse.json({ sla, active: active.sort((a: any, b: any) => a.remainingMs - b.remainingMs), totalTracked: tracked.length, breached: active.filter((a: any) => a.breached).length });
}

// POST: Track an alert or update SLA config
export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { action, alertId, alertTitle, severity, config } = await req.json();
  const configs = await loadTenantConfigs(tenantId);

  if (action === 'configure' && config) {
    configs.slaConfig = config;
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, message: 'SLA config updated' });
  }

  if (action === 'track' && alertId) {
    if (!configs.slaTracking) configs.slaTracking = [];
    if (configs.slaTracking.find((t: any) => t.alertId === alertId)) return NextResponse.json({ error: 'Already tracked' }, { status: 409 });
    configs.slaTracking.push({ alertId, alertTitle: alertTitle || '', severity: severity || 'high', createdAt: new Date().toISOString(), acknowledgedAt: null, resolvedAt: null });
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, message: 'Alert added to SLA tracking' });
  }

  if (action === 'acknowledge' && alertId) {
    const item = (configs.slaTracking || []).find((t: any) => t.alertId === alertId);
    if (item) { item.acknowledgedAt = new Date().toISOString(); await saveTenantConfigs(tenantId, configs); }
    return NextResponse.json({ ok: true });
  }

  if (action === 'resolve' && alertId) {
    const item = (configs.slaTracking || []).find((t: any) => t.alertId === alertId);
    if (item) { item.resolvedAt = new Date().toISOString(); await saveTenantConfigs(tenantId, configs); }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
