import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes
  if (path === '/' || path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/api/auth') || path.startsWith('/api/stripe') || path.startsWith('/_next')) {
    return NextResponse.next();
  }

  // API routes: accept cookie OR API key
  if (path.startsWith('/api/')) {
    const authCookie = request.cookies.get('secops-auth');
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

    // API key auth (validated in the route handler via validateApiKey)
    if (apiKey && apiKey.startsWith('rbhq_')) {
      return NextResponse.next();
    }

    // Cookie auth
    if (authCookie?.value) {
      const dashPw = process.env.DASHBOARD_PASSWORD;
      if ((dashPw && authCookie.value === dashPw) || authCookie.value.includes('@')) {
        return NextResponse.next();
      }
    }

    return NextResponse.json({ error: 'Unauthorized. Provide a valid session cookie or X-API-Key header.' }, { status: 401 });
  }

  // Dashboard/settings/admin routes: cookie only
  const authCookie = request.cookies.get('secops-auth');
  if (!authCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const dashPw = process.env.DASHBOARD_PASSWORD;
  if ((dashPw && authCookie.value === dashPw) || authCookie.value.includes('@')) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
