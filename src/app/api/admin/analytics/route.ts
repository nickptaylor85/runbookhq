import { NextRequest, NextResponse } from 'next/server';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  const _tenantId = getTenantId(req);
  return NextResponse.json({"ok": true, "data": {"totalUsers": 0, "activeToday": 0, "apiCalls": 0, "mrr": 0}});
}
