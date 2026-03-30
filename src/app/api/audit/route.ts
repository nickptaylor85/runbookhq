import { NextRequest, NextResponse } from 'next/server';
import { redisLPush, redisLRange, redisLTrim } from '@/lib/redis';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}
const auditKey = (t: string) => `wt:${t}:audit_log`;

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  if (req.headers.get('x-user-tier') === 'mssp') return true;
  const sessionToken = req.cookies.get('wt_session')?.value;
  if (sessionToken) {
    try {
      const { createHmac } = await import('crypto');
      const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
      const [encoded, sig] = sessionToken.split('.');
      if (encoded && sig) {
        const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url');
        if (sig === expectedSig) {
          const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
          if (Date.now() - payload.iat <= 86400000 && (payload.isAdmin === true || payload.tier === 'mssp')) return true;
        }
      }
    } catch {}
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    const tenantId = getTenantId(req);
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
    const entries = await redisLRange(auditKey(tenantId), 0, limit - 1);
    return NextResponse.json({ ok: true, entries: entries.map(e => { try { return JSON.parse(e); } catch { return e; } }) });
  } catch {
    return NextResponse.json({ ok: true, entries: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as Record<string, unknown>;
    const entry = { ...body, tenantId, ts: Date.now() };
    await redisLPush(auditKey(tenantId), JSON.stringify(entry));
    await redisLTrim(auditKey(tenantId), 0, 999);
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
