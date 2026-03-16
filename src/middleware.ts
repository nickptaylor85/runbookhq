import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes - no auth needed
  if (path === '/' || path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/api/auth') || path.startsWith('/api/stripe') || path.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Protected routes
  const authCookie = request.cookies.get('secops-auth');

  if (!authCookie?.value) {
    // API routes return 401
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Dashboard routes redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Legacy: check if it's a simple password
  const dashPw = process.env.DASHBOARD_PASSWORD;
  if (dashPw && authCookie.value === dashPw) {
    return NextResponse.next();
  }

  // New: email-based auth - cookie contains email
  if (authCookie.value.includes('@')) {
    return NextResponse.next();
  }

  // Invalid cookie
  if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
