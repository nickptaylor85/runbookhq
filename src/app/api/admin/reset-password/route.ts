import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { sendEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

function requireAdmin(req: NextRequest) {
  return req.headers.get('x-is-admin') === 'true';
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    const body = await req.json() as { email: string };
    if (!body.email) return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });

    const token = randomBytes(32).toString('hex');
    const resetKey = `wt:reset:${token}`;
    await redisSet(resetKey, JSON.stringify({ email: body.email, createdAt: Date.now() }));

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io'}/login?reset=${token}`;
    await sendEmail({
      to: body.email,
      subject: 'Reset your Watchtower password',
      html: `<p>A password reset was requested for ${body.email}.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 24 hours.</p>`,
    });

    return NextResponse.json({ ok: true, email: body.email });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
