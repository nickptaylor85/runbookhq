import { NextRequest, NextResponse } from 'next/server';
import { verifyTotp } from '@/lib/totp';
import { redisGet } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anon';
  const rl = await checkRateLimit(`totp-verify:${ip}`, 10, 60);
  if (!rl.ok) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  try {
    const { userId, code } = await req.json();
    if (!userId || !code) return NextResponse.json({ error: 'userId and code required' }, { status: 400 });
    const raw = await redisGet(`wt:user:${userId}:mfa`);
    if (!raw) return NextResponse.json({ ok: true, valid: true }); // No MFA = pass through
    const mfa = JSON.parse(decrypt(raw));
    if (!mfa.enabled) return NextResponse.json({ ok: true, valid: true });
    return NextResponse.json({ ok: true, valid: verifyTotp(mfa.secret, code) });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
