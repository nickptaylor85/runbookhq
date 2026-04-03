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

// Exact-match public pages (no prefix matching to avoid '/' matching everything)
const PUBLIC_EXACT = new Set(['/', '/demo', '/pricing', '/guide', '/login', '/signup',
  '/setup-2fa', '/stripe/success', '/press', '/blog', '/security', '/privacy', '/terms',
  '/changelog', '/docs', '/robots.txt', '/sitemap.xml']);

// Non-API prefix matches only (//_next/, favicon, etc.)
const PUBLIC_PREFIXES = [
  '/demo/', '/pricing/', '/guide/', '/login/', '/signup/', '/press/', '/blog/',
  '/security/', '/privacy/', '/terms/', '/changelog/', '/docs/',
  '/_next/', '/favicon', '/robots.', '/sitemap',
];

// SECURITY: All /api/* public routes use EXACT path matching, never prefix matching.
// Prefix matching caused /api/auth/session to match /api/auth/sessions,
// and /api/auth/totp to match /api/auth/totp-test (confirmed live exploits).
const PUBLIC_API_EXACT = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/totp',
  '/api/auth/saml',
  '/api/auth/signup',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/verify',
  '/api/auth/invite',
  '/api/stripe/webhook',
  '/api/waitlist',
  '/api/widget',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_API_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always strip spoofable identity headers from incoming requests
  // These are set by middleware from verified session — never trust client-supplied values
  const cleanHeaders = new Headers(req.headers);
  cleanHeaders.delete('x-is-admin');
  cleanHeaders.delete('x-user-id');
  cleanHeaders.delete('x-user-tier');
  cleanHeaders.delete('x-user-role');
  // Note: x-tenant-id from client is overridden by session in authenticated routes

  // Allow public paths — EXACT match for '/' prevents prefix match bypassing auth
  if (isPublicPath(pathname)) {
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

  // Global rate limit: unauthenticated scanners only — skip for authenticated sessions
  // Authenticated users have per-route limits in each API handler
  if (pathname.startsWith('/api/')) {
    const sessionCookie = req.cookies.get('wt_session')?.value;
    const isAuthenticated = !!sessionCookie;
    if (!isAuthenticated && (req.method === 'POST' || req.method === 'DELETE' || req.method === 'PATCH')) {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
      try {
        const rlKey = `wt:middleware:rl2:${clientIp}`;
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
              fetch(redisUrl, {
                method: 'POST',
                headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(['EXPIRE', rlKey, 60]),
              }).catch(() => {});
            }
            if (data.result > 100) {
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
    // Inject tier and role from signed JWT payload (tamper-proof)
    const jwtTier = (session as any).tier as string | undefined;
    const jwtRole = (session as any).role as string | undefined;
    headers.set('x-user-tier', session.isAdmin ? 'mssp' : (jwtTier || 'community'));
    headers.set('x-user-role', session.isAdmin ? 'owner' : (jwtRole || 'viewer'));
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
