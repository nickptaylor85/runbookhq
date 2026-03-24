import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const tenantId = req.headers.get('x-tenant-id');
  const isAdmin = req.headers.get('x-is-admin') === 'true';
  if (!userId) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, userId, tenantId, isAdmin });
}
