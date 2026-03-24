import { NextRequest, NextResponse } from 'next/server';

// Session verification using Web Crypto API (Edge Runtime compatible)
async function verifySessionToken(token: string): Promise<{ userId: string; tenantId: string; isAdmin: boolean } | null> {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const msgData = enc.encode(encoded);
    
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, msgData);
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

// Routes that don't require auth
const PUBLIC_PATHS = ['/', '/demo', '/pricing', '/guide', '/login', '/signup',
  '/stripe/success', '/api/auth/login', '/api/auth/logout', '/api/stripe/webhook',
  '/_next/', '/favicon', '/robots.txt', '/sitemap'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow dashboard (client-side rendered, auth checked client-side for now)
  if (pathname === '/dashboard') {
    return NextResponse.next();
  }

  // All /api/* routes require authentication
  if (pathname.startsWith('/api/')) {
    // Check session cookie
    const sessionToken = req.cookies.get('wt_session')?.value;
    
    // Check X-API-Key header (for programmatic access)
    const apiKey = req.headers.get('x-api-key');
    const masterKey = process.env.WATCHTOWER_API_KEY;

    let session = null;

    if (sessionToken) {
      session = await verifySessionToken(sessionToken);
    } else if (apiKey && masterKey && apiKey === masterKey) {
      // Master API key — full access
      const res = NextResponse.next();
      res.headers.set('x-auth-method', 'api-key');
      return res;
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide a valid session cookie or X-API-Key header.' },
        { status: 401 }
      );
    }

    // Inject verified identity into headers for API routes to use
    const res = NextResponse.next();
    res.headers.set('x-user-id', session.userId);
    res.headers.set('x-tenant-id', session.tenantId);
    res.headers.set('x-is-admin', String(session.isAdmin));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
