import { NextResponse } from 'next/server';
import { loadPlatformData, getTenantFromRequest } from '@/lib/config-store';
import { getTotpCode, verifyTotp, getTotpUri, generateTotpSecret } from '@/lib/crypto';

export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const platform = await loadPlatformData();
  const user = platform.users?.[email];
  if (!user) return NextResponse.json({ error: 'User not found' });

  const secret = user._pendingTotpSecret || user.totpSecret;
  if (!secret) return NextResponse.json({ error: 'No TOTP secret set up' });

  const serverCode = getTotpCode(secret);
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / 30);
  const secondsRemaining = 30 - (now % 30);

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    unixTime: now,
    counter,
    secondsRemaining,
    serverCode,
    secretLength: secret.length,
    secretPrefix: secret.substring(0, 6) + '...',
    uri: getTotpUri(secret, email),
    totpEnabled: !!user.totpEnabled,
    hasPending: !!user._pendingTotpSecret,
  });
}
