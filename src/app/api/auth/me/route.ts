import { NextResponse } from 'next/server';
import { loadPlatformData } from '@/lib/config-store';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const email = authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null;
  if (!email || !email.includes('@')) return NextResponse.json({ user: null });

  const platform = await loadPlatformData();
  const user = platform.users?.[email];
  if (!user) return NextResponse.json({ user: null });

  const tenant = platform.tenants?.[user.tenantId];
  const adminOriginal = cookie.match(/secops-admin-original=([^;]+)/);
  const isImpersonating = !!adminOriginal;
  const adminEmail = adminOriginal ? decodeURIComponent(adminOriginal[1]) : null;
  return NextResponse.json({
    user: {
      email: user.email, org: user.org, plan: user.plan, role: user.role,
      tenantId: user.tenantId, createdAt: user.createdAt,
      trialEndsAt: user.trialEndsAt, totpEnabled: !!user.totpEnabled,
      lastLoginAt: user.lastLoginAt, addons: user.addons || [],
      seats: user.seats, seatLimit: user.seatLimit,
      isImpersonating, adminEmail,
    },
    addons: user.addons || [],
    tenant: tenant ? { id: tenant.id, name: tenant.name, plan: tenant.plan, members: tenant.members, memberCount: tenant.members?.length || 0 } : null,
  });
}
