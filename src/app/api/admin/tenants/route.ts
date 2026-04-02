import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { verifySession } from '@/lib/encrypt';
import { createUser } from '@/lib/users';
import { scryptSync, randomBytes } from 'crypto';
import { checkRateLimit } from '@/lib/ratelimit';
import { cookies } from 'next/headers';

// Lower-memory scrypt for serverless — N=16384 uses 16MB vs 32MB for N=32768.
// Meets OWASP minimum. Used only for provisioned tenant passwords.
function hashPasswordServerless(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return 'scrypt:' + salt + ':' + hash;
}

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  const cookieStore = await cookies();
  const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
  if (token) {
    const p = verifySession(token) as any;
    if (p?.isAdmin || p?.tier === 'mssp') return true;
  }
  return false;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

const REGISTRY_KEY = 'wt:admin:tenant_registry';

interface TenantRecord {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  purpose: string;
  userCount: number;
  active: boolean;
}

async function getRegistry(): Promise<TenantRecord[]> {
  const raw = await redisGet(REGISTRY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const rl = await checkRateLimit(`admin-tenants-get:${req.headers.get('x-user-id') || 'anon'}`, 60, 60);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  try {
    return NextResponse.json({ ok: true, tenants: await getRegistry() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const rl = await checkRateLimit(`admin-tenants-post:${req.headers.get('x-user-id') || 'anon'}`, 10, 3600);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const body = await req.json() as {
      name: string;
      purpose?: string;
      users: Array<{ name: string; email: string; password: string }>;
    };
    const { name, purpose, users } = body;

    if (!name || name.trim().length < 2) return NextResponse.json({ error: 'name required' }, { status: 400 });
    if (!Array.isArray(users) || users.length === 0) return NextResponse.json({ error: 'At least one user required' }, { status: 400 });

    for (const u of users) {
      if (!u.name || !u.email || !u.password) return NextResponse.json({ error: `User ${u.email || '?'} needs name, email, password` }, { status: 400 });
      if (u.password.length < 12) return NextResponse.json({ error: `Password for ${u.email} must be at least 12 characters` }, { status: 400 });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u.email)) return NextResponse.json({ error: `Invalid email: ${u.email}` }, { status: 400 });
    }

    const suffix = randomBytes(3).toString('hex');
    const tenantId = `${slugify(name.trim())}-${suffix}`;

    const registry = await getRegistry();
    if (registry.some(t => t.id === tenantId)) return NextResponse.json({ error: 'ID collision, retry' }, { status: 409 });

    const createdUsers = [];
    for (const u of users) {
      const user = await createUser(tenantId, {
        name: u.name.slice(0, 100),
        email: u.email.toLowerCase().trim(),
        role: 'viewer',
        tenantId,
        status: 'active',
        passwordHash: hashPasswordServerless(u.password),
        mustChangePassword: false,
      });
      createdUsers.push({ id: user.id, name: user.name, email: user.email, role: 'viewer' });
      // Write email -> tenantId index so login route can find this user
      await redisSet('wt:email_tenant:' + u.email.toLowerCase().trim(), tenantId);
    }

    // Disable demo mode for this tenant so users land on a real empty dashboard
    const SETTINGS_KEY = `wt:${tenantId}:settings:v2`;
    await redisSet(SETTINGS_KEY, JSON.stringify({ demoMode: 'false' }));

    const record: TenantRecord = {
      id: tenantId,
      name: name.trim().slice(0, 100),
      createdAt: new Date().toISOString(),
      createdBy: req.headers.get('x-user-id') || 'admin',
      purpose: (purpose || '').slice(0, 200),
      userCount: createdUsers.length,
      active: true,
    };
    registry.push(record);
    await redisSet(REGISTRY_KEY, JSON.stringify(registry));

    return NextResponse.json({ ok: true, tenant: record, users: createdUsers });
  } catch (e: any) {
    console.error('[admin/tenants POST]', e?.message, e?.stack?.slice(0, 300));
    return NextResponse.json({ ok: false, error: e?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const tenantId = req.nextUrl.searchParams.get('id');
  if (!tenantId) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (tenantId === 'global' || !tenantId.includes('-')) return NextResponse.json({ error: 'Cannot delete system tenants' }, { status: 403 });

  try {
    const registry = await getRegistry();
    const idx = registry.findIndex(t => t.id === tenantId);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    registry[idx].active = false;
    await redisSet(REGISTRY_KEY, JSON.stringify(registry));
    // Wipe user list so existing sessions are dead
    await redisSet('wt:tenant:' + tenantId + ':users', JSON.stringify([]));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — list users, reset password, or change role for a provisioned tenant
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const rl = await checkRateLimit('admin-tenants-patch:' + (req.headers.get('x-user-id') || 'anon'), 60, 3600);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const body = await req.json() as { tenantId: string; action: string; email?: string; password?: string; role?: string };
    const { tenantId, action, email, password, role } = body;

    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    if (tenantId === 'global') return NextResponse.json({ error: 'Use /api/admin/users for global tenant' }, { status: 400 });

    const { getUsers, saveUsers } = await import('@/lib/users');
    const users = await getUsers(tenantId);

    // List all users in tenant
    if (action === 'list') {
      return NextResponse.json({ ok: true, users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status })) });
    }

    // Find specific user for password/role actions
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return NextResponse.json({ error: 'User not found in this tenant' }, { status: 404 });

    if (action === 'set_password') {
      if (!password || password.length < 12) return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
      users[idx].passwordHash = hashPasswordServerless(password);
      users[idx].status = 'active';
      await saveUsers(tenantId, users);
      return NextResponse.json({ ok: true, message: 'Password updated for ' + email });
    }

    if (action === 'set_role') {
      const allowed = ['viewer', 'tech_admin', 'sales'];
      if (!role || !allowed.includes(role)) return NextResponse.json({ error: 'role must be viewer, tech_admin, or sales' }, { status: 400 });
      // Provisioned tenants can never have owner or isAdmin — enforce here
      users[idx].role = role as 'viewer' | 'tech_admin' | 'sales';
      await saveUsers(tenantId, users);
      return NextResponse.json({ ok: true, message: 'Role updated for ' + email });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('[admin/tenants PATCH]', e?.message);
    return NextResponse.json({ ok: false, error: e?.message || 'Internal server error' }, { status: 500 });
  }
}
