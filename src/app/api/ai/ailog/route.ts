import { NextRequest, NextResponse } from 'next/server';
import { redisLPush, redisLRange, redisLTrim } from '@/lib/redis';

const AI_LOG_KEY = (tenantId: string) => `wt:ailog:${tenantId}`;
const MAX_ENTRIES = 500;

export interface AILogEntry {
  ts: number;
  userId: string;
  tenantId: string;
  type: string;
  promptPreview: string;
  promptLength: number;
  responseLength: number;
  model: string;
  durationMs: number;
  ok: boolean;
  error?: string;
  alertId?: string;
  alertTitle?: string;
  alertVerdict?: string;
  vulnId?: string;
  vulnCve?: string;
  industry?: string;
}

async function verifyAdminSession(req: NextRequest): Promise<boolean> {
  // 1. Middleware-injected headers (normal path)
  if (req.headers.get('x-is-admin') === 'true') return true;
  if (req.headers.get('x-user-tier') === 'mssp') return true;
  // 2. Internal key
  const internalKey = req.headers.get('x-internal-key');
  if (internalKey && internalKey === process.env.WATCHTOWER_API_KEY) return true;
  // 3. Direct session cookie verification (fallback when middleware headers missing)
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
  // 4. Dev fallback
  return !!req.headers.get('x-user-id') && !process.env.WATCHTOWER_ADMIN_EMAIL;
}

function requireAdmin(req: NextRequest): boolean {
  return req.headers.get('x-is-admin') === 'true' || req.headers.get('x-user-tier') === 'mssp';
}

// Allow any authenticated session to POST logs (internal writes)
function allowLog(req: NextRequest): boolean {
  if (requireAdmin(req)) return true;
  // Any valid session can write logs (not just admin)
  if (req.headers.get('x-user-id')) return true;
  const internalKey = req.headers.get('x-internal-key');
  if (internalKey && internalKey === process.env.WATCHTOWER_API_KEY) return true;
  return false;
}

// GET — admin only
export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) {
    console.error('[ailog GET] auth failed - x-is-admin:', req.headers.get('x-is-admin'), 'tier:', req.headers.get('x-user-tier'));
    return NextResponse.json({ error: 'Unauthorised — admin only' }, { status: 403 });
  }
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || '200'), 500);
    const raw = await redisLRange(AI_LOG_KEY(tenantId), 0, limit - 1);
    const entries: AILogEntry[] = raw
      .map((r: string) => { try { return JSON.parse(r) as AILogEntry; } catch { return null; } })
      .filter((e): e is AILogEntry => e !== null);
    const stats = {
      total: entries.length,
      ok: entries.filter(e => e.ok).length,
      errors: entries.filter(e => !e.ok).length,
      byType: entries.reduce((acc: Record<string, number>, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1; return acc;
      }, {}),
      avgDurationMs: entries.length
        ? Math.round(entries.reduce((s, e) => s + e.durationMs, 0) / entries.length)
        : 0,
    };
    return NextResponse.json({ ok: true, entries, stats });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST — any authenticated session or internal key
export async function POST(req: NextRequest) {
  if (!allowLog(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }
  try {
    const entry = await req.json() as AILogEntry;
    if (!entry.ts || !entry.type) return NextResponse.json({ error: 'Invalid entry' }, { status: 400 });
    const tenantId = entry.tenantId || 'global';
    await redisLPush(AI_LOG_KEY(tenantId), JSON.stringify(entry));
    await redisLTrim(AI_LOG_KEY(tenantId), 0, MAX_ENTRIES - 1);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
