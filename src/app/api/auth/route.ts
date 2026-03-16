import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';

function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) { hash = ((hash << 5) - hash) + pw.charCodeAt(i); hash |= 0; }
  return 'h_' + Math.abs(hash).toString(36) + '_' + pw.length;
}

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Legacy: simple password check
  const dashPw = process.env.DASHBOARD_PASSWORD;
  if (dashPw && password === dashPw && !email) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('secops-auth', dashPw, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return res;
  }

  // New: email/password auth
  if (email && password) {
    const configs = await loadToolConfigs();
    const user = configs.users?.[email];
    if (!user || user.password !== hashPassword(password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, user: { email: user.email, org: user.org, plan: user.plan, role: user.role, tenantId: user.tenantId } });
    res.cookies.set('secops-auth', email, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
    res.cookies.set('secops-tenant', user.tenantId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });

    // Audit log
    if (!configs.auditLog) configs.auditLog = [];
    configs.auditLog.push({ action: 'user_login', email, time: new Date().toISOString() });
    try { const { saveToolConfigs: save } = require('@/lib/config-store'); await save(configs); } catch {}

    return res;
  }

  return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
}
