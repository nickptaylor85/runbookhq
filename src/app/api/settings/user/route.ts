import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';

const SETTINGS_KEY = (tenantId: string) => `wt:${tenantId}:settings:v2`;

const ALLOWED_SETTINGS = new Set([
  'industry', 'demoMode', 'automation', 'userTier', 'clientBanner',
  'theme', 'slack_webhook', 'notif_critical', 'notif_incidents',
  'notif_digest', 'notif_sync', 'anthropic_api_key',
]);

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

async function getSettings(tenantId: string): Promise<Record<string, string>> {
  try {
    const raw = await redisGet(SETTINGS_KEY(tenantId));
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {}
  return {};
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const settings = await getSettings(tenantId);
    return NextResponse.json({ ok: true, settings });
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — permanently erase account (GDPR Art.17)
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const tenantId = req.headers.get('x-tenant-id') || 'global';
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
