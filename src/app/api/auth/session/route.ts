import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const isAdminHeader = req.headers.get('x-is-admin');

  // If middleware injected a verified session, use it
  if (userId) {
    return NextResponse.json({
      authenticated: true,
      userId,
      tenantId,
      isAdmin: isAdminHeader === 'true',
    });
  }

  // No session cookie — check if we're in dev mode (env vars not configured)
  // In dev/unprotected mode, grant admin access so the dashboard is usable
  const hasAuth = !!(process.env.WATCHTOWER_ADMIN_EMAIL && process.env.WATCHTOWER_ADMIN_PASS);
  
  if (!hasAuth) {
    // Dev mode — no auth configured, grant full admin
    return NextResponse.json({
      authenticated: true,
      userId: 'dev-admin',
      tenantId: 'global',
      isAdmin: true,
    });
  }

  // Auth IS configured but no valid session — redirect to login
  return NextResponse.json({ authenticated: false, isAdmin: false }, { status: 401 });
}
