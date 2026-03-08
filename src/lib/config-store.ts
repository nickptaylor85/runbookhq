// Redis REST store (works with Upstash, Vercel KV, or any Redis REST API)
async function redisGet(key: string): Promise<any> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : null;
  } catch { return null; }
}
async function redisSet(key: string, value: any): Promise<boolean> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    await fetch(`${url}/set/${key}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(value), cache: 'no-store' });
    return true;
  } catch { return false; }
}
async function redisDel(key: string): Promise<boolean> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try { await fetch(`${url}/del/${key}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }); return true; } catch { return false; }
}

export interface ToolConfig { id: string; enabled: boolean; credentials: Record<string, string>; status?: string }
export interface AllToolConfigs { tools: Record<string, ToolConfig>; updatedAt: string }

export async function hasKVStore(): Promise<boolean> {
  return !!((process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) && (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN));
}

export async function loadToolConfigs(): Promise<AllToolConfigs> {
  const data = await redisGet('secops:configs');
  if (data) return data as AllToolConfigs;
  return buildFromEnv();
}

export async function saveToolConfigs(c: AllToolConfigs): Promise<boolean> {
  return redisSet('secops:configs', JSON.stringify(c));
}

function buildFromEnv(): AllToolConfigs {
  const t: Record<string, ToolConfig> = {};
  if (process.env.AZURE_TENANT_ID) t.defender = { id: 'defender', enabled: true, credentials: { AZURE_TENANT_ID: process.env.AZURE_TENANT_ID!, AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID || '', AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET || '' }, status: 'untested' };
  if (process.env.TAEGIS_CLIENT_ID) t.taegis = { id: 'taegis', enabled: true, credentials: { TAEGIS_CLIENT_ID: process.env.TAEGIS_CLIENT_ID!, TAEGIS_CLIENT_SECRET: process.env.TAEGIS_CLIENT_SECRET || '', TAEGIS_REGION: process.env.TAEGIS_REGION || 'us' }, status: 'untested' };
  if (process.env.TENABLE_ACCESS_KEY) t.tenable = { id: 'tenable', enabled: true, credentials: { TENABLE_ACCESS_KEY: process.env.TENABLE_ACCESS_KEY!, TENABLE_SECRET_KEY: process.env.TENABLE_SECRET_KEY || '' }, status: 'untested' };
  if (process.env.ZIA_BASE_URL) t.zscaler_zia = { id: 'zscaler_zia', enabled: true, credentials: { ZIA_BASE_URL: process.env.ZIA_BASE_URL!, ZIA_API_KEY: process.env.ZIA_API_KEY || '', ZIA_USERNAME: process.env.ZIA_USERNAME || '', ZIA_PASSWORD: process.env.ZIA_PASSWORD || '' }, status: 'untested' };
  if (process.env.ZPA_CLIENT_ID) t.zscaler_zpa = { id: 'zscaler_zpa', enabled: true, credentials: { ZPA_CLIENT_ID: process.env.ZPA_CLIENT_ID!, ZPA_CLIENT_SECRET: process.env.ZPA_CLIENT_SECRET || '', ZPA_CUSTOMER_ID: process.env.ZPA_CUSTOMER_ID || '' }, status: 'untested' };
  if (process.env.CS_CLIENT_ID) t.crowdstrike = { id: 'crowdstrike', enabled: true, credentials: { CS_CLIENT_ID: process.env.CS_CLIENT_ID!, CS_CLIENT_SECRET: process.env.CS_CLIENT_SECRET || '', CS_BASE_URL: process.env.CS_BASE_URL || 'https://api.crowdstrike.com' }, status: 'untested' };
  if (process.env.S1_API_TOKEN) t.sentinelone = { id: 'sentinelone', enabled: true, credentials: { S1_API_TOKEN: process.env.S1_API_TOKEN!, S1_BASE_URL: process.env.S1_BASE_URL || '' }, status: 'untested' };
  return { tools: t, updatedAt: new Date().toISOString() };
}
