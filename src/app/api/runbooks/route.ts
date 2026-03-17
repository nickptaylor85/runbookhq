import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const configs = await loadTenantConfigs(tenantId);
  return NextResponse.json({ runbooks: configs.customRunbooks || [] });
}

export async function POST(req: Request) {
  const { tenantId, email } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { action, id, title, triggerKeywords, severity, steps, category } = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  if (!configs.customRunbooks) configs.customRunbooks = [];

  if (action === 'create') {
    const newId = 'rb_' + Date.now().toString(36);
    configs.customRunbooks.push({
      id: newId, title: title || 'New Runbook',
      triggerKeywords: triggerKeywords || [],
      severity: severity || 'all',
      category: category || 'General',
      steps: steps || [{ title: 'Step 1', detail: '', cmd: null }],
      createdBy: email, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), usageCount: 0,
    });
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, id: newId });
  }

  if (action === 'update' && id) {
    const rb = configs.customRunbooks.find((r: any) => r.id === id);
    if (!rb) return NextResponse.json({ error: 'Runbook not found' }, { status: 404 });
    if (title !== undefined) rb.title = title;
    if (triggerKeywords !== undefined) rb.triggerKeywords = triggerKeywords;
    if (severity !== undefined) rb.severity = severity;
    if (category !== undefined) rb.category = category;
    if (steps !== undefined) rb.steps = steps;
    rb.updatedAt = new Date().toISOString();
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete' && id) {
    configs.customRunbooks = configs.customRunbooks.filter((r: any) => r.id !== id);
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true });
  }

  if (action === 'duplicate' && id) {
    const rb = configs.customRunbooks.find((r: any) => r.id === id);
    if (!rb) return NextResponse.json({ error: 'Runbook not found' }, { status: 404 });
    const newId = 'rb_' + Date.now().toString(36);
    configs.customRunbooks.push({ ...rb, id: newId, title: rb.title + ' (copy)', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0 });
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, id: newId });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
