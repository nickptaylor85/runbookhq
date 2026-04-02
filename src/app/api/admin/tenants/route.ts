import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { verifySession } from '@/lib/encrypt';
import { createUser, hashPassword } from '@/lib/users';
import { checkRateLimit } from '@/lib/ratelimit';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

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
        passwordHash: hashPassword(u.password),
        mustChangePassword: false,
      });
      createdUsers.push({ id: user.id, name: user.name, email: user.email, role: 'viewer' });
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
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
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
    await redisSet(`wt:tenant:${tenantId}:users`, JSON.stringify([]));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
