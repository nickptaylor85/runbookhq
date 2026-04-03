import { NextRequest, NextResponse } from 'next/server';
import { generateTotpSecret, totpUri, totpQrDataUri, verifyTotp } from '@/lib/totp';
import { redisGet, redisSet, redisDel } from '@/lib/redis';
import { encrypt, decrypt } from '@/lib/encrypt';
import { updateUser, getUserByEmail, getUsers } from '@/lib/users';
import { checkRateLimit } from '@/lib/ratelimit';
import { verifySession } from '@/lib/encrypt';

function requireAuth(req: NextRequest) {
  if (!req.headers.get('x-user-id')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

// Resolves userId from middleware header OR cookie session (for public routes like /setup-2fa)
function resolveUserId(req: NextRequest): string | null {
  const fromHeader = req.headers.get('x-user-id');
  if (fromHeader) return fromHeader;
  const token = req.cookies.get('wt_session')?.value;
  if (!token) return null;
  try {
    const payload = verifySession(token) as any;
    return payload?.userId || null;
  } catch { return null; }
}

const MFA_KEY = (userId: string) => `wt:user:${userId}:mfa`;

export async function GET(req: NextRequest) {
  const userId = resolveUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const raw = await redisGet(MFA_KEY(userId));
    if (!raw) return NextResponse.json({ ok: true, enabled: false });
    const mfa = JSON.parse(decrypt(raw));
    return NextResponse.json({ ok: true, enabled: mfa.enabled || false });
  } catch { return NextResponse.json({ ok: true, enabled: false }); }
}

export async function POST(req: NextRequest) {
  const userId = resolveUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Rate limit TOTP attempts: 10 per minute to prevent brute force
  const rl = await checkRateLimit(`totp:${userId}`, 10, 60);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.reset}s.` }, { status: 429 });
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
      // Clear forced-setup flag — user has completed 2FA enrollment
      await redisDel(`wt:user:${userId}:mfa_setup_required`).catch(() => {});
      const res = NextResponse.json({ ok: true, message: 'TOTP enabled', setupComplete: true });
      // Clear the 2FA pending cookie so middleware allows dashboard access
      res.cookies.set('wt_mfa_pending', '', { maxAge: 0, path: '/' });
      return res;
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
  } catch (e: any) { return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 }); }
}
