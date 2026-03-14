import { NextResponse } from 'next/server';
import { loadToolConfigs, hasKVStore } from '@/lib/config-store';
import { tenableHeaders, getConfiguredTools } from '@/lib/api-clients';

export async function GET() {
  const debug: any = { timestamp: new Date().toISOString(), steps: {} };

  // 1. Redis
  try {
    const kv = await hasKVStore();
    debug.steps.redis = { ok: kv, url: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL), token: !!(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN) };
  } catch (e) { debug.steps.redis = { ok: false, error: String(e) }; }

  // 2. Load configs from Redis
  try {
    const configs = await loadToolConfigs();
    debug.steps.configs = {
      ok: true,
      toolCount: Object.keys(configs.tools || {}).length,
      tools: Object.entries(configs.tools || {}).map(([id, t]: any) => ({
        id, enabled: t.enabled, credKeys: Object.keys(t.credentials || {}),
        credLengths: Object.entries(t.credentials || {}).map(([k, v]: any) => `${k}:${String(v||'').length}ch`),
      })),
      updatedAt: configs.updatedAt,
    };
  } catch (e) { debug.steps.configs = { ok: false, error: String(e) }; }

  // 3. Configured tools detection
  try {
    const tools = await getConfiguredTools();
    debug.steps.configuredTools = { ok: true, data: tools };
  } catch (e) { debug.steps.configuredTools = { ok: false, error: String(e) }; }

  // 4. Tenable test
  try {
    const headers = await tenableHeaders();
    debug.steps.tenableHeaders = { ok: !!headers };
    if (headers) {
      try {
        const res = await fetch('https://cloud.tenable.com/server/status', { headers, cache: 'no-store' });
        const body = await res.text();
        debug.steps.tenableApi = { ok: res.ok, status: res.status, body: body.substring(0, 500) };
      } catch (e) { debug.steps.tenableApi = { ok: false, error: String(e) }; }
    } else {
      debug.steps.tenableApi = { ok: false, reason: 'No headers - credentials not found' };
    }
  } catch (e) { debug.steps.tenableHeaders = { ok: false, error: String(e) }; }

  // 5. Env vars present (names only, not values)
  debug.steps.envVars = {
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    DASHBOARD_PASSWORD: !!process.env.DASHBOARD_PASSWORD,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    TENABLE_ACCESS_KEY: !!process.env.TENABLE_ACCESS_KEY,
  };

  return NextResponse.json(debug, { headers: { 'Cache-Control': 'no-store' } });
}
