import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/encrypt';
import { sendEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/ratelimit';
import { hashPassword, saveUsers, getUsers } from '@/lib/users';
import { redisGet, redisSet } from '@/lib/redis';
import { randomBytes } from 'crypto';

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
    if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (body.password.length > 128) {
      return NextResponse.json({ error: 'Password too long' }, { status: 400 });
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

      const token = signSession({ userId, tenantId, isAdmin: false, email, role: 'owner' });
      // Send welcome email (non-blocking)
      sendEmail({
        to: email,
        subject: 'Welcome to Watchtower — your SOC dashboard is ready',
        html: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#050508;color:#e8ecf4">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
            <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#4f8fff,#8b6fff);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;color:#fff">W</div>
            <span style="font-weight:800;font-size:1.1rem">Watchtower</span>
          </div>
          <h1 style="font-size:1.5rem;font-weight:900;margin-bottom:12px;letter-spacing:-0.5px">Your SOC dashboard is live</h1>
          <p style="font-size:0.9rem;color:#8a9ab0;line-height:1.7;margin-bottom:20px">Hi ${body.name || email} — welcome to Watchtower. Connect your first security tool and let AI triage your alerts from day one.</p>
          <a href="https://getwatchtower.io/dashboard" style="display:inline-block;padding:12px 28px;background:#4f8fff;color:#fff;border-radius:9px;font-weight:700;text-decoration:none;font-size:0.9rem;margin-bottom:28px">Open Dashboard →</a>
          <div style="border-top:1px solid #1d2535;padding-top:20px;margin-top:8px">
            <p style="font-size:0.78rem;color:#4a5568;line-height:1.7">First steps: Connect a tool in the Tools tab → add your Anthropic key for AI triage → your first alert will be triaged in seconds.</p>
            <p style="font-size:0.74rem;color:#3a4050;margin-top:12px">Questions? Reply to this email or reach us at <a href="mailto:hello@getwatchtower.io" style="color:#4f8fff">hello@getwatchtower.io</a></p>
          </div>
        </div>`,
      }).catch(() => {}); // non-blocking

      const res = NextResponse.json({ ok: true, role: 'owner', plan, redirect: '/dashboard' });
      res.cookies.set('wt_session', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 86400, path: '/',
      });
      res.cookies.set('wt_tier', plan, {
        httpOnly: false, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 86400, path: '/',
      });
      return res;
    }

    // Paid plans: session still created so they can proceed to connect Stripe
    const token = signSession({ userId, tenantId, isAdmin: false, email, role: 'owner' });
    const res = NextResponse.json({ ok: true, role: 'owner', plan, pendingVerification: true, redirect: '/dashboard' });
    res.cookies.set('wt_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 86400, path: '/',
    });
    res.cookies.set('wt_tier', plan, {
      httpOnly: false, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 86400, path: '/',
    });
    return res;
  } catch (e: any) {
    console.error('Signup error:', e.message);
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
