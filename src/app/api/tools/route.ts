import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest, loadToolConfigs } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const configs = tenantId ? await loadTenantConfigs(tenantId) : await loadToolConfigs();
  return NextResponse.json(configs);
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 401 });

  const body = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  if (!configs.tools) configs.tools = {};

  if (body.toolId && body.credentials) {
    configs.tools[body.toolId] = {
      id: body.toolId,
      enabled: body.enabled !== false,
      credentials: body.credentials,
      status: 'untested',
    };
  } else if (body.tools) {
    configs.tools = body.tools;
  }

  configs.updatedAt = new Date().toISOString();
  await saveTenantConfigs(tenantId, configs);
  return NextResponse.json({ ok: true, updatedAt: configs.updatedAt });
}

export async function DELETE(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 401 });

  const { toolId } = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  if (configs.tools?.[toolId]) {
    delete configs.tools[toolId];
    await saveTenantConfigs(tenantId, configs);
  }
  return NextResponse.json({ ok: true });
}
