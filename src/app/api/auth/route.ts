import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';
import { verifyPassword, verifyTotp, checkRateLimit, generateSessionToken } from '@/lib/crypto';

export async function POST(req: Request) {
  const { email, password, totpCode } = await req.json();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit: 5 attempts per 15 minutes per IP
  const rl = checkRateLimit(`login:${ip}`, 5, 900000);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Too many login attempts. Try again in ${Math.ceil(rl.retryAfterMs / 60000)} minutes.` }, { status: 429 });
  }

  // Legacy: simple password check (no email)
  const dashPw = process.env.DASHBOARD_PASSWORD;
  if (dashPw && password === dashPw && !email) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('secops-auth', dashPw, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return res;
  }

  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  const platform = await loadPlatformData();
  const user = platform.users?.[email];
  if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  if (user.disabled) return NextResponse.json({ error: 'Account is disabled. Contact your administrator.' }, { status: 403 });

  if (!verifyPassword(password, user.password)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // 2FA check
  if (user.totpEnabled && user.totpSecret) {
    if (!totpCode) {
      return NextResponse.json({ requires2fa: true, message: 'Enter your authenticator code' });
    }
    if (!verifyTotp(user.totpSecret, totpCode)) {
      return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 401 });
    }
  }

  // Generate session
  const sessionToken = generateSessionToken();
  if (!platform.sessions) platform.sessions = {};
  platform.sessions[sessionToken] = { email, tenantId: user.tenantId, createdAt: new Date().toISOString(), ip, userAgent: req.headers.get('user-agent')?.substring(0, 100) || '' };

  // Audit
  if (!platform.auditLog) platform.auditLog = [];
  platform.auditLog.push({ action: 'user_login', email, ip, time: new Date().toISOString() });
  user.lastLoginAt = new Date().toISOString();
  await savePlatformData(platform);

  const res = NextResponse.json({ ok: true, user: { email: user.email, org: user.org, plan: user.plan, role: user.role, tenantId: user.tenantId, totpEnabled: !!user.totpEnabled } });
  res.cookies.set('secops-auth', email, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  res.cookies.set('secops-tenant', user.tenantId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  res.cookies.set('secops-session', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
