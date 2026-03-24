import { NextRequest, NextResponse } from 'next/server';

// Session verification using Web Crypto API (Edge Runtime compatible)
async function verifySessionToken(token: string): Promise<{ userId: string; tenantId: string; isAdmin: boolean } | null> {
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

    if (sig !== expectedSig) return null;
    const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    if (Date.now() - payload.iat > 86400000) return null;
    return payload;
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = ['/', '/demo', '/pricing', '/guide', '/login', '/signup',
  '/stripe/success', '/api/auth/login', '/api/auth/logout', '/api/stripe/webhook',
  '/_next/', '/favicon', '/robots.txt', '/sitemap'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and dashboard (client-side auth)
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === '/dashboard') {
    return NextResponse.next();
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
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
