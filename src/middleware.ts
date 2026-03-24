import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// Simple session verification - inline to avoid import issues in edge runtime
function verifySessionToken(token: string): { userId: string; tenantId: string; isAdmin: boolean } | null {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Date.now() - payload.iat > 86400000) return null; // 24h expiry
    return payload;
  } catch {
    return null;
  }
}

// Routes that don't require auth
const PUBLIC_PATHS = ['/', '/demo', '/pricing', '/guide', '/login', '/signup',
  '/stripe/success', '/api/auth/login', '/api/auth/logout', '/api/stripe/webhook',
  '/_next/', '/favicon', '/robots.txt', '/sitemap'];

export function middleware(req: NextRequest) {
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
      session = verifySessionToken(sessionToken);
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
