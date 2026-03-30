// Upstash Redis REST client — uses fetch, no npm package required
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://dominant-polecat-18841.upstash.io';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

async function redisCommand(...args: (string | number)[]): Promise<unknown> {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.result;
}

export async function redisGet(key: string): Promise<string | null> {
  const result = await redisCommand('GET', key);
  return result as string | null;
}

export async function redisSet(key: string, value: string, exSeconds?: number): Promise<void> {
  if (exSeconds) {
    await redisCommand('SET', key, value, 'EX', exSeconds);
  } else {
    await redisCommand('SET', key, value);
  }
}

export async function redisDel(key: string): Promise<void> {
  await redisCommand('DEL', key);
}

export async function redisHSet(key: string, field: string, value: string): Promise<void> {
  await redisCommand('HSET', key, field, value);
}

export async function redisHGet(key: string, field: string): Promise<string | null> {
  const result = await redisCommand('HGET', key, field);
  return result as string | null;
}

export async function redisHGetAll(key: string): Promise<Record<string, string>> {
  const result = await redisCommand('HGETALL', key);
  if (!result || !Array.isArray(result)) return {};
  const obj: Record<string, string> = {};
  for (let i = 0; i < (result as string[]).length; i += 2) {
    obj[(result as string[])[i]] = (result as string[])[i + 1];
  }
  return obj;
}

// Watchtower-specific helpers
export const KEYS = {
  // Global fallback key (used if no tenant key set)
  ANTHROPIC_KEY: 'wt:settings:anthropic_key',
  // Per-tenant BYOK key
  TENANT_ANTHROPIC_KEY: (tenantId: string) => `wt:tenant:${tenantId}:anthropic_key`,
  TOOL_CREDS: (tenantId: string) => `wt:tools:${tenantId}`,
  ALERT_CACHE: (tenantId: string) => `wt:alerts:${tenantId}`,
  TENANT_SETTINGS: (tenantId: string) => `wt:tenant:${tenantId}:settings`,
};

// Resolve the Anthropic API key for a given tenant.
// Priority: tenant BYOK key > env var > global fallback key
export async function getAnthropicKey(tenantId?: string): Promise<string | null> {
  const { decrypt } = await import('@/lib/encrypt');
  // 1. Tenant-specific BYOK key from Redis (stored encrypted)
  if (tenantId) {
    try {
      const tenantKey = await redisGet(KEYS.TENANT_ANTHROPIC_KEY(tenantId));
      if (tenantKey) {
        // Decrypt if encrypted (format: iv:tag:ciphertext), return raw if legacy plaintext
        try { return decrypt(tenantKey); } catch { return tenantKey; }
      }
    } catch(e) { /* fall through */ }
  }
  // 2. Environment variable (Vercel dashboard — not encrypted, direct)
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // 3. Global fallback key stored in Redis
  try {
    const globalKey = await redisGet(KEYS.ANTHROPIC_KEY);
    if (globalKey) { try { return decrypt(globalKey); } catch { return globalKey; } }
    return null;
  } catch(e) {
    return null;
  }
}

export async function setTenantAnthropicKey(tenantId: string, key: string): Promise<void> {
  await redisSet(KEYS.TENANT_ANTHROPIC_KEY(tenantId), key);
}

export async function redisHDel(key: string, field: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  await fetch(`${url}/hdel/${encodeURIComponent(key)}/${encodeURIComponent(field)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getTenantSettings(tenantId: string): Promise<Record<string, string>> {
  try {
    return await redisHGetAll(KEYS.TENANT_SETTINGS(tenantId));
  } catch(e) {
    return {};
  }
}

// ── List operations (for AI query log) ──────────────────────────────────────
export async function redisLPush(key: string, ...values: string[]): Promise<number> {
  const result = await redisCommand('LPUSH', key, ...values);
  return result as number;
}

export async function redisLRange(key: string, start: number, stop: number): Promise<string[]> {
  const result = await redisCommand('LRANGE', key, start, stop);
  return (result as string[]) || [];
}

export async function redisLTrim(key: string, start: number, stop: number): Promise<void> {
  await redisCommand('LTRIM', key, start, stop);
}

// ─── JTI Blacklist (session revocation) ──────────────────────────────────────
const JTI_BLACKLIST_KEY = (jti: string) => `wt:jti:blacklisted:${jti}`;

export async function blacklistJti(jti: string, ttlSeconds: number = 86400): Promise<void> {
  await redisSet(JTI_BLACKLIST_KEY(jti), '1', ttlSeconds);
}

export async function isJtiBlacklisted(jti: string): Promise<boolean> {
  const val = await redisGet(JTI_BLACKLIST_KEY(jti)).catch(() => null);
  return val === '1';
}
