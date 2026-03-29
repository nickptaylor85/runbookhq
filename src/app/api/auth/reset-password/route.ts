import { NextRequest, NextResponse } from 'next/server';
import { redisSet, redisGet } from '@/lib/redis';
import { sendEmail, resetEmailHtml } from '@/lib/email';
import { randomBytes } from 'crypto';
import { checkRateLimit } from '@/lib/ratelimit';
import { hashPassword, getUsers, updateUser } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const body = await req.json();
    const { action, email, token, newPassword } = body;
    // Rate limit: 5 reset attempts per hour per IP
    const rl = await checkRateLimit(`reset:${ip}`, 5, 3600);
    if (!rl.ok) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });

    if (action === 'request') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
      // Generate token regardless — don't leak whether email exists
      const resetToken = randomBytes(32).toString('hex');
      await redisSet(`wt:reset:${resetToken}`, email, 3600); // 1 hour TTL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io';
      const resetUrl = `${baseUrl}/login?reset=${resetToken}`;
      await sendEmail({ to: email, subject: 'Reset your Watchtower password', html: resetEmailHtml({ resetUrl }) });
      return NextResponse.json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
    }

    if (action === 'confirm') {
      if (!token || !newPassword || newPassword.length < 8)
        return NextResponse.json({ error: 'Token and password (min 8 chars) required' }, { status: 400 });
      const email = await redisGet(`wt:reset:${token}`);
      if (!email) return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
      // Update password in env for admin, or in Redis for non-admin users
      const adminEmail = process.env.WATCHTOWER_ADMIN_EMAIL;
      if (email === adminEmail) {
        // Can't update env var — instruct user
        return NextResponse.json({ ok: false, message: 'Admin password must be updated via Vercel env vars.' }, { status: 400 });
      }
      // Update user password in Redis
      const users = await getUsers('global');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) await updateUser('global', user.id, { passwordHash: hashPassword(newPassword), status: 'active' });
      await redisSet(`wt:reset:${token}`, '', 1); // Invalidate token
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
