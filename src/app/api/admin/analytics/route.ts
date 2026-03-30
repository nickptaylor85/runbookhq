import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getUsers as getUsersList } from '@/lib/users';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  try {
    const cookieStore = await cookies();
    const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
    if (token) {
      const payload = verifySession(token) as any;
      if (payload?.isAdmin === true) return true;
    }
  } catch {}
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    // Platform-wide user metrics
    const users = await getUsersList('global');

    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const monthAgo = now - 30 * 86400000;

    const tierBreakdown = { community: 0, team: 0, business: 0, mssp: 0 };
    let paidCustomers = 0;
    let weeklySignups = 0;
    let recentSignups: any[] = [];
    let churn30d = 0; // TODO: track cancellations

    for (const u of users) {
      const plan = (u as any).plan || 'community';
      if (plan in tierBreakdown) tierBreakdown[plan as keyof typeof tierBreakdown]++;
      if (plan !== 'community') paidCustomers++;
      const created = new Date(u.createdAt).getTime();
      if (created > weekAgo) weeklySignups++;
      if (u.status === 'disabled' && created > monthAgo) churn30d++;
    }

    // Sort recent signups newest first
    recentSignups = [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map(u => ({ email: u.email, plan: (u as any).plan || 'community', createdAt: u.createdAt }));

    // Weekly signup trend — last 8 weeks
    const weeklyTrend: { week: string; count: number; paid: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 86400000;
      const weekEnd   = now - i * 7 * 86400000;
      const d = new Date(weekStart);
      const weekLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      let count = 0; let paid = 0;
      for (const u of users) {
        const t = new Date(u.createdAt).getTime();
        if (t >= weekStart && t < weekEnd) {
          count++;
          if ((u as any).plan && (u as any).plan !== 'community') paid++;
        }
      }
      weeklyTrend.push({ week: weekLabel, count, paid });
    }

    // MRR calculation
    const prices = { team: 149, business: 1199, mssp: 3499 };
    const mrr = tierBreakdown.team * 149 + tierBreakdown.business * 1199 + tierBreakdown.mssp * 3499;

    return NextResponse.json({
      ok: true,
      totalSignups: users.length,
      weeklySignups,
      paidCustomers,
      communityUsers: tierBreakdown.community,
      churn30d,
      mrr,
      tierBreakdown,
      recentSignups,
      weeklyTrend,
      generatedAt: now,
    });
  } catch (e: any) {
    console.error('Analytics error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
