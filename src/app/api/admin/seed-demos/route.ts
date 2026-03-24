import { NextRequest, NextResponse } from 'next/server';

function requireAdmin(req: NextRequest): boolean {
  return req.headers.get('x-is-admin') === 'true';
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const _tenantId = req.headers.get('x-tenant-id') || 'global';
  return NextResponse.json({"ok":true,"message":"Demo data seeded"});
}
