import { NextResponse } from 'next/server';

// Test a Redis connection
async function testRedis(url: string, token: string): Promise<{ ok: boolean; error?: string; latencyMs?: number }> {
  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['PING']),
    });
    const ms = Date.now() - start;
    const data = await res.json();
    if (data.result === 'PONG') return { ok: true, latencyMs: ms };
    return { ok: false, error: `Unexpected response: ${JSON.stringify(data)}` };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// GET: Show current status
export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  const hasRedis = !!(url && token);

  let redisStatus: any = { configured: hasRedis };
  if (hasRedis) {
    redisStatus = { ...redisStatus, ...(await testRedis(url, token)), urlPrefix: url.substring(0, 30) + '...' };
  }

  return NextResponse.json({
    redis: redisStatus,
    env: {
      DASHBOARD_PASSWORD: !!process.env.DASHBOARD_PASSWORD,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    },
  });
}

// POST: Test provided Redis credentials
export async function POST(req: Request) {
  const { action, redisUrl, redisToken } = await req.json();

  if (action === 'test_redis') {
    if (!redisUrl || !redisToken) return NextResponse.json({ ok: false, error: 'URL and Token required' });
    const result = await testRedis(redisUrl, redisToken);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
