import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { blacklistJti } from '@/lib/redis';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const cookieOpts = { maxAge: 0, path: '/' };

  // Blacklist the jti so this token is immediately revoked server-side
  const token = req.cookies.get('wt_session')?.value;
  if (token) {
    try {
      const [encoded] = token.split('.');
      if (encoded) {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        if (payload.jti && payload.iat) {
          // TTL = remaining token lifetime (max 24h)
          const remainingSecs = Math.max(0, Math.floor((payload.iat + 86400000 - Date.now()) / 1000));
          if (remainingSecs > 0) await blacklistJti(payload.jti, remainingSecs).catch(() => {});
        }
      }
    } catch {}
  }

  res.cookies.set('wt_session', '', cookieOpts);
  res.cookies.set('wt_tier', '', cookieOpts);
  res.cookies.set('wt_mfa_pending', '', cookieOpts);
  res.cookies.set('wt_tenant', '', cookieOpts);
  return res;
}