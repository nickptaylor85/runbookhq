import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet , sanitiseTenantId } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}
function brandingKey(t: string) { return `wt:${t}:mssp_branding`; }

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const raw = await redisGet(brandingKey(getTenantId(req)));
    return NextResponse.json({ ok: true, branding: raw ? JSON.parse(raw) : {} });
  } catch(e) { return NextResponse.json({ ok: true, branding: {} }); }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json();
    const branding: Record<string,string> = {};
    if (typeof body.name === 'string') branding.name = body.name.slice(0,80);
    if (typeof body.tagline === 'string') branding.tagline = body.tagline.slice(0,120);
    if (typeof body.primaryColor === 'string' && /^#[0-9a-f]{3,6}$/i.test(body.primaryColor)) branding.primaryColor = body.primaryColor;
    if (typeof body.accentColor === 'string' && /^#[0-9a-f]{3,6}$/i.test(body.accentColor)) branding.accentColor = body.accentColor;
    await redisSet(brandingKey(tenantId), JSON.stringify(branding));
    return NextResponse.json({ ok: true, branding });
  } catch(e: any) { return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 }); }
}
