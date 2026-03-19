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

  // ═══ MSSP: Send per-client reports ═══
  try {
    const tenants = Object.values(platform.tenants || {}) as any[];
    for (const tenant of tenants) {
      try {
        const configs = await loadTenantConfigs(tenant.id);
        const schedule = (configs as any).clientReport;
        if (!schedule?.enabled || !schedule?.recipients?.length) continue;

        // Check if it's time to send (weekly = Monday, daily = every day)
        const now = new Date();
        const isMonday = now.getUTCDay() === 1;
        const shouldSend = schedule.frequency === 'daily' || (schedule.frequency === 'weekly' && isMonday);
        if (!shouldSend) continue;

        // Check if already sent today
        if (schedule.lastSent) {
          const last = new Date(schedule.lastSent);
          if (last.toDateString() === now.toDateString()) continue;
        }

        // Build report content
        const branding = (configs as any).branding || {};
        const companyName = branding.companyName || 'Watchtower';
        const nr = (configs as any).noiseReduction?.stats || {};
        const incidents = ((configs as any).incidents || []).filter((i: any) => i.status !== 'closed');
        
        const reportUrl = req.headers.get('origin') || 'https://runbookhq.vercel.app';
        const subject = companyName + ' Security Report — ' + tenant.name + ' — ' + now.toLocaleDateString();
        const html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">' +
          '<div style="text-align:center;margin-bottom:20px">' +
          (branding.logoUrl ? '<img src="' + branding.logoUrl + '" height="40" alt=""/><br/>' : '') +
          '<h1 style="font-size:18px;color:#0f172a">' + subject + '</h1></div>' +
          '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px">' +
          '<h3 style="margin:0 0 8px;font-size:14px">Summary</h3>' +
          '<p style="margin:4px 0;font-size:13px;color:#475569">Open Incidents: <strong>' + incidents.length + '</strong></p>' +
          '<p style="margin:4px 0;font-size:13px;color:#475569">AI Alerts Processed: <strong>' + (nr.totalProcessed || 0) + '</strong></p>' +
          '<p style="margin:4px 0;font-size:13px;color:#475569">Auto-Closed (FP): <strong>' + (nr.autoClosed || 0) + '</strong></p>' +
          '<p style="margin:4px 0;font-size:13px;color:#475569">Time Saved: <strong>' + Math.round((nr.timeSavedMins || 0) / 60) + ' hours</strong></p>' +
          '</div>' +
          '<div style="text-align:center;margin-top:20px">' +
          '<a href="' + reportUrl + '/report" style="background:#2563eb;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px">View Full Report →</a>' +
          '</div>' +
          (branding.reportFooter ? '<div style="margin-top:20px;font-size:11px;color:#94a3b8;text-align:center">' + branding.reportFooter + '</div>' : '') +
          (!branding.hideWatchtowerBranding ? '<div style="margin-top:16px;font-size:10px;color:#cbd5e1;text-align:center">Powered by Watchtower</div>' : '') +
          '</div>';

        // Send via Resend
        if (resendKey) {
          for (const recipient of schedule.recipients) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: fromEmail, to: recipient, subject, html }),
            });
          }
          // Update last sent
          schedule.lastSent = now.toISOString();
          schedule.nextSend = new Date(now.getTime() + (schedule.frequency === 'daily' ? 86400000 : 604800000)).toISOString();
          (configs as any).clientReport = schedule;
          await saveTenantConfigs(tenant.id, configs);
          actions.push('client-report:' + tenant.name + ':' + schedule.recipients.length + ' recipients');
        }
      } catch(e) { /* skip tenant errors */ }
    }
  } catch(e) { /* skip MSSP report errors */ }

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
