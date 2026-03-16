import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';

function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) { hash = ((hash << 5) - hash) + pw.charCodeAt(i); hash |= 0; }
  return 'h_' + Math.abs(hash).toString(36) + '_' + pw.length;
}

export async function POST(req: Request) {
  const { secret, email, password } = await req.json();
  
  // Must provide the DASHBOARD_PASSWORD as secret to seed admin
  const dashPw = process.env.DASHBOARD_PASSWORD;
  if (!dashPw || secret !== dashPw) {
    return NextResponse.json({ error: 'Invalid admin secret. Provide your DASHBOARD_PASSWORD as the secret field.' }, { status: 403 });
  }

  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  const configs = await loadPlatformData();
  if (!configs.users) configs.users = {};
  if (!configs.tenants) configs.tenants = {};
  if (!configs.auditLog) configs.auditLog = [];

  const tenantId = configs.users[email]?.tenantId || 'tn_admin_' + Date.now().toString(36);

  configs.users[email] = {
    email,
    password: hashPassword(password),
    org: 'RunbookHQ Admin',
    plan: 'enterprise',
    role: 'superadmin',
    tenantId,
    createdAt: new Date().toISOString(),
    trialEndsAt: null,
  };

  if (!configs.tenants[tenantId]) {
    configs.tenants[tenantId] = {
      id: tenantId,
      name: 'RunbookHQ Admin',
      plan: 'enterprise',
      owner: email,
      members: [email],
      createdAt: new Date().toISOString(),
    };
  }

  configs.auditLog.push({ action: 'superadmin_seeded', email, time: new Date().toISOString() });
  configs.updatedAt = new Date().toISOString();
  await savePlatformData(configs);

  return NextResponse.json({ ok: true, message: `Super admin created: ${email}`, tenantId });
}
