import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, getTenantFromRequest } from '@/lib/config-store';
import { generateTotpSecret, getTotpUri, verifyTotp } from '@/lib/crypto';

// GET: Get TOTP setup info (generate new secret + QR URI)
export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const platform = await loadPlatformData();
  const user = platform.users?.[email];
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (user.totpEnabled) {
    return NextResponse.json({ enabled: true, message: '2FA is already enabled' });
  }

  // Generate a new secret (not saved yet — user must verify first)
  const secret = generateTotpSecret();
  const uri = getTotpUri(secret, email);

  // Store pending secret temporarily
  user._pendingTotpSecret = secret;
  await savePlatformData(platform);

  return NextResponse.json({ enabled: false, secret, uri, message: 'Scan the QR code with your authenticator app, then verify with a code' });
}

// POST: Verify and enable TOTP
export async function POST(req: Request) {
  const { email } = getTenantFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { code, action } = await req.json();
  const platform = await loadPlatformData();
  const user = platform.users?.[email];
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Disable 2FA
  if (action === 'disable') {
    if (!code) return NextResponse.json({ error: 'Enter your current authenticator code to disable 2FA' }, { status: 400 });
    if (!user.totpSecret || !verifyTotp(user.totpSecret, code)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }
    user.totpEnabled = false;
    user.totpSecret = null;
    user._pendingTotpSecret = null;
    platform.auditLog?.push({ action: '2fa_disabled', email, time: new Date().toISOString() });
    await savePlatformData(platform);
    return NextResponse.json({ ok: true, message: '2FA has been disabled' });
  }

  // Enable 2FA — verify the pending secret
  if (!code) return NextResponse.json({ error: 'Enter the 6-digit code from your authenticator app' }, { status: 400 });
  const secret = user._pendingTotpSecret;
  if (!secret) return NextResponse.json({ error: 'No pending 2FA setup. Start again from settings.' }, { status: 400 });

  if (!verifyTotp(secret, code)) {
    return NextResponse.json({ error: 'Invalid code. Make sure your authenticator app is synced.' }, { status: 401 });
  }

  user.totpSecret = secret;
  user.totpEnabled = true;
  user._pendingTotpSecret = null;
  platform.auditLog?.push({ action: '2fa_enabled', email, time: new Date().toISOString() });
  await savePlatformData(platform);

  return NextResponse.json({ ok: true, message: '2FA is now enabled. You will need your authenticator code to sign in.' });
}
