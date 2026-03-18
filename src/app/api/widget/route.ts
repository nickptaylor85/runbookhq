import { NextResponse } from 'next/server';
import { loadPlatformData, loadTenantConfigs } from '@/lib/config-store';
import { validateApiKey } from '@/lib/crypto';

export async function GET(req: Request) {
  // Accept API key via query param or header
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || req.headers.get('x-api-key') || '';

  let tenantId: string | undefined;

  if (key) {
    const auth = await validateApiKey(new Request(req.url, { headers: { 'x-api-key': key } }));
    if (!auth.valid) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    tenantId = auth.tenantId || undefined;
  } else {
    // Allow with cookie auth too
    const cookie = req.headers.get('cookie') || '';
    const tenantMatch = cookie.match(/secops-tenant=([^;]+)/);
    tenantId = tenantMatch?.[1] || undefined;
    if (!tenantId) return NextResponse.json({ error: 'API key or session required' }, { status: 401 });
  }

  const configs = tenantId ? await loadTenantConfigs(tenantId) : {};
  const nr = (configs as any).noiseReduction?.stats || {};
  const slaTracking = ((configs as any).slaTracking || []).filter((s: any) => !s.resolvedAt);
  const slaBreached = slaTracking.filter((s: any) => {
    const deadline = new Date(s.createdAt).getTime() + 240 * 60000;
    return Date.now() > deadline;
  });
  const incidents = ((configs as any).incidents || []).filter((i: any) => i.status !== 'closed');

  // CORS headers for embedding
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cache-Control': 'public, max-age=60',
  };

  return NextResponse.json({
    status: slaBreached.length > 0 ? 'warning' : incidents.length > 0 ? 'active' : 'healthy',
    openIncidents: incidents.length,
    slaActive: slaTracking.length,
    slaBreached: slaBreached.length,
    noiseReduction: { autoClosed: nr.autoClosed || 0, timeSavedHours: Math.round((nr.timeSavedMins || 0) / 60 * 10) / 10 },
    updatedAt: new Date().toISOString(),
  }, { headers });
}
