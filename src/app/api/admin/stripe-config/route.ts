import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { encrypt, decrypt } from '@/lib/encrypt';

const STRIPE_CONFIG_KEY = 'wt:platform:stripe_config';

function requireAdmin(req: NextRequest) {
  if ((req.headers.get('x-is-admin') !== 'true' && req.headers.get('x-user-tier') !== 'mssp')) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const err = requireAdmin(req); if (err) return err;
  try {
    const raw = await redisGet(STRIPE_CONFIG_KEY);
    if (!raw) return NextResponse.json({ ok: true, configured: false });
    const config = JSON.parse(decrypt(raw));
    return NextResponse.json({
      ok: true, configured: true,
      publishableKey: config.publishableKey, // safe to return
      secretKey: '••••••••',                 // never return secret
      webhookSecret: '••••••••',
      priceMssp: config.priceMssp,
      priceBusiness: config.priceBusiness,
      priceTeamPerSeat: config.priceTeamPerSeat,
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const err = requireAdmin(req); if (err) return err;
  try {
    const body = await req.json();
    const allowed = ['publishableKey','secretKey','webhookSecret','priceMssp','priceBusiness','priceTeamPerSeat'];
    // Load existing config to merge (don't overwrite masked values)
    let existing: Record<string,string> = {};
    try {
      const raw = await redisGet(STRIPE_CONFIG_KEY);
      if (raw) existing = JSON.parse(decrypt(raw));
    } catch {}
    for (const key of allowed) {
      if (body[key] && body[key] !== '••••••••') existing[key] = body[key];
    }
    await redisSet(STRIPE_CONFIG_KEY, encrypt(JSON.stringify(existing)));
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
