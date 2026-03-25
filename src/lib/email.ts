// Email delivery via Resend (https://resend.com)
// Set RESEND_API_KEY in Vercel env vars to enable real email sending
// Without it, emails are logged to console (dev mode)

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Watchtower <noreply@getwatchtower.io>';

  if (!apiKey) {
    // Dev mode — log to console
    console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL DEV] Body (truncated): ${html.slice(0, 200)}`);
    return { ok: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function inviteEmailHtml(opts: { inviterName: string; role: string; inviteUrl: string; orgName: string }): string {
  const roleLabel = { tech_admin: 'Tech Admin', sales: 'Sales', viewer: 'Viewer' }[opts.role] || opts.role;
  return `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#050508;color:#e8ecf4;margin:0;padding:40px 20px">
<div style="max-width:520px;margin:0 auto">
  <div style="margin-bottom:32px">
    <div style="width:44px;height:44px;background:linear-gradient(135deg,#3b7fff,#7c3aff);border-radius:11px;display:inline-flex;align-items:center;justify-content:center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3L20 7V13C20 17 16.5 20.5 12 22C7.5 20.5 4 17 4 13V7L12 3Z" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="1.5"/><path d="M9 12L11 14L15 10" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
    </div>
  </div>
  <h1 style="font-size:1.5rem;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px">You've been invited to Watchtower</h1>
  <p style="color:#6b7a94;font-size:0.9rem;line-height:1.7;margin:0 0 24px">${opts.inviterName} has invited you to join <strong style="color:#e8ecf4">${opts.orgName}</strong> on Watchtower as a <strong style="color:#4f8fff">${roleLabel}</strong>.</p>
  <a href="${opts.inviteUrl}" style="display:inline-block;padding:12px 28px;background:#4f8fff;color:#fff;text-decoration:none;border-radius:9px;font-weight:700;font-size:0.9rem;letter-spacing:-0.2px">Accept invitation →</a>
  <p style="color:#3a4050;font-size:0.72rem;margin-top:28px">This invite link expires in 48 hours. If you weren't expecting this, you can safely ignore it.</p>
</div></body></html>`;
}

export function resetEmailHtml(opts: { resetUrl: string }): string {
  return `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#050508;color:#e8ecf4;margin:0;padding:40px 20px">
<div style="max-width:520px;margin:0 auto">
  <h1 style="font-size:1.4rem;font-weight:800;margin:0 0 8px">Reset your password</h1>
  <p style="color:#6b7a94;font-size:0.9rem;line-height:1.7;margin:0 0 24px">Click the button below to reset your Watchtower password. This link expires in 1 hour.</p>
  <a href="${opts.resetUrl}" style="display:inline-block;padding:12px 28px;background:#4f8fff;color:#fff;text-decoration:none;border-radius:9px;font-weight:700;font-size:0.9rem">Reset password →</a>
  <p style="color:#3a4050;font-size:0.72rem;margin-top:28px">If you didn't request this, your account is safe — someone may have mistyped their email.</p>
</div></body></html>`;
}
