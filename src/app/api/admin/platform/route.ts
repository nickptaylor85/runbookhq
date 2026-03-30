import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';

const PLATFORM_KEY = 'wt:platform:settings';

function requireAuth(req: NextRequest): boolean {
  // Middleware verifies JWT and injects x-is-admin for every /api/ request
  return req.headers.get('x-is-admin') === 'true' || req.headers.get('x-user-tier') === 'mssp';
}

export async function GET(req: NextRequest) {
  if (!requireAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const raw = await redisGet(PLATFORM_KEY);
    const settings = raw ? JSON.parse(raw) : { signup_enabled: true };
    return NextResponse.json(settings);
  } catch(e: any) {
    return NextResponse.json({ signup_enabled: true });
  }
}

export async function POST(req: NextRequest) {
  if (!requireAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json() as Record<string, unknown>;
    const raw = await redisGet(PLATFORM_KEY);
    const current = raw ? JSON.parse(raw) : {};
    const updated = { ...current, ...body };
    await redisSet(PLATFORM_KEY, JSON.stringify(updated));
    return NextResponse.json({ ok: true, ...updated });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
