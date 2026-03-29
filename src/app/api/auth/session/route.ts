import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { redisGet } from '@/lib/redis';

function verifyToken(token: string): { userId: string; tenantId: string; isAdmin: boolean; role?: string } | null {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Date.now() - payload.iat > 86400000) return null;
    return payload;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (userId) {
    const mfaFlag = await redisGet(`wt:user:${userId}:mfa_setup_required`).catch(() => null);
    return NextResponse.json({
      authenticated: true, userId,
      tenantId: req.headers.get('x-tenant-id') || 'global',
      isAdmin: req.headers.get('x-is-admin') === 'true',
      mfaSetupRequired: mfaFlag === '1',
    });
  }
  const token = req.cookies.get('wt_session')?.value;
  if (token) {
    const session = verifyToken(token);
    if (session) return NextResponse.json({ authenticated: true, ...session });
  }
  return NextResponse.json({ authenticated: false, isAdmin: false }, { status: 401 });
}
