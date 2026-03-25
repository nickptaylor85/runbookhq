import { NextRequest, NextResponse } from 'next/server';
import { generateTotpSecret, totpUri, totpQrDataUri, verifyTotp } from '@/lib/totp';
import { redisGet, redisSet } from '@/lib/redis';
import { encrypt, decrypt } from '@/lib/encrypt';
import { updateUser, getUserByEmail, getUsers } from '@/lib/users';

function requireAuth(req: NextRequest) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

const MFA_KEY = (userId: string) => `wt:user:${userId}:mfa`;

export async function GET(req: NextRequest) {
  const err = requireAuth(req); if (err) return err;
  const userId = req.headers.get('x-user-id')!;
  try {
    const raw = await redisGet(MFA_KEY(userId));
    if (!raw) return NextResponse.json({ ok: true, enabled: false });
    const mfa = JSON.parse(decrypt(raw));
    return NextResponse.json({ ok: true, enabled: mfa.enabled || false });
  } catch { return NextResponse.json({ ok: true, enabled: false }); }
}

export async function POST(req: NextRequest) {
  const err = requireAuth(req); if (err) return err;
  const userId = req.headers.get('x-user-id')!;
  const userEmail = req.headers.get('x-user-email') || userId;

  try {
    const { action, code } = await req.json();

    if (action === 'setup') {
      // Generate new secret and return QR code URI
      const secret = generateTotpSecret();
      const uri = totpUri(secret, userEmail);
      const qrUrl = await totpQrDataUri(uri);
      // Store pending secret (not yet enabled)
      await redisSet(MFA_KEY(userId), encrypt(JSON.stringify({ secret, enabled: false, pending: true })));
      return NextResponse.json({ ok: true, secret, qrUrl, uri });
    }

    if (action === 'verify') {
      // Verify the code and enable TOTP
      const raw = await redisGet(MFA_KEY(userId));
      if (!raw) return NextResponse.json({ error: 'No pending TOTP setup' }, { status: 400 });
      const mfa = JSON.parse(decrypt(raw));
      if (!verifyTotp(mfa.secret, code)) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
      await redisSet(MFA_KEY(userId), encrypt(JSON.stringify({ secret: mfa.secret, enabled: true })));
      return NextResponse.json({ ok: true, message: 'TOTP enabled' });
    }

    if (action === 'disable') {
      // Verify current code before disabling
      const raw = await redisGet(MFA_KEY(userId));
      if (!raw) return NextResponse.json({ ok: true }); // Already disabled
      const mfa = JSON.parse(decrypt(raw));
      if (mfa.enabled && !verifyTotp(mfa.secret, code))
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
      await redisSet(MFA_KEY(userId), encrypt(JSON.stringify({ enabled: false })));
      return NextResponse.json({ ok: true, message: 'TOTP disabled' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
