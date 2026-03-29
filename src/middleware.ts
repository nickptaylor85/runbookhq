import { NextRequest, NextResponse } from 'next/server';

// Session verification using Web Crypto API (Edge Runtime compatible)
async function verifySessionToken(token: string): Promise<{ userId: string; tenantId: string; isAdmin: boolean; tier?: string } | null> {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
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
      if (!isAdminSession) {
        return NextResponse.redirect(new URL('/setup-2fa', req.url));
      }
      // Admin: clear stale cookie and proceed
      const res = NextResponse.next({ request: { headers: cleanHeaders } });
      res.cookies.set('wt_mfa_pending', '', { maxAge: 0, path: '/' });
      return res;
    }
    return NextResponse.next({ request: { headers: cleanHeaders } });
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
