import { NextRequest, NextResponse } from 'next/server';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
}
