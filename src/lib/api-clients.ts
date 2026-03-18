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
  } catch(e) { return null; }
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
  } catch(e) { return null; }
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
    } catch(e) { continue; }
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

/* ═══ CROWDSTRIKE FALCON ═══ */
export async function getCrowdStrikeToken(tenantId?: string): Promise<{ token: string; base: string } | null> {
  const configs = await loadToolConfigs(tenantId);
  const cs = configs?.tools?.crowdstrike;
  if (!cs?.enabled) return null;
  const base = cs.credentials?.CS_BASE_URL || 'https://api.crowdstrike.com';
  try {
    const r = await fetch(`${base}/oauth2/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `client_id=${cs.credentials.CS_CLIENT_ID}&client_secret=${cs.credentials.CS_CLIENT_SECRET}` });
    const d = await r.json();
    return d.access_token ? { token: d.access_token, base } : null;
  } catch(e) { return null; }
}

export async function crowdStrikeAPI(path: string, token: string, base: string) {
  const r = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}

/* ═══ SENTINELONE ═══ */
export async function sentinelOneAPI(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const s1 = configs?.tools?.sentinelone;
  if (!s1?.enabled) return null;
  const base = s1.credentials?.S1_BASE_URL || '';
  const token = s1.credentials?.S1_API_TOKEN || '';
  const r = await fetch(`${base}/web/api/v2.1${path}`, { headers: { Authorization: `ApiToken ${token}` } });
  return r.json();
}

/* ═══ CORTEX XDR ═══ */
export async function cortexAPI(path: string, body: any, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const cx = configs?.tools?.cortex;
  if (!cx?.enabled) return null;
  const fqdn = cx.credentials?.CORTEX_FQDN || '';
  const nonce = Date.now().toString();
  const r = await fetch(`https://${fqdn}/public_api/v1${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-xdr-auth-id': cx.credentials?.CORTEX_API_KEY_ID || '', Authorization: cx.credentials?.CORTEX_API_KEY || '', 'x-xdr-nonce': nonce, 'x-xdr-timestamp': nonce },
    body: JSON.stringify({ request_data: body }),
  });
  return r.json();
}

/* ═══ SPLUNK ═══ */
export async function splunkAPI(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const sp = configs?.tools?.splunk;
  if (!sp?.enabled) return null;
  const r = await fetch(`${sp.credentials?.SPLUNK_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${sp.credentials?.SPLUNK_TOKEN}`, 'Content-Type': 'application/json' },
  });
  return r.json();
}

/* ═══ MICROSOFT SENTINEL ═══ */
export async function getSentinelToken(tenantId?: string): Promise<{ token: string; workspaceId: string } | null> {
  const configs = await loadToolConfigs(tenantId);
  const sn = configs?.tools?.sentinel;
  if (!sn?.enabled) return null;
  try {
    const r = await fetch(`https://login.microsoftonline.com/${sn.credentials?.SENTINEL_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${sn.credentials?.SENTINEL_CLIENT_ID}&client_secret=${encodeURIComponent(sn.credentials?.SENTINEL_CLIENT_SECRET || '')}&scope=https://management.azure.com/.default`,
    });
    const d = await r.json();
    return d.access_token ? { token: d.access_token, workspaceId: sn.credentials?.SENTINEL_WORKSPACE_ID || '' } : null;
  } catch(e) { return null; }
}

/* ═══ WIZ ═══ */
export async function wizGraphQL(query: string, variables: any, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const wiz = configs?.tools?.wiz;
  if (!wiz?.enabled) return null;
  // Wiz uses OAuth2 service account tokens
  const tokenR = await fetch('https://auth.app.wiz.io/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${wiz.credentials?.WIZ_CLIENT_ID}&client_secret=${wiz.credentials?.WIZ_CLIENT_SECRET}&audience=wiz-api`,
  });
  const tokenD = await tokenR.json();
  if (!tokenD.access_token) return null;
  const r = await fetch(wiz.credentials?.WIZ_API_URL || 'https://api.app.wiz.io/graphql', {
    method: 'POST', headers: { Authorization: `Bearer ${tokenD.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

/* ═══ PROOFPOINT TAP ═══ */
export async function proofpointAPI(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const pp = configs?.tools?.proofpoint;
  if (!pp?.enabled) return null;
  const auth = Buffer.from(`${pp.credentials?.PP_SERVICE_PRINCIPAL}:${pp.credentials?.PP_SECRET}`).toString('base64');
  const r = await fetch(`https://tap-api-v2.proofpoint.com/v2${path}`, { headers: { Authorization: `Basic ${auth}` } });
  return r.json();
}

/* ═══ DARKTRACE ═══ */
export async function darktraceAPI(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const dt = configs?.tools?.darktrace;
  if (!dt?.enabled) return null;
  const base = dt.credentials?.DT_BASE_URL || '';
  const pub = dt.credentials?.DT_PUB_TOKEN || '';
  const priv = dt.credentials?.DT_PRIV_TOKEN || '';
  const ts = new Date().toISOString();
  // HMAC signature required for Darktrace
  const { createHmac } = await import('crypto');
  const sig = createHmac('sha1', priv).update(`${path}\n${pub}\n${ts}`).digest('hex');
  const r = await fetch(`${base}${path}`, { headers: { 'DTAPI-Token': pub, 'DTAPI-Date': ts, 'DTAPI-Signature': sig } });
  return r.json();
}

/* ═══ CARBON BLACK ═══ */
export async function carbonBlackAPI(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const cb = configs?.tools?.carbonblack;
  if (!cb?.enabled) return null;
  const r = await fetch(`${cb.credentials?.CB_BASE_URL}/appservices/v6/orgs/${cb.credentials?.CB_ORG_KEY}${path}`, {
    headers: { 'X-Auth-Token': `${cb.credentials?.CB_API_KEY}/${cb.credentials?.CB_API_ID}`, 'Content-Type': 'application/json' },
  });
  return r.json();
}

/* ═══ QUALYS ═══ */
export async function qualysAPI(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const q = configs?.tools?.qualys;
  if (!q?.enabled) return null;
  const auth = Buffer.from(`${q.credentials?.QUALYS_USERNAME}:${q.credentials?.QUALYS_PASSWORD}`).toString('base64');
  const r = await fetch(`${q.credentials?.QUALYS_BASE_URL}/api/2.0/fo${path}`, { headers: { Authorization: `Basic ${auth}`, 'X-Requested-With': 'Watchtower' } });
  return r.text();
}

/* ═══ RAPID7 INSIGHTVM ═══ */
export async function rapid7API(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const r7 = configs?.tools?.rapid7;
  if (!r7?.enabled) return null;
  const r = await fetch(`${r7.credentials?.R7_BASE_URL}/api/3${path}`, { headers: { Authorization: `Bearer ${r7.credentials?.R7_API_KEY}`, 'Content-Type': 'application/json' } });
  return r.json();
}

/* ═══ RECORDED FUTURE ═══ */
export async function recordedFutureAPI(path: string, tenantId?: string) {
  const configs = await loadToolConfigs(tenantId);
  const rf = configs?.tools?.recordedfuture;
  if (!rf?.enabled) return null;
  const r = await fetch(`https://api.recordedfuture.com/v2${path}`, { headers: { 'X-RFToken': rf.credentials?.RF_API_TOKEN || '' } });
  return r.json();
}
