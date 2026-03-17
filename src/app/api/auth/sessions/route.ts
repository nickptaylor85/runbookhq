import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const platform = await loadPlatformData();
  const sessions = Object.entries(platform.sessions || {})
    .filter(([, s]: any) => s.email === email)
    .map(([token, s]: any) => ({ id: token.substring(0, 8) + '...', createdAt: s.createdAt, ip: s.ip, userAgent: s.userAgent }))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ sessions });
}

export async function DELETE(req: Request) {
  const { email } = getTenantFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { sessionId, all } = await req.json();
  const platform = await loadPlatformData();

  if (all) {
    // Revoke all sessions for this user
    const currentSession = req.headers.get('cookie')?.match(/secops-session=([^;]+)/)?.[1];
    for (const [token, s] of Object.entries(platform.sessions || {})) {
      if ((s as any).email === email && token !== currentSession) {
        delete platform.sessions[token];
      }
    }
    platform.auditLog?.push({ action: 'all_sessions_revoked', email, time: new Date().toISOString() });
  } else if (sessionId) {
    // Find and revoke specific session
    for (const [token] of Object.entries(platform.sessions || {})) {
      if (token.startsWith(sessionId.replace('...', ''))) {
        delete platform.sessions[token];
        break;
      }
    }
  }

  await savePlatformData(platform);
  return NextResponse.json({ ok: true });
}
