import { NextRequest, NextResponse } from 'next/server';

function requireAdmin(req: NextRequest): boolean {
  return req.headers.get('x-is-admin') === 'true';
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return NextResponse.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
}
