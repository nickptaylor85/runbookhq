import { NextRequest, NextResponse } from 'next/server';
import { redisHSet, redisHGetAll, KEYS } from '@/lib/redis';

const ALLOWED_SETTINGS = new Set([
  'industry', 'demoMode', 'automation', 'userTier', 'clientBanner', 'theme', 'slack_webhook', 'notif_critical', 'notif_incidents', 'notif_digest', 'notif_sync'
]);

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const settings = await redisHGetAll(KEYS.TENANT_SETTINGS(tenantId));
    return NextResponse.json({ ok: true, settings });
  } catch (e: any) {
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
    
    // Only allow whitelisted settings keys, sanitize values
    const allowed: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_SETTINGS.has(key)) continue;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
      const strVal = String(value).slice(0, 500); // max 500 chars
      allowed[key] = strVal;
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
    }

    // Batch all fields into a single HSET call to avoid parallel write issues
    const settingsKey = KEYS.TENANT_SETTINGS(tenantId);
    for (const [key, value] of Object.entries(allowed)) {
      await redisHSet(settingsKey, key, value);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[settings/user POST]', e.message, e.stack?.split('\n')[1]);
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

    const { getUserByEmail, getUsers, updateUser, hashPassword, verifyPassword } = await import('@/lib/users');
    // Find user by ID
    const users = await getUsers('global');
    const user = users.find(u => u.id === userId);
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

    // Delete user record
    await deleteUser('global', userId);
    // Delete tenant settings and data
    await redisDel(`wt:${tenantId}:settings`).catch(() => {});
    await redisDel(`wt:user:${userId}:mfa`).catch(() => {});
    await redisDel(`wt:user:${userId}:mfa_setup_required`).catch(() => {});
    await redisDel(`wt:${tenantId}:alerts`).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
