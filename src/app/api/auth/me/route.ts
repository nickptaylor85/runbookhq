import { NextRequest, NextResponse } from 'next/server';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const tenantId = getTenantId(req);
  const isAdmin = req.headers.get('x-is-admin') === 'true';
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true, userId, tenantId, isAdmin });
}
