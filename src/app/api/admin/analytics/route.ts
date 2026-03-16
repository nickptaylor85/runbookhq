import { NextResponse } from 'next/server';
import { loadPlatformData, loadTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  if (!email || platform.users?.[email]?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = Object.values(platform.users || {}) as any[];
  const tenants = Object.values(platform.tenants || {}) as any[];
  const logs = platform.auditLog || [];

  const now = Date.now();
  const day = 86400000;
  const usersToday = users.filter((u: any) => now - new Date(u.createdAt).getTime() < day).length;
  const usersWeek = users.filter((u: any) => now - new Date(u.createdAt).getTime() < 7 * day).length;
  const usersMonth = users.filter((u: any) => now - new Date(u.createdAt).getTime() < 30 * day).length;

  const planCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};
  users.forEach((u: any) => {
    planCounts[u.plan || 'starter'] = (planCounts[u.plan || 'starter'] || 0) + 1;
    roleCounts[u.role || 'admin'] = (roleCounts[u.role || 'admin'] || 0) + 1;
  });

  const activeTrial = users.filter((u: any) => u.trialEndsAt && new Date(u.trialEndsAt).getTime() > now).length;
  const expiredTrial = users.filter((u: any) => u.trialEndsAt && new Date(u.trialEndsAt).getTime() <= now).length;
  const withStripe = users.filter((u: any) => u.stripeCustomerId).length;

  // MRR calculation
  const pricePlan: Record<string, number> = { starter: 0, pro: 49, enterprise: 199 };
  const mrr = users.reduce((sum: number, u: any) => sum + (pricePlan[u.plan] || 0), 0);

  // Recent logins (last 7 days)
  const recentLogins = logs.filter((l: any) => l.action === 'user_login' && now - new Date(l.time).getTime() < 7 * day).length;

  // Signups over time (last 30 days, daily)
  const signupsByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * day).toISOString().split('T')[0];
    signupsByDay[d] = 0;
  }
  users.forEach((u: any) => {
    const d = new Date(u.createdAt).toISOString().split('T')[0];
    if (signupsByDay[d] !== undefined) signupsByDay[d]++;
  });

  return NextResponse.json({
    users: { total: users.length, today: usersToday, week: usersWeek, month: usersMonth },
    tenants: { total: tenants.length },
    plans: planCounts,
    roles: roleCounts,
    trials: { active: activeTrial, expired: expiredTrial },
    billing: { mrr, withStripe, currency: 'GBP' },
    activity: { recentLogins, totalAuditEntries: logs.length },
    signupsByDay,
  });
}
