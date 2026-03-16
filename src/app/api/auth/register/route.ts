import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';

function hashPassword(pw: string): string {
  // Simple hash for demo - in production use bcrypt
  let hash = 0;
  for (let i = 0; i < pw.length; i++) { hash = ((hash << 5) - hash) + pw.charCodeAt(i); hash |= 0; }
  return 'h_' + Math.abs(hash).toString(36) + '_' + pw.length;
}

export async function POST(req: Request) {
  const { email, password, org, plan } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  // Load existing users from Redis
  const configs = await loadPlatformData();
  if (!configs.users) configs.users = {};

  // Check if user exists
  if (configs.users[email]) return NextResponse.json({ error: 'Account already exists. Please sign in.' }, { status: 409 });

  // Create tenant
  const tenantId = 'tn_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  // Create user
  configs.users[email] = {
    email,
    password: hashPassword(password),
    org: org || 'My Organisation',
    plan: plan || 'starter',
    role: 'admin',
    tenantId,
    createdAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
  };

  // Create tenant
  if (!configs.tenants) configs.tenants = {};
  configs.tenants[tenantId] = {
    id: tenantId,
    name: org || 'My Organisation',
    plan: plan || 'starter',
    owner: email,
    members: [email],
    createdAt: new Date().toISOString(),
  };

  // Log audit
  if (!configs.auditLog) configs.auditLog = [];
  configs.auditLog.push({ action: 'user_registered', email, tenantId, plan, time: new Date().toISOString() });

  configs.updatedAt = new Date().toISOString();
  await savePlatformData(configs);

  // Set auth cookie
  const res = NextResponse.json({ ok: true, tenantId, plan });
  res.cookies.set('secops-auth', email, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  res.cookies.set('secops-tenant', tenantId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
