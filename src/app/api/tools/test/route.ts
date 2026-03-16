import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { loadToolConfigs, hasKVStore } from '@/lib/config-store';
import { tenableHeaders, tenableAPI, getConfiguredTools } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { toolId } = await req.json();
  const results: any = { toolId, steps: [] };

  const kvOk = await hasKVStore();
  results.steps.push({ step: 'Redis', ok: kvOk });

  let configs;
  try {
    configs = await loadToolConfigs(tenantId || undefined);
    const tc = configs.tools?.[toolId];
    results.steps.push({ step: 'Config loaded', ok: !!tc, enabled: tc?.enabled, keys: tc?.credentials ? Object.entries(tc.credentials).map(([k, v]) => ({ key: k, len: (v as string)?.length || 0 })) : [] });
  } catch (e) {
    results.steps.push({ step: 'Config load', ok: false, error: (e as Error).message });
    return NextResponse.json(results);
  }

  const configured = await getConfiguredTools();
  results.steps.push({ step: 'Tools detected', data: configured });

  if (toolId === 'tenable') {
    const headers = await tenableHeaders(tenantId || undefined);
    results.steps.push({ step: 'Headers built', ok: !!headers });
    if (headers) {
      try {
        const res = await fetch('https://cloud.tenable.com/server/status', { headers, cache: 'no-store' });
        const text = await res.text();
        results.steps.push({ step: 'API response', ok: res.ok, status: res.status, body: text.substring(0, 300) });
      } catch (e) {
        results.steps.push({ step: 'API call', ok: false, error: (e as Error).message });
      }
    }
  }

  if (toolId === 'anthropic') {
    const key = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    results.steps.push({ step: 'Key found', ok: !!key, prefix: key ? key.substring(0, 12) + '...' : null });
    if (key) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'Say OK' }] }) });
        const data = await res.json();
        results.steps.push({ step: 'API response', ok: res.ok, status: res.status, text: data.content?.[0]?.text || data.error?.message || 'unknown' });
      } catch (e) {
        results.steps.push({ step: 'API call', ok: false, error: (e as Error).message });
      }
    }
  }

  return NextResponse.json(results);
}
