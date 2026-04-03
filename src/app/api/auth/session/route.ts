import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { redisGet } from '@/lib/redis';
import { getUserByEmail } from '@/lib/users';

function verifyToken(token: string): Record<string, any> | null {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('WATCHTOWER_SESSION_SECRET env var not set'); })() : 'watchtower-dev-session-secret');
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
    const isAdmin = req.headers.get('x-is-admin') === 'true';
    // Try to get name from users store
    let name = '';
    if (!isAdmin) {
      try {
        const email = req.headers.get('x-user-email') || '';
        if (email) {
          const user = await getUserByEmail('global', email);
          if (user?.name) name = user.name;
          else name = email.split('@')[0];
        }
      } catch {}
    } else {
      name = 'Admin';
    }
    return NextResponse.json({
      authenticated: true, userId,
      tenantId: req.headers.get('x-tenant-id') || 'global',
      isAdmin,
      name,
      email: req.headers.get('x-user-email') || '',
      mfaSetupRequired: mfaFlag === '1',
    });
  }
  const token = req.cookies.get('wt_session')?.value;
  if (token) {
    const session = verifyToken(token);
    if (session) {
      // Enrich with name from users store
      let name = session.name || '';
      if (!name && session.email) {
        try {
          if (session.isAdmin) {
            name = 'Admin';
          } else {
            const user = await getUserByEmail(session.tenantId || 'global', session.email);
            name = user?.name || session.email.split('@')[0];
          }
        } catch { name = session.email?.split('@')[0] || ''; }
      }
      // Also check Redis mfa_setup_required so setup-2fa page gets correct flag
      let mfaSetupRequired = false;
      if (session.userId && !session.isAdmin) {
        const mfaFlag = await redisGet('wt:user:' + session.userId + ':mfa_setup_required').catch(() => null);
        mfaSetupRequired = mfaFlag === '1';
      }
      return NextResponse.json({ authenticated: true, ...session, name, mfaSetupRequired, tenantId: session.tenantId || 'global' });
    }
  }
  return NextResponse.json({ authenticated: false, isAdmin: false }, { status: 401 });
}
