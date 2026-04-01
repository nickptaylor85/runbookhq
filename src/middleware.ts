import { NextRequest, NextResponse } from 'next/server';

// Session verification using Web Crypto API (Edge Runtime compatible)
async function verifySessionToken(token: string): Promise<{ userId: string; tenantId: string; isAdmin: boolean; tier?: string } | null> {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('WATCHTOWER_SESSION_SECRET env var not set in production'); })() : 'watchtower-dev-session-secret');
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(encoded));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Timing-safe comparison to prevent timing attacks
    const sigBuf = new TextEncoder().encode(sig);
    const expBuf = new TextEncoder().encode(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    let diff = 0;
    for (let i = 0; i < sigBuf.length; i++) diff |= sigBuf[i] ^ expBuf[i];
    if (diff !== 0) return null;
    const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    if (Date.now() - payload.iat > 86400000) return null;
    return payload;
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = ['/', '/demo', '/pricing', '/guide', '/login', '/signup',
  '/setup-2fa', '/stripe/success', '/api/auth/login', '/api/auth/logout', '/api/auth/session',
  '/api/auth/totp', '/api/auth/saml', '/api/stripe/webhook', '/_next/', '/favicon', '/robots.txt', '/sitemap',
  '/press', '/blog', '/security', '/privacy', '/terms', '/changelog', '/docs', '/guide'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always strip spoofable identity headers from incoming requests
  // These are set by middleware from verified session — never trust client-supplied values
  const cleanHeaders = new Headers(req.headers);
  cleanHeaders.delete('x-is-admin');
  cleanHeaders.delete('x-user-id');
  cleanHeaders.delete('x-user-tier');
  // Note: x-tenant-id from client is overridden by session in authenticated routes

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next({ request: { headers: cleanHeaders } });
  }

  // Dashboard and settings: allow through, but redirect to 2FA setup if pending
  if (pathname === '/dashboard' || pathname.startsWith('/settings')) {
    const mfaPending = req.cookies.get('wt_mfa_pending')?.value;
    if (mfaPending === '1') {
      // Check if this is an admin session — admin never needs 2FA setup
      const sessionToken = req.cookies.get('wt_session')?.value;
      let isAdminSession = false;
      if (sessionToken) {
        try {
          const encoded = sessionToken.split('.')[0];
          // Add padding for base64url → base64 conversion
          const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(
            encoded.length + (4 - (encoded.length % 4)) % 4, '='
          );
          const payload = JSON.parse(atob(padded));
          isAdminSession = payload.isAdmin === true;
        } catch {}
      }
      // V2.7.1: ALL users including admin must complete MFA setup
      return NextResponse.redirect(new URL('/setup-2fa', req.url));
    }
    return NextResponse.next({ request: { headers: cleanHeaders } });
  }

  // Global rate limit: 300 req/min per IP (blocks scanners before auth overhead)
  if (pathname.startsWith('/api/')) {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    // Lightweight fixed-window check in memory — Vercel edge functions are stateless so
    // we use a simple Redis check only for POST/DELETE to avoid adding latency to GETs
    if (req.method === 'POST' || req.method === 'DELETE' || req.method === 'PATCH') {
      try {
        const rlKey = `wt:middleware:rl:${clientIp}`;
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
        if (redisUrl && redisToken) {
          const incrRes = await fetch(redisUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(['INCR', rlKey]),
          });
          if (incrRes.ok) {
            const data = await incrRes.json() as { result: number };
            if (data.result === 1) {
              // Set 60s window on first request
              fetch(redisUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(['EXPIRE', rlKey, 60]),
              }).catch(() => {});
            }
            if (data.result > 200) {
              return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }
          }
        }
      } catch { /* fail open */ }
    }
  }

  // All /api/* routes require authentication
  if (pathname.startsWith('/api/')) {
    const sessionToken = req.cookies.get('wt_session')?.value;
    const apiKey = req.headers.get('x-api-key');
    const masterKey = process.env.WATCHTOWER_API_KEY;

    // API key auth
    if (apiKey && masterKey && apiKey === masterKey) {
      // Inject identity into REQUEST headers so route handlers can read them
      const headers = new Headers(req.headers);
      headers.set('x-user-id', 'api-key-user');
      headers.set('x-tenant-id', 'global');
      headers.set('x-is-admin', 'true');
      return NextResponse.next({ request: { headers } });
    }

    // Session cookie auth
    const session = sessionToken ? await verifySessionToken(sessionToken) : null;
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide a valid session cookie or X-API-Key header.' },
        { status: 401 }
      );
    }

    // Check JTI blacklist — ensures logged-out tokens are immediately rejected
    if ((session as any).jti) {
      try {
        const blacklistRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['GET', `wt:jti:blacklisted:${(session as any).jti}`]),
        });
        if (blacklistRes.ok) {
          const data = await blacklistRes.json() as { result: string | null };
          if (data.result === '1') {
            return NextResponse.json({ error: 'Session revoked. Please log in again.' }, { status: 401 });
          }
        }
      } catch { /* Redis unavailable — fail open to avoid locking users out */ }
    }

    // Inject verified identity into REQUEST headers — this is how route handlers read them
    const headers = new Headers(req.headers);
    headers.set('x-user-id', session.userId);
    headers.set('x-tenant-id', session.tenantId);
    headers.set('x-is-admin', String(session.isAdmin));
    // Inject tier: admins get full access; read from signed JWT payload (not cookie)
    // The tier in the JWT is set at login/signup and is tamper-proof
    const jwtTier = (session as any).tier as string | undefined;
    headers.set('x-user-tier', session.isAdmin ? 'mssp' : (jwtTier || 'community'));
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
