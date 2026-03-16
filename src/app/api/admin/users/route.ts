import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';

async function requireSuperAdmin(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const email = authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null;
  if (!email) return null;
  const configs = await loadPlatformData();
  const user = configs.users?.[email];
  if (!user || user.role !== 'superadmin') return null;
  return { email, configs };
}

export async function GET(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  
  const users = Object.entries(auth.configs.users || {}).map(([email, u]: any) => ({
    email, org: u.org, plan: u.plan, role: u.role, tenantId: u.tenantId,
    createdAt: u.createdAt, trialEndsAt: u.trialEndsAt,
    hasStripe: !!u.stripeCustomerId,
  }));
  return NextResponse.json({ users, total: users.length });
}

export async function PUT(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  
  const { email, plan, role, disabled } = await req.json();
  if (!email || !auth.configs.users?.[email]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  
  if (plan) auth.configs.users[email].plan = plan;
  if (role) auth.configs.users[email].role = role;
  if (disabled !== undefined) auth.configs.users[email].disabled = disabled;
  
  if (!auth.configs.auditLog) auth.configs.auditLog = [];
  auth.configs.auditLog.push({ action: 'admin_user_update', target: email, by: auth.email, changes: { plan, role, disabled }, time: new Date().toISOString() });
  
  auth.configs.updatedAt = new Date().toISOString();
  await savePlatformData(auth.configs);
  return NextResponse.json({ ok: true, message: `Updated ${email}` });
}

export async function DELETE(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  
  const { email } = await req.json();
  if (!email || !auth.configs.users?.[email]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (auth.configs.users[email].role === 'superadmin') return NextResponse.json({ error: 'Cannot delete superadmin' }, { status: 400 });
  
  delete auth.configs.users[email];
  auth.configs.auditLog?.push({ action: 'admin_user_deleted', target: email, by: auth.email, time: new Date().toISOString() });
  auth.configs.updatedAt = new Date().toISOString();
  await savePlatformData(auth.configs);
  return NextResponse.json({ ok: true });
}
