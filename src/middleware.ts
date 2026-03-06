import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next(); // No password set = no protection

  // Skip auth for login API and static files
  if (request.nextUrl.pathname.startsWith('/api/auth') || request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('secops-auth');
  if (cookie?.value === password) {
    return NextResponse.next();
  }

  // If requesting API, return 401
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Redirect to login
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
