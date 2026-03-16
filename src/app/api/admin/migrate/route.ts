import { NextResponse } from 'next/server';
import { loadToolConfigs, saveTenantConfigs, loadPlatformData, getTenantFromRequest } from '@/lib/config-store';

export async function POST(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  const user = platform.users?.[email || ''];
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 });
  }

  const { targetTenantId } = await req.json();
  const tenantId = targetTenantId || user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'No tenant ID' }, { status: 400 });

  // Load shared/legacy configs
  const shared = await loadToolConfigs();
  if (!shared.tools || Object.keys(shared.tools).length === 0) {
    return NextResponse.json({ error: 'No shared credentials to migrate' });
  }

  // Copy to tenant-scoped key
  await saveTenantConfigs(tenantId, { tools: shared.tools, updatedAt: new Date().toISOString() });

  return NextResponse.json({
    ok: true,
    message: `Migrated ${Object.keys(shared.tools).length} tool configs to tenant ${tenantId}`,
    tools: Object.keys(shared.tools),
  });
}
