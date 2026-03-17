import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';
import { hashPassword, checkRateLimit } from '@/lib/crypto';

export async function POST(req: Request) {
  const { email, password, org, plan } = await req.json();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit: 3 registrations per hour per IP
  const rl = checkRateLimit(`register:${ip}`, 3, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'Too many registrations. Try again later.' }, { status: 429 });

  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  if (!email.includes('@')) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

  const platform = await loadPlatformData();
  if (!platform.users) platform.users = {};
  if (platform.users[email]) return NextResponse.json({ error: 'Account already exists. Please sign in.' }, { status: 409 });

  const tenantId = 'tn_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  platform.users[email] = {
    email, password: hashPassword(password), org: org || 'My Organisation',
    plan: plan || 'starter', role: 'admin', tenantId,
    createdAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    totpEnabled: false, totpSecret: null,
  };

  if (!platform.tenants) platform.tenants = {};
  platform.tenants[tenantId] = {
    id: tenantId, name: org || 'My Organisation', plan: plan || 'starter',
    owner: email, members: [email], createdAt: new Date().toISOString(),
  };

  if (!platform.auditLog) platform.auditLog = [];
  platform.auditLog.push({ action: 'user_registered', email, tenantId, plan, ip, time: new Date().toISOString() });
  await savePlatformData(platform);

  const res = NextResponse.json({ ok: true, tenantId, plan });
  res.cookies.set('secops-auth', email, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  res.cookies.set('secops-tenant', tenantId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
