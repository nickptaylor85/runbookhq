import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/encrypt';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';
import { checkRateLimit } from '@/lib/ratelimit';
import { hashPassword, saveUsers, getUsers } from '@/lib/users';
import { redisGet, redisSet } from '@/lib/redis';
import { randomBytes } from 'crypto';
import { isPasswordBreached } from '@/lib/hibp';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 signups per hour per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(`signup:${ip}`, 3, 3600);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 });
    }

    const body = await req.json() as {
      name?: string; email?: string; password?: string; plan?: string;
    };

    // Validate inputs
    if (!body.email || typeof body.email !== 'string' || !EMAIL_RE.test(body.email) || body.email.length > 254) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!body.password || typeof body.password !== 'string' || body.password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
    }
    if (body.password.length > 128) {
      return NextResponse.json({ error: 'Password too long' }, { status: 400 });
    }
    // ASVS V2.1.7: Check against known breached passwords (HIBP k-anonymity)
    const breached = await isPasswordBreached(body.password);
    if (breached) {
      return NextResponse.json({
        error: 'This password has appeared in a data breach. Choose a different password to protect your account.',
      }, { status: 400 });
    }
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 1) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Block if signups are disabled
    const platformRaw = await redisGet('wt:platform:settings');
    const platform = platformRaw ? JSON.parse(platformRaw) : {};
    if (platform.signup_enabled === false) {
      return NextResponse.json({ error: 'Sign-ups are currently closed. Contact hello@getwatchtower.io.' }, { status: 403 });
    }

    const email = body.email.toLowerCase().trim();
    const plan = (['community', 'team', 'business', 'mssp'] as const).includes(body.plan as any)
      ? body.plan as 'community' | 'team' | 'business' | 'mssp'
      : 'community';

    // Check if email already registered
    const users = await getUsers('global');
    const existing = users.find(u => u.email.toLowerCase() === email);
    if (existing) {
      // Same response to prevent email enumeration
      return NextResponse.json({ ok: true, message: 'Check your email to verify your account.' });
    }

    // Hash password with scrypt
    const passwordHash = hashPassword(body.password);

    // Create tenant ID from email domain + random suffix
    const domain = email.split('@')[1]?.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'user';
    const tenantId = `${domain}-${randomBytes(4).toString('hex')}`;

    // Create user
    const userId = `user_${randomBytes(8).toString('hex')}`;
    const newUser = {
      id: userId,
      name: body.name.trim().slice(0, 100),
      email,
      role: 'owner' as const,
      tenantId,
      status: 'pending_verification' as const,
      passwordHash,
      createdAt: new Date().toISOString(),
      plan,
    };

    const updatedUsers = [...users, newUser];
    await saveUsers('global', updatedUsers);

    // Store tenant settings
    await redisSet(`wt:${tenantId}:settings`, JSON.stringify({
      userTier: plan,
      role: 'owner',
      orgSize: '',
      industry: '',
      notifications: { slack: false, email: false },
    }));

    // Generate email verification token (valid 24h)
    const verifyToken = randomBytes(32).toString('hex');
    await redisSet(`wt:verify:${verifyToken}`, JSON.stringify({
      userId, email, tenantId, plan, createdAt: Date.now(),
    }));

    // TODO: Send verification email via /api/email
    // For now, auto-verify on Community plan to unblock self-service
    if (plan === 'community') {
      // Auto-verify community tier — no email step needed
      const finalUsers = await getUsers('global');
      const userIdx = finalUsers.findIndex(u => u.id === userId);
      if (userIdx >= 0) {
        finalUsers[userIdx].status = 'active';
        await saveUsers('global', finalUsers);
      }

      // Mark 2FA setup as required — enforced by middleware on first dashboard visit
      await redisSet(`wt:user:${userId}:mfa_setup_required`, '1');

      const token = signSession({ userId, tenantId, isAdmin: false, email, role: 'owner', tier: plan });
      // Send welcome email (non-blocking)
      sendEmail({
        to: email,
        subject: 'Welcome to Watchtower — your SOC dashboard is ready',
        html: welcomeEmailHtml({ name: body.name, email }),
      }).catch(() => {}); // non-blocking

      const res = NextResponse.json({ ok: true, role: 'owner', plan, redirect: '/setup-2fa' });
      res.cookies.set('wt_session', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 86400, path: '/',
      });
      res.cookies.set('wt_tier', plan, {
        httpOnly: false, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 86400, path: '/',
      });
      // Signal to middleware that 2FA setup is required before dashboard access
      res.cookies.set('wt_mfa_pending', '1', {
        httpOnly: false, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 3600, path: '/',
      });
      return res;
    }

    // Paid plans: session still created so they can proceed to connect Stripe
    // Mark 2FA setup as required
    await redisSet(`wt:user:${userId}:mfa_setup_required`, '1');

    const token = signSession({ userId, tenantId, isAdmin: false, email, role: 'owner', tier: plan });
    const res = NextResponse.json({ ok: true, role: 'owner', plan, pendingVerification: true, redirect: '/setup-2fa' });
    res.cookies.set('wt_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 86400, path: '/',
    });
    res.cookies.set('wt_tier', plan, {
      httpOnly: false, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 86400, path: '/',
    });
    res.cookies.set('wt_mfa_pending', '1', {
      httpOnly: false, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 3600, path: '/',
    });
    return res;
  } catch (e: any) {
    console.error('Signup error:', e.message);
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
