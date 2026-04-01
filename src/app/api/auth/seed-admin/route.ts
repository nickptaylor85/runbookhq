import { checkRateLimit } from '@/lib/ratelimit';
import { NextRequest, NextResponse } from 'next/server';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function POST(req: NextRequest) {
  // Rate limit this sensitive endpoint
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anon';
  const rl = await checkRateLimit(`seed-admin:${ip}`, 5, 3600);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  // Require admin auth — this route must not be callable by non-admins
  const isAdmin = req.headers.get('x-is-admin') === 'true';
  if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const _tenantId = getTenantId(req);
  return NextResponse.json({ ok: true, message: "No action required — platform already initialised" });
}
