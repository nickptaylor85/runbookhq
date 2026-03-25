import { NextRequest, NextResponse } from 'next/server';
import { signSession, decrypt } from '@/lib/encrypt';
import { redisGet } from '@/lib/redis';
import { getUserByEmail, hashPassword, updateUser, getUsers, saveUsers } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const { email, password, inviteToken, mfaCode } = await req.json();
    if (!email || typeof email !== 'string')
      return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const adminEmail = process.env.WATCHTOWER_ADMIN_EMAIL || 'admin@getwatchtower.io';
    const adminPass = process.env.WATCHTOWER_ADMIN_PASS || 'changeme';

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
      const token = signSession({ userId: user.id, tenantId: 'global', isAdmin: false, email: user.email, role: user.role });
      const res = NextResponse.json({ ok: true, role: user.role });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
      return res;
    }

    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });
    await new Promise(r => setTimeout(r, 300)); // brute-force delay

    // ── Platform owner (env var credentials) ─────────────────────────────
    if (email === adminEmail && password === adminPass) {
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
      const token = signSession({ userId: email, tenantId: 'global', isAdmin: true, email, role: 'owner' });
      const res = NextResponse.json({ ok: true, role: 'owner' });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
      return res;
    }

    // ── Staff user (Redis) ────────────────────────────────────────────────
    const user = await getUserByEmail('global', email);
    if (user && user.status === 'active' && user.passwordHash && user.passwordHash === hashPassword(password)) {
      const token = signSession({ userId: user.id, tenantId: 'global', isAdmin: false, email: user.email, role: user.role });
      await updateUser('global', user.id, { lastSeen: new Date().toISOString() });
      const res = NextResponse.json({ ok: true, role: user.role });
      res.cookies.set('wt_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' });
      return res;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
