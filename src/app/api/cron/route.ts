import { NextRequest, NextResponse } from 'next/server';
import { redisHGetAll, KEYS } from '@/lib/redis';

// Vercel cron — add to vercel.json: { "crons": [{ "path": "/api/cron", "schedule": "0 8 * * 1" }] }
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent abuse
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];
  const origin = req.nextUrl.origin;

  try {
    // Get global tenant settings for weekly digest
    const settings = await redisHGetAll(KEYS.TENANT_SETTINGS('global'));
    const notifDigest = settings.notif_digest !== 'false';
    const userEmail = settings.email || '';

    if (notifDigest && userEmail) {
      // Fire weekly digest email
      const digestRes = await fetch(`${origin}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'global' },
        body: JSON.stringify({
          type: 'weekly_digest',
          to: userEmail,
          digest: {
            totalAlerts: 0, critAlerts: 0, closedCases: 0, posture: 0,
          },
        }),
      });
      results.push(`digest:${userEmail}:${digestRes.ok ? 'ok' : 'failed'}`);
    }

    // TODO: iterate MSSP clients and generate per-client reports
    // When per-client email is stored, fetch each client's metrics and send
    results.push('cron:complete');
    return NextResponse.json({ ok: true, results });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
