import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { redisHGetAll, KEYS } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  try {
    const cookieStore = await cookies();
    const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
    if (token) {
      const payload = verifySession(token) as any;
      if (payload?.isAdmin === true) return true;
    }
  } catch {}
  return false;
}

export async function GET(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  
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
