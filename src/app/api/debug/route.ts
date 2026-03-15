import { NextResponse } from 'next/server';
import { loadToolConfigs, hasKVStore } from '@/lib/config-store';
import { tenableHeaders, getConfiguredTools, getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function GET() {
  const debug: any = { timestamp: new Date().toISOString(), steps: {} };

  try {
    const kv = await hasKVStore();
    debug.steps.redis = { ok: kv };
  } catch (e) { debug.steps.redis = { ok: false, error: String(e) }; }

  try {
    const configs = await loadToolConfigs();
    debug.steps.configs = {
      ok: true,
      toolCount: Object.keys(configs.tools || {}).length,
      tools: Object.entries(configs.tools || {}).map(([id, t]: any) => ({
        id, enabled: t.enabled,
        credKeys: Object.keys(t.credentials || {}),
        credLengths: Object.entries(t.credentials || {}).map(([k, v]: any) => `${k}:${String(v||'').length}ch`),
      })),
    };
  } catch (e) { debug.steps.configs = { ok: false, error: String(e) }; }

  try {
    const tools = await getConfiguredTools();
    debug.steps.configuredTools = { ok: true, data: tools };
  } catch (e) { debug.steps.configuredTools = { ok: false, error: String(e) }; }

  // Tenable
  try {
    const headers = await tenableHeaders();
    debug.steps.tenable = { ok: !!headers };
    if (headers) {
      const res = await fetch('https://cloud.tenable.com/server/status', { headers, cache: 'no-store' });
      const body = await res.text();
      debug.steps.tenableApi = { ok: res.ok, status: res.status, body: body.substring(0, 200) };
    }
  } catch (e) { debug.steps.tenable = { ok: false, error: String(e) }; }

  // Taegis
  try {
    const token = await getTaegisToken();
    debug.steps.taegisToken = { ok: !!token, tokenPrefix: token ? token.substring(0, 15) + '...' : null };
    if (token) {
      try {
        const query = `query { alerts(first: 3, orderBy: { field: CREATED_AT, direction: DESC }) { edges { node { id title severity status createdAt } } } }`;
        const data = await taegisGraphQL(query, {}, token);
        debug.steps.taegisApi = {
          ok: !data.errors,
          alertCount: data.data?.alerts?.edges?.length || 0,
          sample: data.data?.alerts?.edges?.slice(0, 1) || [],
          errors: data.errors || null,
          keys: data.data ? Object.keys(data.data) : [],
          raw: JSON.stringify(data).substring(0, 500),
        };
      } catch (e) { debug.steps.taegisApi = { ok: false, error: String(e) }; }
    } else {
      debug.steps.taegisApi = { ok: false, reason: 'No token obtained' };
    }
  } catch (e) { debug.steps.taegisToken = { ok: false, error: String(e) }; }

  debug.steps.envVars = {
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    DASHBOARD_PASSWORD: !!process.env.DASHBOARD_PASSWORD,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  };

  return NextResponse.json(debug, { headers: { 'Cache-Control': 'no-store' } });
}
