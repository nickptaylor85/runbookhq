import { NextResponse } from 'next/server';
import { loadTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.RESEND_FROM || 'Watchtower <alerts@watchtower.io>', to: [to], subject, html }),
    });
    const data = await res.json();
    return res.ok ? { ok: true } : { ok: false, error: data.message || 'Send failed' };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export { sendEmail };

// POST: Send a notification email
export async function POST(req: Request) {
  const { email: senderEmail, tenantId } = getTenantFromRequest(req);
  if (!senderEmail) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { type, to, alert, summary } = await req.json();

  if (type === 'alert_digest' && to) {
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:#0a0d15;padding:20px;border-radius:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);text-align:center;line-height:28px;color:#fff;font-weight:900;font-size:12px">W</div><span style="color:#eaf0ff;font-weight:900;font-size:16px">Watchtower</span></div><h2 style="color:#eaf0ff;margin:0 0 12px">Alert Digest</h2>${alert ? `<div style="background:#141928;padding:12px;border-radius:8px;margin-bottom:12px;border-left:3px solid #ff4466"><div style="color:#ff4466;font-size:12px;font-weight:700">CRITICAL ALERT</div><div style="color:#eaf0ff;font-size:14px;font-weight:600;margin-top:4px">${alert.title || ''}</div><div style="color:#8896b8;font-size:12px;margin-top:4px">${alert.source || ''} · ${alert.device || ''}</div></div>` : ''}<div style="color:#8896b8;font-size:12px;margin-top:16px"><a href="https://watchtower.vercel.app/dashboard" style="color:#5b9aff">Open Dashboard →</a></div></div></div>`;
    const result = await sendEmail(to, `🚨 Watchtower Alert: ${alert?.title || 'New Alert'}`, html);
    return NextResponse.json(result);
  }

  if (type === 'weekly_summary' && to && summary) {
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:#0a0d15;padding:20px;border-radius:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);text-align:center;line-height:28px;color:#fff;font-weight:900;font-size:12px">W</div><span style="color:#eaf0ff;font-weight:900;font-size:16px">Watchtower</span></div><h2 style="color:#eaf0ff;margin:0 0 12px">Weekly Security Summary</h2><div style="color:#eaf0ff;font-size:14px;line-height:1.8">${summary}</div><div style="color:#8896b8;font-size:12px;margin-top:16px"><a href="https://watchtower.vercel.app/dashboard" style="color:#5b9aff">Open Dashboard →</a></div></div></div>`;
    const result = await sendEmail(to, '📊 Watchtower Weekly Security Summary', html);
    return NextResponse.json(result);
  }

  if (type === 'trial_expiry' && to) {
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:#0a0d15;padding:20px;border-radius:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);text-align:center;line-height:28px;color:#fff;font-weight:900;font-size:12px">W</div><span style="color:#eaf0ff;font-weight:900;font-size:16px">Watchtower</span></div><h2 style="color:#eaf0ff;margin:0 0 12px">Your trial is ending soon</h2><div style="color:#eaf0ff;font-size:14px;line-height:1.8">Your Watchtower Pro trial expires in 3 days. Upgrade now to keep AI triage, threat intel, TV Wall mode, and all Pro features.</div><div style="margin-top:16px"><a href="https://watchtower.vercel.app/signup?plan=pro" style="display:inline-block;padding:10px 20px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Upgrade to Pro →</a></div></div></div>`;
    const result = await sendEmail(to, '⏰ Your Watchtower trial ends in 3 days', html);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
}
