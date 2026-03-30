import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getAnthropicKey } from '@/lib/redis';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type: string; to?: string; subject?: string;
      alert?: Record<string, unknown>; incident?: Record<string, unknown>;
      digest?: Record<string, unknown>; customHtml?: string;
    };
    const { type, to, alert, incident, digest, customHtml } = body;

    if (!to) return NextResponse.json({ ok: false, error: 'to required' }, { status: 400 });
    // Validate email format to prevent header injection
    if (typeof to !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to) || to.length > 254) {
      return NextResponse.json({ ok: false, error: 'Invalid recipient email' }, { status: 400 });
    }

    let subject = body.subject || 'Watchtower Security Notification';
    let html = '';

    if (type === 'critical_alert' && alert) {
      subject = `🔴 Critical Alert: ${alert.title}`;
      html = `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#050508;color:#e8ecf4;padding:32px 20px;margin:0">
<div style="max-width:520px;margin:0 auto">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
    <div style="width:36px;height:36px;background:linear-gradient(135deg,#3b7fff,#7c3aff);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:1rem">W</div>
    <span style="font-weight:800;font-size:1rem">Watchtower</span>
  </div>
  <div style="background:#1a0510;border:1px solid #f0405e40;border-radius:10px;padding:20px;margin-bottom:16px">
    <div style="font-size:0.72rem;font-weight:700;color:#f0405e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🔴 Critical Alert</div>
    <div style="font-size:1.05rem;font-weight:700;margin-bottom:8px">${alert.title}</div>
    <div style="font-size:0.84rem;color:#8a9ab0;margin-bottom:12px">Source: ${alert.source} · Device: ${alert.device || 'Unknown'}</div>
    <a href="https://getwatchtower.io/dashboard" style="display:inline-block;padding:10px 22px;background:#f0405e;color:#fff;text-decoration:none;border-radius:7px;font-weight:700;font-size:0.84rem">View Alert →</a>
  </div>
  <p style="color:#3a4050;font-size:0.72rem">You're receiving this because critical alert notifications are enabled in your Watchtower settings.</p>
</div></body></html>`;
    } else if (type === 'incident_created' && incident) {
      subject = `📋 New Incident: ${incident.title}`;
      html = `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#050508;color:#e8ecf4;padding:32px 20px;margin:0">
<div style="max-width:520px;margin:0 auto">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
    <div style="width:36px;height:36px;background:linear-gradient(135deg,#3b7fff,#7c3aff);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff">W</div>
    <span style="font-weight:800;font-size:1rem">Watchtower</span>
  </div>
  <div style="background:#0a0d1a;border:1px solid #4f8fff40;border-radius:10px;padding:20px;margin-bottom:16px">
    <div style="font-size:0.72rem;font-weight:700;color:#4f8fff;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">📋 Incident Created</div>
    <div style="font-weight:700;font-size:0.72rem;color:#4f8fff;margin-bottom:4px">${incident.id}</div>
    <div style="font-size:1.05rem;font-weight:700;margin-bottom:8px">${incident.title}</div>
    <div style="font-size:0.84rem;color:#8a9ab0;margin-bottom:12px">Severity: ${incident.severity} · Status: ${incident.status}</div>
    <a href="https://getwatchtower.io/dashboard" style="display:inline-block;padding:10px 22px;background:#4f8fff;color:#fff;text-decoration:none;border-radius:7px;font-weight:700;font-size:0.84rem">View Incident →</a>
  </div>
</div></body></html>`;
    } else if (type === 'weekly_digest' && digest) {
      subject = `📊 Watchtower Weekly Digest — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
      html = `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#050508;color:#e8ecf4;padding:32px 20px;margin:0">
<div style="max-width:520px;margin:0 auto">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
    <div style="width:36px;height:36px;background:linear-gradient(135deg,#3b7fff,#7c3aff);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff">W</div>
    <div><div style="font-weight:800;font-size:1rem">Watchtower</div><div style="font-size:0.7rem;color:#6b7a94">Weekly Security Digest</div></div>
  </div>
  <h1 style="font-size:1.2rem;font-weight:800;margin-bottom:20px;letter-spacing:-0.3px">Your week in security</h1>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
    ${[['Total Alerts', digest.totalAlerts, '#f97316'],['Critical',''+digest.critAlerts,'#f0405e'],['Cases Closed',''+digest.closedCases,'#22d49a'],['Posture',''+digest.posture+'/100','#4f8fff']].map(([l,v,c])=>`<div style="background:#0a0f1a;border:1px solid #1d2535;border-radius:8px;padding:14px;text-align:center"><div style="font-size:1.6rem;font-weight:900;font-family:monospace;color:${c}">${v}</div><div style="font-size:0.64rem;color:#6b7a94;margin-top:3px">${l}</div></div>`).join('')}
  </div>
  <a href="https://getwatchtower.io/dashboard" style="display:inline-block;padding:10px 22px;background:#4f8fff;color:#fff;text-decoration:none;border-radius:7px;font-weight:700;font-size:0.84rem;margin-bottom:16px">Open Dashboard →</a>
  <p style="color:#3a4050;font-size:0.72rem">Weekly digest from Watchtower. Manage notifications in Settings.</p>
</div></body></html>`;
    } else if (customHtml) {
      html = customHtml;
    } else {
      return NextResponse.json({ ok: false, error: 'Unknown email type' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html });
    return NextResponse.json(result);
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
