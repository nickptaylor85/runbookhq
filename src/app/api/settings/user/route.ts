import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet , sanitiseTenantId } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

const SETTINGS_KEY = (tenantId: string) => `wt:${tenantId}:settings:v2`;

// Settings a non-admin user may update for their own tenant
const ALLOWED_SETTINGS = new Set([
  'industry', 'demoMode', 'automation',
  'theme', 'slack_webhook', 'notif_critical', 'notif_incidents',
  'notif_digest', 'notif_sync', 'anthropic_api_key',
]);
// Settings only a platform admin may change (subscription tier, banners)
const ADMIN_ONLY_SETTINGS = new Set(['userTier', 'clientBanner', 'plan']);

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}

async function getSettings(tenantId: string): Promise<Record<string, string>> {
  try {
    const raw = await redisGet(SETTINGS_KEY(tenantId));
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {}
  return {};
}

export async function GET(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  try {
    const tenantId = getTenantId(req);
    const settings = await getSettings(tenantId);
    // Strip server-only fields before sending to client
    const safeSettings = { ...settings };
    delete (safeSettings as any).anthropic_api_key; // never send API keys to client
    return NextResponse.json({ ok: true, settings: safeSettings });
  } catch (e: any) {
    console.error('[settings/user GET]', e.message);
    return NextResponse.json({ ok: false, settings: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const tenantId = getTenantId(req);

    // Only allow whitelisted keys
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_SETTINGS.has(key)) continue;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
      const strVal = String(value).slice(0, 500);
      // Validate Slack webhook URL to prevent SSRF
      if (key === 'slack_webhook' && strVal) {
        if (!strVal.startsWith('https://hooks.slack.com/') && !strVal.startsWith('https://hooks.slack.com/')) {
          return NextResponse.json({ error: 'slack_webhook must be a hooks.slack.com URL' }, { status: 400 });
        }
      }
      updates[key] = strVal;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
    }

    // Reject any attempt to sneak in admin-only keys via the allowed-key check
    for (const key of Object.keys(updates)) {
      if (ADMIN_ONLY_SETTINGS.has(key)) {
        return NextResponse.json({ error: `Setting '${key}' requires admin privileges` }, { status: 403 });
      }
    }

    // Read-merge-write as single JSON blob
    const existing = await getSettings(tenantId);
    const merged = { ...existing, ...updates };
    await redisSet(SETTINGS_KEY(tenantId), JSON.stringify(merged), 86400 * 30); // 30 days TTL
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[settings/user POST]', e.message);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}

// PATCH — change password
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Both passwords required' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    if (newPassword.length > 128) return NextResponse.json({ error: 'Password too long' }, { status: 400 });

    const { getUsers, updateUser, hashPassword, verifyPassword } = await import('@/lib/users');
    const users = await getUsers('global');
    const user = users.find((u: any) => u.id === userId);
    if (!user || !user.passwordHash) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!verifyPassword(currentPassword, user.passwordHash)) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

    await updateUser('global', userId, { passwordHash: hashPassword(newPassword) });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

// DELETE — permanently erase account (GDPR Art.17)
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const tenantId = sanitiseTenantId(req.headers.get('x-tenant-id'));
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { deleteUser } = await import('@/lib/users');
    const { redisDel } = await import('@/lib/redis');

    await deleteUser('global', userId);
    await redisDel(SETTINGS_KEY(tenantId)).catch(() => {});
    await redisDel(`wt:user:${userId}:mfa`).catch(() => {});
    await redisDel(`wt:user:${userId}:mfa_setup_required`).catch(() => {});
    await redisDel(`wt:${tenantId}:alerts`).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
