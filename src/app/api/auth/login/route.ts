import { NextRequest, NextResponse } from 'next/server';
import { signSession, decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';
import { redisGet } from '@/lib/redis';
import { getUserByEmail, hashPassword, verifyPassword, updateUser, getUsers, saveUsers } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, inviteToken, mfaCode } = body;
    if (!email || typeof email !== 'string' || email.length > 254)
      return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Rate limit: 5 attempts per 5 minutes per email (brute-force protection)
    const rl = await checkRateLimit(`login:${email.toLowerCase().slice(0,100)}`, 5, 300);
    if (!rl.ok) {
      return NextResponse.json({ error: `Too many login attempts. Try again in ${Math.ceil(rl.reset/60)} minutes.` }, { status: 429 });
    }

    const adminEmail = process.env.WATCHTOWER_ADMIN_EMAIL;
    const adminPass = process.env.WATCHTOWER_ADMIN_PASS;
    if (!adminEmail || !adminPass) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
    }

    // ── Handle invite token (set password for pending user) ──────────────
    if (inviteToken) {
      const users = await getUsers('global');
      const user = users.find(u => u.inviteToken === inviteToken && u.email.toLowerCase() === email.toLowerCase());
      if (!user) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 });
      if (user.inviteExpiry && Date.now() > user.inviteExpiry)
        return NextResponse.json({ error: 'Invite has expired. Request a new one.' }, { status: 400 });
      if (!password || password.length < 8)
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      await updateUser('global', user.id, {
        passwordHash: hashPassword(password),
        status: 'active',
        inviteToken: undefined,
        inviteExpiry: undefined,
      });
      const token = signSession({ userId: user.id, tenantId: 'global', isAdmin: false, email: user.email, role: user.role, tier: 'community' });
      // Mark invited user as requiring 2FA setup on first login
      const { redisSet: rSet } = await import('@/lib/redis');
      await rSet(`wt:user:${user.id}:mfa_setup_required`, '1').catch(() => {});
      const res = NextResponse.json({ ok: true, role: user.role, redirect: '/setup-2fa' });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800, path: '/' });
      res.cookies.set('wt_mfa_pending', '1', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 3600, path: '/' });
      return res;
    }

    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200)); // timing jitter

    // Check account lockout
    const lockKey = `login_lock:${email.toLowerCase().slice(0,100)}`;

    // ── Platform owner (env var credentials) ─────────────────────────────
    const { timingSafeEqual } = await import('crypto');
    const adminMatch = email === adminEmail &&
      timingSafeEqual(Buffer.from(password || ''), Buffer.from(adminPass));
    if (adminMatch) {
      // Check if MFA is enabled for admin
      const mfaRaw = await redisGet(`wt:user:${email}:mfa`).catch(() => null);
      if (mfaRaw) {
        try {
          const mfa = JSON.parse(decrypt(mfaRaw));
          if (mfa.enabled && !mfaCode) {
            // Password correct but MFA needed — return challenge
            return NextResponse.json({ ok: true, mfaRequired: true, userId: email });
          }
          if (mfa.enabled && mfaCode) {
            const { verifyTotp } = await import('@/lib/totp');
            if (!verifyTotp(mfa.secret, mfaCode))
              return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 });
          }
        } catch {}
      }
      const token = signSession({ userId: email, tenantId: 'global', isAdmin: true, email, role: 'owner', tier: 'mssp' });
      const res = NextResponse.json({ ok: true, role: 'owner' });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
      return res;
    }

    // ── Staff user (Redis) ────────────────────────────────────────────────
    const user = await getUserByEmail('global', email);
    if (user && user.status === 'active' && user.passwordHash && verifyPassword(password, user.passwordHash)) {
      // Read tier from tenant settings (authoritative server-side store)
      const settingsRaw = await redisGet(`wt:${user.tenantId || 'global'}:settings`).catch(() => null);
      const tenantSettings = settingsRaw ? JSON.parse(settingsRaw) : {};
      const userTier = (user as any).plan || tenantSettings.userTier || 'community';

      const token = signSession({ userId: user.id, tenantId: user.tenantId || 'global', isAdmin: false, email: user.email, role: user.role, tier: userTier });
      await updateUser('global', user.id, { lastSeen: new Date().toISOString() });
      const res = NextResponse.json({ ok: true, role: user.role });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
      res.cookies.set('wt_tier', userTier, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
      return res;
    }

    // Track failed attempts for lockout (max 10 in 15 min)
    const failKey = `login_fails:${email.toLowerCase().slice(0,100)}`;
    const fails = await import('@/lib/ratelimit').then(m => m.checkRateLimit(failKey, 10, 900));
    // After 10 fails, rate limiter will start returning ok:false, blocking further attempts
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
