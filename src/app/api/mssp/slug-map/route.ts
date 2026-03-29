import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';

const SLUG_MAP_KEY = 'wt:mssp:slug_map';
const DEFAULT_MAP: Record<string, string> = {
  'acme-financial': 'client-acme',
  'nhs-trust': 'client-nhs',
  'retailco': 'client-retail',
  'gov-dept': 'client-gov',
};

export async function GET() {
  try {
    const raw = await redisGet(SLUG_MAP_KEY);
    return NextResponse.json({ ok: true, map: raw ? JSON.parse(raw) : DEFAULT_MAP });
  } catch {
    return NextResponse.json({ ok: true, map: DEFAULT_MAP });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { slug: string; tenantId: string };
    const { slug, tenantId } = body;
    if (!slug || !tenantId) return NextResponse.json({ ok: false, error: 'slug and tenantId required' }, { status: 400 });
    if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ ok: false, error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 });
    const raw = await redisGet(SLUG_MAP_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : { ...DEFAULT_MAP };
    map[slug] = tenantId;
    await redisSet(SLUG_MAP_KEY, JSON.stringify(map));
    return NextResponse.json({ ok: true, map });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { slug: string };
    const raw = await redisGet(SLUG_MAP_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : { ...DEFAULT_MAP };
    delete map[(body as any).slug];
    await redisSet(SLUG_MAP_KEY, JSON.stringify(map));
    return NextResponse.json({ ok: true, map });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
