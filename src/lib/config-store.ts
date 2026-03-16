// Redis REST store (Upstash compatible) with tenant isolation

async function getRedisUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL || null;
}
async function getRedisToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN || null;
}

async function redisCmd(...args: string[]): Promise<any> {
  const url = await getRedisUrl();
  const token = await getRedisToken();
  if (!url || !token) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      cache: 'no-store',
    });
    const data = await res.json();
    return data.result ?? null;
  } catch (e) {
    console.error('Redis error:', e);
    return null;
  }
}

export interface ToolConfig { id: string; enabled: boolean; credentials: Record<string, string>; status?: string }
export interface AllToolConfigs { tools: Record<string, ToolConfig>; updatedAt: string; [key: string]: any }

export async function hasKVStore(): Promise<boolean> {
  const url = await getRedisUrl();
  const token = await getRedisToken();
  return !!(url && token);
}

// ═══ PLATFORM-LEVEL (users, tenants, audit — shared) ═══
export async function loadPlatformData(): Promise<any> {
  const raw = await redisCmd('GET', 'secops:platform');
  if (raw) {
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch {}
  }
  return { users: {}, tenants: {}, auditLog: [] };
}

export async function savePlatformData(data: any): Promise<boolean> {
  data.updatedAt = new Date().toISOString();
  const result = await redisCmd('SET', 'secops:platform', JSON.stringify(data));
  return result === 'OK';
}

// ═══ TENANT-LEVEL (tool configs — isolated per tenant) ═══
export async function loadTenantConfigs(tenantId: string): Promise<AllToolConfigs> {
  if (!tenantId) return buildFromEnv();
  const raw = await redisCmd('GET', `secops:tenant:${tenantId}:configs`);
  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed?.tools) return parsed as AllToolConfigs;
    } catch {}
  }
  return { tools: {}, updatedAt: '' };
}

export async function saveTenantConfigs(tenantId: string, c: AllToolConfigs): Promise<boolean> {
  if (!tenantId) return false;
  c.updatedAt = new Date().toISOString();
  const result = await redisCmd('SET', `secops:tenant:${tenantId}:configs`, JSON.stringify(c));
  return result === 'OK';
}

// ═══ BACKWARDS COMPAT — loadToolConfigs reads old shared key OR tenant-scoped ═══
// Used by api-clients.ts which doesn't have request context
export async function loadToolConfigs(tenantId?: string): Promise<AllToolConfigs> {
  // If tenant specified, use tenant-scoped
  if (tenantId) {
    const tc = await loadTenantConfigs(tenantId);
    if (tc.updatedAt) return tc;
  }
  // Fallback: old shared key (for migration + superadmin)
  const raw = await redisCmd('GET', 'secops:configs');
  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed?.tools) return parsed as AllToolConfigs;
    } catch {}
  }
  return buildFromEnv();
}

export async function saveToolConfigs(c: any): Promise<boolean> {
  // Platform data (has users/tenants) goes to platform key
  if (c.users || c.tenants || c.auditLog) {
    return savePlatformData(c);
  }
  // Tool configs go to shared key (legacy)
  c.updatedAt = new Date().toISOString();
  const result = await redisCmd('SET', 'secops:configs', JSON.stringify(c));
  return result === 'OK';
}

// ═══ HELPER: extract tenant from request cookies ═══
export function getTenantFromRequest(req: Request): { email: string | null; tenantId: string | null } {
  const cookie = req.headers.get('cookie') || '';
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const tenantMatch = cookie.match(/secops-tenant=([^;]+)/);
  return {
    email: authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null,
    tenantId: tenantMatch?.[1] ? decodeURIComponent(tenantMatch[1]) : null,
  };
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
  if (process.env.ANTHROPIC_API_KEY) t.anthropic = { id: 'anthropic', enabled: true, credentials: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY! }, status: 'untested' };
  if (process.env.SLACK_WEBHOOK_URL) t.slack_webhook = { id: 'slack_webhook', enabled: true, credentials: { SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL! }, status: 'untested' };
  return { tools: t, updatedAt: new Date().toISOString() };
}
