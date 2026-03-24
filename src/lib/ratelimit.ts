// Sliding window rate limiter using Upstash Redis REST API
// No @upstash/ratelimit package needed — uses existing REST client pattern

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://dominant-polecat-18841.upstash.io';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

async function redisCommand(...args: (string | number)[]): Promise<unknown> {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = await res.json() as { result: unknown };
  return data.result;
}

// Simple fixed-window rate limiter
// Returns { ok: boolean, remaining: number, reset: number }
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  try {
    const redisKey = `wt:ratelimit:${key}`;
    const count = await redisCommand('INCR', redisKey) as number;
    if (count === 1) {
      // Set expiry on first request
      await redisCommand('EXPIRE', redisKey, windowSeconds);
    }
    const ttl = await redisCommand('TTL', redisKey) as number;
    const ok = count <= limit;
    return { ok, count, remaining: Math.max(0, limit - count), reset: ttl };
  } catch {
    // If Redis fails, allow the request (fail open)
    return { ok: true, count: 0, remaining: limit, reset: windowSeconds };
  }
}

// Convenience: check rate limit and return 429 response if exceeded
export async function checkRateLimit(identifier: string, limit = 20, windowSeconds = 60) {
  const result = await rateLimit(identifier, limit, windowSeconds);
  return result;
}
