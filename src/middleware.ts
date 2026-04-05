import { NextRequest, NextResponse } from 'next/server';

// ─── Subdomain detection ────────────────────────────────────────────────────
// Extracts client slug from subdomain: acme.getwatchtower.io → "acme"
// Returns null for bare domain, www, or non-matching hosts
const BASE_DOMAINS = ['getwatchtower.io', 'getwatchtower.com', 'localhost:3000', 'localhost'];
function extractSubdomain(host: string): string | null {
  const h = host.toLowerCase().replace(/:\d+$/, '');
  for (const base of BASE_DOMAINS) {
    const b = base.replace(/:\d+$/, '');
    if (h === b || h === `www.${b}`) return null;
    if (h.endsWith(`.${b}`)) {
      const sub = h.slice(0, h.length - b.length - 1);
      if (sub && sub !== 'www' && sub !== 'app' && /^[a-z0-9][a-z0-9-]*$/.test(sub)) return sub;
    }
  }
  return null;
}

// ─── Slug → Tenant resolution (Redis) ────────────────────────────────────────
async function resolveSlugToTenant(slug: string): Promise<{ tenantId: string; branding?: Record<string, string> } | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!redisUrl || !redisToken) {
    const defaults: Record<string, string> = {
      'acme-financial': 'client-acme', 'acme': 'client-acme',
      'nhs-trust': 'client-nhs', 'nhs': 'client-nhs',
      'retailco': 'client-retail',
      'gov-dept': 'client-gov', 'gov': 'client-gov',
    };
    if (defaults[slug]) return { tenantId: defaults[slug] };
    return null;
  }
  try {
    const mapRes = await fetch(redisUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', 'wt:mssp:slug_map']),
    });
    if (mapRes.ok) {
      const data = await mapRes.json() as { result?: string };
      if (data.result) {
        const map: Record<string, string> = JSON.parse(data.result);
        if (map[slug]) {
          const brandRes = await fetch(redisUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(['GET', `wt:${map[slug]}:mssp_branding`]),
          }).catch(() => null);
          let branding: Record<string, string> | undefined;
          if (brandRes?.ok) {
            const bd = await brandRes.json() as { result?: string };
            if (bd.result) branding = JSON.parse(bd.result);
          }
          return { tenantId: map[slug], branding };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Session verification using Web Crypto API (Edge Runtime compatible)
async function verifySessionToken(token: string): Promise<{ userId: string; tenantId: string; isAdmin: boolean; tier?: string } | null> {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('WATCHTOWER_SESSION_SECRET env var not set in production'); })() : 'watchtower-dev-session-secret');
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(encoded));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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

const PUBLIC_EXACT = new Set(['/', '/demo', '/pricing', '/guide', '/login', '/signup',
  '/setup-2fa', '/stripe/success', '/press', '/blog', '/security', '/privacy', '/terms',
  '/changelog', '/docs', '/robots.txt', '/sitemap.xml',
  '/portal', '/portal/login']);

const PUBLIC_PREFIXES = [
  '/demo/', '/pricing/', '/guide/', '/login/', '/signup/', '/press/', '/blog/',
  '/security/', '/privacy/', '/terms/', '/changelog/', '/docs/',
  '/portal/', '/portal/login/',
  '/_next/', '/favicon', '/robots.', '/sitemap',
];

const PUBLIC_API_EXACT = new Set([
  '/api/auth/login', '/api/auth/logout', '/api/auth/session', '/api/auth/totp',
  '/api/auth/saml', '/api/auth/signup', '/api/auth/register', '/api/auth/reset-password',
  '/api/auth/verify', '/api/auth/invite', '/api/stripe/webhook', '/api/waitlist', '/api/widget',
  '/api/portal/resolve',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_API_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  const cleanHeaders = new Headers(req.headers);
  cleanHeaders.delete('x-is-admin');
  cleanHeaders.delete('x-user-id');
  cleanHeaders.delete('x-user-tier');
  cleanHeaders.delete('x-user-role');
  cleanHeaders.delete('x-portal-mode');
  cleanHeaders.delete('x-portal-slug');
  cleanHeaders.delete('x-portal-tenant');
  cleanHeaders.delete('x-portal-branding');

  // ─── Subdomain-based client portal routing ─────────────────────────────────
  const subdomain = extractSubdomain(host);

  if (subdomain) {
    const resolved = await resolveSlugToTenant(subdomain);

    if (resolved) {
      cleanHeaders.set('x-portal-mode', 'true');
      cleanHeaders.set('x-portal-slug', subdomain);
      cleanHeaders.set('x-portal-tenant', resolved.tenantId);
      if (resolved.branding) {
        cleanHeaders.set('x-portal-branding', JSON.stringify(resolved.branding));
      }

      // Root on subdomain → redirect to portal or login
      if (pathname === '/') {
        const sessionToken = req.cookies.get('wt_session')?.value;
        const session = sessionToken ? await verifySessionToken(sessionToken) : null;
        return NextResponse.redirect(new URL(session ? '/portal' : '/portal/login', req.url));
      }

      // Portal routes → pass through with tenant context
      if (pathname.startsWith('/portal')) {
        return NextResponse.next({ request: { headers: cleanHeaders } });
      }

      // API routes on subdomains → inject tenant, proceed to normal auth
      if (pathname.startsWith('/api/')) {
        cleanHeaders.set('x-tenant-id', resolved.tenantId);
        // fall through to standard API auth
      }

      // Dashboard on subdomain → redirect to portal
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/portal', req.url));
      }
    } else {
      // Unknown subdomain → 404 portal page
      cleanHeaders.set('x-portal-mode', 'true');
      cleanHeaders.set('x-portal-slug', subdomain);
      cleanHeaders.set('x-portal-tenant', '');
      if (pathname === '/' || pathname === '/portal' || pathname === '/portal/login') {
        return NextResponse.next({ request: { headers: cleanHeaders } });
      }
    }
  }

  // ─── Standard routing (no subdomain) ──────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request: { headers: cleanHeaders } });
  }

  if (pathname === '/dashboard' || pathname.startsWith('/settings')) {
    const mfaPending = req.cookies.get('wt_mfa_pending')?.value;
    if (mfaPending === '1') {
      return NextResponse.redirect(new URL('/setup-2fa', req.url));
    }
    const sessionToken = req.cookies.get('wt_session')?.value;
    if (sessionToken) {
      try {
        const encoded = sessionToken.split('.')[0];
        const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(
          encoded.length + (4 - (encoded.length % 4)) % 4, '='
        );
        const payload = JSON.parse(atob(padded));
        const userId = payload.userId;
        const isAdmin = payload.isAdmin === true;
        if (userId && !isAdmin) {
          const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
          const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
          if (redisUrl && redisToken) {
            const flagRes = await fetch(redisUrl, {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + redisToken, 'Content-Type': 'application/json' },
              body: JSON.stringify(['GET', 'wt:user:' + userId + ':mfa_setup_required']),
            }).catch(() => null);
            if (flagRes?.ok) {
              const flagData = await flagRes.json().catch(() => null) as { result?: string } | null;
              if (flagData?.result === '1') {
                const res = NextResponse.redirect(new URL('/setup-2fa', req.url));
                res.cookies.set('wt_mfa_pending', '1', { httpOnly: false, sameSite: 'lax', maxAge: 3600, path: '/' });
                return res;
              }
            }
          }
        }
      } catch {}
    }
    return NextResponse.next({ request: { headers: cleanHeaders } });
  }

  // Rate limit unauthenticated API scanners
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
              fetch(redisUrl, { method: 'POST',
                headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(['EXPIRE', rlKey, 60]),
              }).catch(() => {});
            }
            if (data.result > 100) {
              return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }
          }
        }
      } catch {}
    }
  }

  // All /api/* routes require authentication
  if (pathname.startsWith('/api/')) {
    const sessionToken = req.cookies.get('wt_session')?.value;
    const apiKey = req.headers.get('x-api-key');
    const masterKey = process.env.WATCHTOWER_API_KEY;

    if (apiKey && masterKey && apiKey === masterKey) {
      const headers = new Headers(req.headers);
      headers.set('x-user-id', 'api-key-user');
      headers.set('x-tenant-id', 'global');
      headers.set('x-is-admin', 'true');
      return NextResponse.next({ request: { headers } });
    }

    const session = sessionToken ? await verifySessionToken(sessionToken) : null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Provide a valid session cookie or X-API-Key header.' }, { status: 401 });
    }

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
      } catch {}
    }

    const headers = new Headers(req.headers);
    headers.set('x-user-id', session.userId);
    headers.set('x-tenant-id', session.tenantId);
    headers.set('x-is-admin', String(session.isAdmin));
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
