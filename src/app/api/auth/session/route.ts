import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function verifyToken(token: string): { userId: string; tenantId: string; isAdmin: boolean } | null {
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
  // 1. Try middleware-injected headers first (fast path)
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return NextResponse.json({
      authenticated: true,
      userId,
      tenantId: req.headers.get('x-tenant-id') || 'global',
      isAdmin: req.headers.get('x-is-admin') === 'true',
    });
  }

  // 2. Verify cookie directly (fallback — e.g. when middleware is in public paths)
  const token = req.cookies.get('wt_session')?.value;
  if (token) {
    const session = verifyToken(token);
    if (session) {
      return NextResponse.json({
        authenticated: true,
        userId: session.userId,
        tenantId: session.tenantId,
        isAdmin: session.isAdmin,
      });
    }
  }

  // 3. Dev mode — no env vars set, grant admin
  const hasAuth = !!(process.env.WATCHTOWER_ADMIN_EMAIL && process.env.WATCHTOWER_ADMIN_PASS);
  if (!hasAuth) {
    return NextResponse.json({ authenticated: true, userId: 'dev-admin', tenantId: 'global', isAdmin: true });
  }

  return NextResponse.json({ authenticated: false, isAdmin: false }, { status: 401 });
}
