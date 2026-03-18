import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest, loadToolConfigs } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const configs = tenantId ? await loadTenantConfigs(tenantId) : await loadToolConfigs();

  // If tenant has no tools, check if there are shared/legacy tools to suggest migration
  if (tenantId && (!configs.tools || Object.keys(configs.tools).length === 0)) {
    const shared = await loadToolConfigs();
    if (shared.tools && Object.keys(shared.tools).length > 0) {
      return NextResponse.json({
        ...configs,
        kvAvailable: !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL),
        _migrationAvailable: true,
        _sharedToolCount: Object.keys(shared.tools).length,
        _sharedToolIds: Object.keys(shared.tools),
      });
    }
  }

  // Add kvAvailable flag
  const hasKV = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
  const result = { ...configs, kvAvailable: hasKV };

  // If demo mode, simulate all tools being connected
  if (result.tools?.['_demo']?.enabled) {
    const demoTools: Record<string, any> = {
      _demo: { id: '_demo', enabled: true, credentials: { mode: 'demo' }, status: 'ok' },
      tenable: { id: 'tenable', enabled: true, credentials: { demo: true }, status: 'ok' },
      taegis: { id: 'taegis', enabled: true, credentials: { demo: true }, status: 'ok' },
      defender: { id: 'defender', enabled: true, credentials: { demo: true }, status: 'ok' },
      crowdstrike: { id: 'crowdstrike', enabled: true, credentials: { demo: true }, status: 'ok' },
      zscaler: { id: 'zscaler', enabled: true, credentials: { demo: true }, status: 'ok' },
      anthropic: { id: 'anthropic', enabled: true, credentials: { demo: true }, status: 'ok' },
    };
    result.tools = { ...demoTools, ...(result.tools || {}) };
  }

  return NextResponse.json(result);
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
  if (!toolId) return NextResponse.json({ error: 'toolId required' }, { status: 400 });

  const configs = await loadTenantConfigs(tenantId);

  if (configs.tools?.[toolId]) {
    // Capture what's being deleted for audit
    const deletedTool = configs.tools[toolId];

    // Remove the tool and ALL its credentials
    delete configs.tools[toolId];

    // Clear any cached data keys for this tool
    if (configs[`cache_${toolId}`]) delete configs[`cache_${toolId}`];
    if (configs[`lastFetch_${toolId}`]) delete configs[`lastFetch_${toolId}`];

    configs.updatedAt = new Date().toISOString();
    await saveTenantConfigs(tenantId, configs);

    return NextResponse.json({
      ok: true,
      message: `Removed ${toolId} and all credentials`,
      removed: { id: toolId, credentialKeys: Object.keys(deletedTool.credentials || {}) },
    });
  }

  return NextResponse.json({ ok: true, message: 'Tool not found (already removed)' });
}
