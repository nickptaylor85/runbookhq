import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const adminEmail = authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null;
  
  const configs = await loadToolConfigs();
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
  res.cookies.set('secops-admin-original', adminEmail, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 2, path: '/' });
  
  configs.auditLog?.push({ action: 'admin_impersonate', admin: adminEmail, target: email, time: new Date().toISOString() });
  try { const { saveToolConfigs: save } = require('@/lib/config-store'); await save(configs); } catch {}
  
  return res;
}
