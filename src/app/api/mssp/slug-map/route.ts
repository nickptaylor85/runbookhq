import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ratelimit';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  try {
    const cookieStore = await cookies();
    const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
    if (token) { const p = verifySession(token) as any; if (p?.isAdmin) return true; }
  } catch {}
  return false;
}

const SLUG_MAP_KEY = 'wt:mssp:slug_map';
const DEFAULT_MAP: Record<string, string> = {
  'acme-financial': 'client-acme',
  'nhs-trust': 'client-nhs',
  'retailco': 'client-retail',
  'gov-dept': 'client-gov',
};

export async function GET() {
  try {
    const raw = await redisGet(SLUG_MAP_KEY);
    return NextResponse.json({ ok: true, map: raw ? JSON.parse(raw) : DEFAULT_MAP });
  } catch {
    return NextResponse.json({ ok: true, map: DEFAULT_MAP });
  }
}

export async function POST(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  if (!(await requireAdmin(req))) return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 403 });
  try {
    const body = await req.json() as { slug: string; tenantId: string };
    const { slug, tenantId } = body;
    if (!slug || !tenantId) return NextResponse.json({ ok: false, error: 'slug and tenantId required' }, { status: 400 });
    if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ ok: false, error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 });
    const raw = await redisGet(SLUG_MAP_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : { ...DEFAULT_MAP };
    map[slug] = tenantId;
    await redisSet(SLUG_MAP_KEY, JSON.stringify(map));
    return NextResponse.json({ ok: true, map });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 403 });
  try {
    const body = await req.json() as { slug: string };
    const raw = await redisGet(SLUG_MAP_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : { ...DEFAULT_MAP };
    const slugToDelete = typeof body === 'object' && body && 'slug' in (body as Record<string,unknown>) ? (body as Record<string,string>).slug : '';
    if (slugToDelete) delete map[slugToDelete];
    await redisSet(SLUG_MAP_KEY, JSON.stringify(map));
    return NextResponse.json({ ok: true, map });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
