import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { sendEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import { checkRateLimit } from '@/lib/ratelimit';

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

export async function POST(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
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
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
