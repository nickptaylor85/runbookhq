import { NextRequest, NextResponse } from 'next/server';
import { redisGet } from '@/lib/redis';

function requireAdmin(req: NextRequest) {
  return req.headers.get('x-is-admin') === 'true';
}

// Lists all known tenant IDs from the slug map
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    const slugMapRaw = await redisGet('wt:global:slug_map');
    const slugMap: Record<string, string> = slugMapRaw ? JSON.parse(slugMapRaw) : {};
    const tenants = Object.entries(slugMap).map(([slug, tenantId]) => ({ slug, tenantId }));
    return NextResponse.json({ ok: true, tenants, count: tenants.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
