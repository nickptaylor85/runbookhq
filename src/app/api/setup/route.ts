import { NextRequest, NextResponse } from 'next/server';

// Setup endpoint — returns platform init status
// Only admin can POST — prevents unauthenticated platform resets
export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: true, complete: true });
}

export async function POST(req: NextRequest) {
  // Require admin
  if (req.headers.get('x-is-admin') !== 'true') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
