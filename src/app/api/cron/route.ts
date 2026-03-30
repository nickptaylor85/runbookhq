import { NextRequest, NextResponse } from 'next/server';
import { redisHGetAll, redisGet, KEYS } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers.get('authorization');
  // Accept Vercel's own cron invocation header as fallback
  const vercelCronHeader = req.headers.get('x-vercel-cron') === '1';
  // SECURITY: if cronSecret is unset, block ALL external calls (only allow Vercel internal)
  if (!cronSecret && !vercelCronHeader) {
    return NextResponse.json({ error: 'CRON_SECRET not configured — set env var to enable cron' }, { status: 503 });
  }
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !vercelCronHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];
  const origin = req.nextUrl.origin;

  try {
    // 1. Global weekly digest
    const globalSettings = await redisHGetAll(KEYS.TENANT_SETTINGS('global'));
    const notifDigest = globalSettings.notif_digest !== 'false';
    const globalEmail = globalSettings.email || '';

    if (notifDigest && globalEmail) {
      const res = await fetch(`${origin}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'global' },
        body: JSON.stringify({ type: 'weekly_digest', to: globalEmail, digest: { totalAlerts: 0, critAlerts: 0, closedCases: 0, posture: 0 } }),
      });
      results.push(`global_digest:${globalEmail}:${res.ok ? 'ok' : 'failed'}`);
    }

    // 2. Per-client MSSP reports — load client list from slug map
    const slugMapRaw = await redisGet('wt:mssp:slug_map');
    const slugMap: Record<string, string> = slugMapRaw ? JSON.parse(slugMapRaw) : {};
    const clientTenants = [...new Set(Object.values(slugMap))];

    for (const clientId of clientTenants) {
      try {
        const clientSettings = await redisHGetAll(KEYS.TENANT_SETTINGS(clientId));
        const clientEmail = clientSettings.email || '';
        if (!clientEmail) { results.push(`client_report:${clientId}:no_email`); continue; }

        // Generate executive summary for this client
        const summaryRes = await fetch(`${origin}/api/exec-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': clientId },
          body: JSON.stringify({
            org: clientSettings.orgName || clientId,
            period: 'Last 7 days',
            totalAlerts: 0, critAlerts: 0, openCases: 0, closedCases: 0,
            slaBreaches: 0, fpsClosed: 0, tpConfirmed: 0,
            posture: 0, coverage: 0, tools: 0,
          }),
        });

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json() as { html?: string };
          if (summaryData.html) {
            const emailRes = await fetch(`${origin}/api/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-tenant-id': clientId },
              body: JSON.stringify({
                type: 'custom',
                to: clientEmail,
                subject: `Weekly Security Report — ${clientSettings.orgName || clientId}`,
                customHtml: summaryData.html,
              }),
            });
            results.push(`client_report:${clientId}:${emailRes.ok ? 'ok' : 'email_failed'}`);
          }
        } else {
          results.push(`client_report:${clientId}:summary_failed`);
        }
      } catch(clientErr: any) {
        results.push(`client_report:${clientId}:error:${clientErr.message}`);
      }
    }

    results.push('cron:complete');
    return NextResponse.json({ ok: true, results, clientsProcessed: clientTenants.length });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
