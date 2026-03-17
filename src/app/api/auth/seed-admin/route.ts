import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';
import { hashPassword } from '@/lib/crypto';

export async function POST(req: Request) {
  const { secret, email, password } = await req.json();
  const dashPw = process.env.DASHBOARD_PASSWORD;
  if (!dashPw || secret !== dashPw) {
    return NextResponse.json({ error: 'Invalid admin secret. Provide your DASHBOARD_PASSWORD as the secret field.' }, { status: 403 });
  }
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  const platform = await loadPlatformData();
  if (!platform.users) platform.users = {};
  if (!platform.tenants) platform.tenants = {};
  if (!platform.auditLog) platform.auditLog = [];

  const tenantId = platform.users[email]?.tenantId || 'tn_admin_' + Date.now().toString(36);

  platform.users[email] = {
    email, password: hashPassword(password), org: 'RunbookHQ Admin',
    plan: 'enterprise', role: 'superadmin', tenantId,
    createdAt: new Date().toISOString(), trialEndsAt: null,
    totpEnabled: false, totpSecret: null,
  };

  if (!platform.tenants[tenantId]) {
    platform.tenants[tenantId] = { id: tenantId, name: 'RunbookHQ Admin', plan: 'enterprise', owner: email, members: [email], createdAt: new Date().toISOString() };
  }

  platform.auditLog.push({ action: 'superadmin_seeded', email, time: new Date().toISOString() });
  await savePlatformData(platform);
  return NextResponse.json({ ok: true, message: `Super admin created: ${email}`, tenantId });
}
