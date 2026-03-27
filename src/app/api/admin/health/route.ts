import { NextRequest, NextResponse } from 'next/server';
import { redisHGetAll, KEYS } from '@/lib/redis';

function requireAdmin(req: NextRequest): boolean {
  return req.headers.get('x-is-admin') === 'true';
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  
  const start = Date.now();
  const checks: Record<string, unknown> = {};
  
  // Redis health
  try {
    const settings = await redisHGetAll(KEYS.TENANT_SETTINGS('global'));
    checks.redis = { ok: true, latencyMs: Date.now() - start, keysFound: Object.keys(settings).length };
  } catch (e: unknown) {
    checks.redis = { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
  
  // Memory / process
  const mem = process.memoryUsage();
  checks.process = {
    uptimeSeconds: Math.floor(process.uptime()),
    memHeapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    memHeapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    nodeVersion: process.version,
  };
  
  // Environment check (presence only, not values)
  checks.env = {
    encryptKey: !!process.env.WATCHTOWER_ENCRYPT_KEY,
    sessionSecret: !!process.env.WATCHTOWER_SESSION_SECRET,
    adminEmail: !!process.env.WATCHTOWER_ADMIN_EMAIL,
    redisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    resend: !!process.env.RESEND_API_KEY,
  };
  
  const allOk = (checks.redis as any).ok;
  
  return NextResponse.json({
    ok: allOk,
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - start,
    checks,
  }, { status: allOk ? 200 : 503 });
}
