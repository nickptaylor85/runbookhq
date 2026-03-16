import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const email = authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null;
  if (!email || !email.includes('@')) return NextResponse.json({ user: null });

  const configs = await loadToolConfigs();
  const user = configs.users?.[email];
  if (!user) return NextResponse.json({ user: null });

  const tenant = configs.tenants?.[user.tenantId];
  return NextResponse.json({
    user: { email: user.email, org: user.org, plan: user.plan, role: user.role, tenantId: user.tenantId, createdAt: user.createdAt, trialEndsAt: user.trialEndsAt },
    tenant: tenant ? { id: tenant.id, name: tenant.name, plan: tenant.plan, members: tenant.members } : null,
  });
}
