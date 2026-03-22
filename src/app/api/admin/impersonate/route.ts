import { NextResponse } from 'next/server';
import { loadPlatformData } from '@/lib/config-store';

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  // Check for original admin cookie first (already impersonating another tenant)
  const origMatch = cookie.match(/secops-admin-original=([^;]+)/);
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const adminEmail = origMatch?.[1] ? decodeURIComponent(origMatch[1]) : authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null;
  
  const configs = await loadPlatformData();
  if (!adminEmail || configs.users?.[adminEmail]?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }
  
  const { email } = await req.json();
  const target = configs.users?.[email];
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
  // Set cookies to impersonate, but save original admin email
  const res = NextResponse.json({ ok: true, message: `Impersonating ${email}`, user: { email: target.email, org: target.org, plan: target.plan } });
  res.cookies.set('secops-auth', email, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 2, path: '/' });
  res.cookies.set('secops-tenant', target.tenantId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 2, path: '/' });
  // If switching back to own admin account, clear the impersonation cookie
  if (email === adminEmail) {
    res.cookies.set('secops-admin-original', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  } else {
    res.cookies.set('secops-admin-original', adminEmail, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 2, path: '/' });
  }
  
  configs.auditLog?.push({ action: 'admin_impersonate', admin: adminEmail, target: email, time: new Date().toISOString() });
  try { const { savePlatformData: save } = require('@/lib/config-store'); await save(configs); } catch(e) {}
  
  return res;
}
