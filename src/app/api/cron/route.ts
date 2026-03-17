import { NextResponse } from 'next/server';
import { loadPlatformData, loadTenantConfigs } from '@/lib/config-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Vercel Cron calls this endpoint
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const platform = await loadPlatformData();
  const users = Object.values(platform.users || {}) as any[];
  const results: any[] = [];

  for (const user of users) {
    if (!user.email || !user.tenantId) continue;

    const configs = await loadTenantConfigs(user.tenantId);
    const emailPrefs = configs.emailPrefs || { dailyDigest: false, weeklyReport: false, alertNotify: false };

    // Daily digest - send at 8am (cron runs hourly, we check time)
    const hour = new Date().getUTCHours();

    if (emailPrefs.dailyDigest && hour === 8) {
      try {
        const nr = configs.noiseReduction?.stats || {};
        const sla = (configs.slaTracking || []).filter((s: any) => !s.resolvedAt);
        const incidents = (configs.incidents || []).filter((i: any) => i.status !== 'closed');

        const summary = `Good morning! Here's your daily security digest:\n\n` +
          `Open incidents: ${incidents.length}\n` +
          `Active SLA items: ${sla.length}\n` +
          `Alerts auto-closed by AI: ${nr.autoClosed || 0}\n` +
          `Time saved by AI: ${Math.round((nr.timeSavedMins || 0) / 60 * 10) / 10} hours\n\n` +
          `View your full dashboard at https://watchtower.vercel.app/dashboard`;

        await sendDigest(user.email, summary);
        results.push({ email: user.email, type: 'daily_digest', ok: true });
      } catch (e) { results.push({ email: user.email, type: 'daily_digest', error: String(e) }); }
    }

    // Weekly report - send on Monday at 9am
    const day = new Date().getUTCDay();
    if (emailPrefs.weeklyReport && day === 1 && hour === 9) {
      try {
        await sendDigest(user.email, `Your weekly security report is ready. View it at https://watchtower.vercel.app/report`);
        results.push({ email: user.email, type: 'weekly_report', ok: true });
      } catch (e) { results.push({ email: user.email, type: 'weekly_report', error: String(e) }); }
    }

    // Trial expiry warning - 3 days before
    if (user.trialEndsAt) {
      const daysLeft = Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000);
      if (daysLeft === 3 && hour === 10) {
        try {
          const apiKey = process.env.RESEND_API_KEY;
          if (apiKey) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: process.env.RESEND_FROM || 'Watchtower <alerts@watchtower.io>',
                to: [user.email],
                subject: '⏰ Your Watchtower trial ends in 3 days',
                html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Your trial is ending soon</h2><p>Your Watchtower Pro trial expires in 3 days. Upgrade now to keep AI triage, threat intel, and all Pro features.</p><a href="https://watchtower.vercel.app/signup?plan=pro" style="display:inline-block;padding:12px 24px;background:#5b9aff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Upgrade to Pro →</a></div>`,
              }),
            });
            results.push({ email: user.email, type: 'trial_expiry', ok: true });
          }
        } catch (e) { results.push({ email: user.email, type: 'trial_expiry', error: String(e) }); }
      }
    }
  }

  return NextResponse.json({ ok: true, processed: users.length, sent: results.filter(r => r.ok).length, results });
}

async function sendDigest(to: string, summary: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Watchtower <alerts@watchtower.io>',
      to: [to],
      subject: `📊 Watchtower Daily Digest — ${new Date().toLocaleDateString('en-GB')}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:#0a0d15;padding:24px;border-radius:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);text-align:center;line-height:28px;color:#fff;font-weight:900;font-size:12px">W</div><span style="color:#eaf0ff;font-weight:900;font-size:16px">Watchtower</span></div><div style="color:#eaf0ff;font-size:14px;line-height:1.8;white-space:pre-line">${summary}</div></div></div>`,
    }),
  });
}
