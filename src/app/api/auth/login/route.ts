import { NextRequest, NextResponse } from 'next/server';
import { signSession, decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';
import { redisGet, redisSet } from '@/lib/redis';
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
      if (!password || password.length < 12)
        return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
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
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 604800, path: '/' });
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
      // ASVS V2.7.1: MFA is MANDATORY for admin accounts
      const mfaRaw = await redisGet(`wt:user:${email}:mfa`).catch(() => null);
      let mfaEnabled = false;
      if (mfaRaw) {
        try {
          const mfa = JSON.parse(decrypt(mfaRaw));
          mfaEnabled = mfa.enabled === true;
          if (mfaEnabled && !mfaCode) {
            // Password correct but MFA needed — return challenge
            return NextResponse.json({ ok: true, mfaRequired: true, userId: email });
          }
          if (mfaEnabled && mfaCode) {
            const { verifyTotp } = await import('@/lib/totp');
            if (!verifyTotp(mfa.secret, mfaCode))
              return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 });
          }
        } catch {}
      }
      const token = signSession({ userId: email, tenantId: 'global', isAdmin: true, email, role: 'owner', tier: 'mssp' });
      const res = NextResponse.json({ ok: true, role: 'owner', mfaSetupRequired: !mfaEnabled });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 86400, path: '/' });
      if (!mfaEnabled) {
        // Admin has no MFA — issue pending cookie and force them to /setup-2fa
        res.cookies.set('wt_mfa_pending', '1', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 3600, path: '/' });
      } else {
        res.cookies.set('wt_mfa_pending', '', { httpOnly: false, maxAge: 0, path: '/' });
      }
      return res;
    }

    // ── Staff user (Redis) — check global tenant first, then provisioned tenants ──
    let user = await getUserByEmail('global', email);
    let userTenantId = 'global';
    if (!user) {
      // Check email->tenantId index for provisioned tenant users
      const mappedTenant = await redisGet('wt:email_tenant:' + email.toLowerCase()).catch(() => null);
      if (mappedTenant) {
        user = await getUserByEmail(mappedTenant, email).catch(() => null) || null;
        if (user) userTenantId = mappedTenant;
      }
    }
    if (user && user.status === 'active' && user.passwordHash && verifyPassword(password, user.passwordHash)) {
      // Read tier from tenant settings (authoritative server-side store)
      const settingsRaw = await redisGet(`wt:${user.tenantId || 'global'}:settings:v2`).catch(() => null);
      const tenantSettings = settingsRaw ? JSON.parse(settingsRaw) : {};
      const userTier = (user as any).plan || tenantSettings.userTier || 'community';

      // If tier not yet persisted in settings (e.g. tenant set via admin panel while 429), save it now
      if (userTier !== 'community' && !tenantSettings.userTier) {
        const settingsKeyV2 = 'wt:' + userTenantId + ':settings:v2';
        const merged = { ...tenantSettings, userTier };
        await redisSet(settingsKeyV2, JSON.stringify(merged)).catch(() => {});
      }
      const token = signSession({ userId: user.id, tenantId: user.tenantId || 'global', isAdmin: false, email: user.email, role: user.role, tier: userTier });
      // V2.3.1: Force password change if admin set a temporary password
      if ((user as any).mustChangePassword) {
        const res = NextResponse.json({ ok: true, mustChangePassword: true });
        res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 1800, path: '/' });
        return res;
      }
      await updateUser(userTenantId, user.id, { lastSeen: new Date().toISOString() });

      // Force MFA setup for provisioned tenant users who have not yet enrolled
      const mfaRaw2 = await redisGet('wt:user:' + user.id + ':mfa').catch(() => null);
      let mfaAlreadyEnabled = false;
      if (mfaRaw2) {
        try { mfaAlreadyEnabled = JSON.parse(decrypt(mfaRaw2)).enabled === true; } catch {}
      }
      // Mark as requiring setup — middleware will redirect to /setup-2fa
      if (!mfaAlreadyEnabled) {
        await redisSet('wt:user:' + user.id + ':mfa_setup_required', '1').catch(() => {});
      }

      const res = NextResponse.json({ ok: true, role: user.role, mfaSetupRequired: !mfaAlreadyEnabled });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 86400, path: '/' });
      res.cookies.set('wt_tier', userTier, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
      if (!mfaAlreadyEnabled) {
        res.cookies.set('wt_mfa_pending', '1', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 3600, path: '/' });
      } else {
        res.cookies.set('wt_mfa_pending', '', { httpOnly: false, maxAge: 0, path: '/' });
      }
      return res;
    }

    // Track failed attempts for lockout (max 10 in 15 min)
    const failKey = `login_fails:${email.toLowerCase().slice(0,100)}`;
    const fails = await import('@/lib/ratelimit').then(m => m.checkRateLimit(failKey, 10, 900));
    // After 10 fails, rate limiter will start returning ok:false, blocking further attempts
    console.warn(`[auth] Failed login attempt for email=${email.toLowerCase().slice(0,50)} ip=${req.headers.get('x-forwarded-for') || 'unknown'}`);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
