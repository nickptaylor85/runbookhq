// ═══ API Clients — checks Redis (GUI-saved creds) then env vars ═══
import { loadToolConfigs } from './config-store';

let _cachedConfigs: any = null;
let _cacheTime = 0;

async function getConfigs() {
  // Cache for 30 seconds to avoid hammering Redis
  if (_cachedConfigs && Date.now() - _cacheTime < 30000) return _cachedConfigs;
  try {
    _cachedConfigs = await loadToolConfigs();
    _cacheTime = Date.now();
  } catch (e) {
    _cachedConfigs = { tools: {} };
  }
  return _cachedConfigs;
}

function getCred(toolId: string, key: string, configs: any): string {
  // Check Redis-saved creds first, then env vars
  return configs?.tools?.[toolId]?.credentials?.[key] || process.env[key] || '';
}

// ═══ DEFENDER ═══
export async function getDefenderToken(): Promise<string | null> {
  const c = await getConfigs();
  const tenantId = getCred('defender', 'AZURE_TENANT_ID', c);
  const clientId = getCred('defender', 'AZURE_CLIENT_ID', c);
  const clientSecret = getCred('defender', 'AZURE_CLIENT_SECRET', c);
  if (!tenantId || !clientId || !clientSecret) return null;
  try {
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&scope=https://graph.microsoft.com/.default&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    });
    const data = await res.json();
    return data.access_token || null;
  } catch { return null; }
}

export async function getMDEToken(): Promise<string | null> {
  const c = await getConfigs();
  const tenantId = getCred('defender', 'AZURE_TENANT_ID', c);
  const clientId = getCred('defender', 'AZURE_CLIENT_ID', c);
  const clientSecret = getCred('defender', 'AZURE_CLIENT_SECRET', c);
  if (!tenantId || !clientId || !clientSecret) return null;
  try {
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&scope=https://api.securitycenter.microsoft.com/.default&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    });
    const data = await res.json();
    return data.access_token || null;
  } catch { return null; }
}

export async function defenderAPI(path: string, token: string) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/security${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  return res.json();
}

export async function mdeAPI(path: string, token: string) {
  const res = await fetch(`https://api.securitycenter.microsoft.com/api${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  return res.json();
}

// ═══ TAEGIS ═══
const TAEGIS_REGIONS: Record<string, string> = {
  'us': 'https://api.ctpx.secureworks.com',
  'us1': 'https://api.ctpx.secureworks.com',
  'us2': 'https://api.delta.taegis.secureworks.com',
  'us3': 'https://api.foxtrot.taegis.secureworks.com',
  'eu': 'https://api.echo.taegis.secureworks.com',
  'eu1': 'https://api.echo.taegis.secureworks.com',
  'eu2': 'https://api.golf.taegis.secureworks.com',
};

export async function getTaegisToken(tenantId?: string): Promise<{ token: string; base: string } | null> {
  const c = await getConfigs(tenantId);
  const clientId = getCred('taegis', 'TAEGIS_CLIENT_ID', c);
  const clientSecret = getCred('taegis', 'TAEGIS_CLIENT_SECRET', c);
  const region = (getCred('taegis', 'TAEGIS_REGION', c) || 'us').toLowerCase();
  if (!clientId || !clientSecret) return null;
  // Try saved region first, then all others
  const savedBase = TAEGIS_REGIONS[region] || TAEGIS_REGIONS['us'];
  const allBases = [savedBase, ...Object.values(TAEGIS_REGIONS).filter(b => b !== savedBase)];
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;
  for (const base of allBases) {
    try {
      const res = await fetch(base + '/auth/api/v2/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (data.access_token) return { token: data.access_token, base };
    } catch { continue; }
  }
  (globalThis as any).__taegisAuthError = { tried: allBases.length + ' regions', savedRegion: region };
  return null;
}

export async function taegisGraphQL(query: string, variables: any, token: string, base?: string) {
  const url = (base || 'https://api.ctpx.secureworks.com') + '/graphql';
  const res = await fetch(url, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }), cache: 'no-store',
  });
  return res.json();
}

// ═══ TENABLE ═══
export async function tenableHeaders(): Promise<Record<string, string> | null> {
  const c = await getConfigs();
  const accessKey = getCred('tenable', 'TENABLE_ACCESS_KEY', c);
  const secretKey = getCred('tenable', 'TENABLE_SECRET_KEY', c);
  if (!accessKey || !secretKey) return null;
  return { 'X-ApiKeys': `accessKey=${accessKey};secretKey=${secretKey}`, 'Content-Type': 'application/json' };
}

export async function tenableAPI(path: string, tenantId?: string) {
  const headers = await tenableHeaders(tenantId);
  if (!headers) throw new Error('No Tenable credentials');
  const res = await fetch(`https://cloud.tenable.com${path}`, { headers, cache: 'no-store' });
  return res.json();
}

// ═══ CONFIGURED TOOLS CHECK ═══
export async function getConfiguredTools(): Promise<Record<string, boolean>> {
  const c = await getConfigs();
  const has = (id: string, keys: string[]) => keys.every(k => !!getCred(id, k, c));
  return {
    defender: has('defender', ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET']),
    taegis: has('taegis', ['TAEGIS_CLIENT_ID', 'TAEGIS_CLIENT_SECRET']),
    tenable: has('tenable', ['TENABLE_ACCESS_KEY', 'TENABLE_SECRET_KEY']),
    zia: has('zscaler_zia', ['ZIA_BASE_URL', 'ZIA_API_KEY']),
    zpa: has('zscaler_zpa', ['ZPA_CLIENT_ID', 'ZPA_CLIENT_SECRET']),
    crowdstrike: has('crowdstrike', ['CS_CLIENT_ID', 'CS_CLIENT_SECRET']),
    sentinelone: has('sentinelone', ['S1_API_TOKEN']),
  };
}
