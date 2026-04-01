import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { redisGet } from '@/lib/redis';
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

// Lists all known tenant IDs from the slug map
export async function GET(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    const slugMapRaw = await redisGet('wt:mssp:slug_map');
    const slugMap: Record<string, string> = slugMapRaw ? JSON.parse(slugMapRaw) : {};
    const tenants = Object.entries(slugMap).map(([slug, tenantId]) => ({ slug, tenantId }));
    return NextResponse.json({ ok: true, tenants, count: tenants.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
