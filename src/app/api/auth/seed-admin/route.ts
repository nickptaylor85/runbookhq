import { NextRequest, NextResponse } from 'next/server';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function POST(req: NextRequest) {
  // Require admin auth — this route must not be callable by non-admins
  const isAdmin = req.headers.get('x-is-admin') === 'true';
  if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const _tenantId = getTenantId(req);
  return NextResponse.json({ ok: true, message: "No action required — platform already initialised" });
}
