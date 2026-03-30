import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/users';
import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  if (req.headers.get('x-user-tier') === 'mssp') return true;
  // Cookie fallback — handles cases where middleware headers are missing
  const cookieStore = await cookies();
  const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
  if (token) {
    const payload = verifySession(token) as any;
    if (payload?.isAdmin === true || payload?.tier === 'mssp') return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const users = await getUsers(tenantId);
  return NextResponse.json({ ok: true, users: users.map(u => ({ ...u, passwordHash: undefined, inviteToken: undefined })) });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    console.error('[admin/users] 403 — x-is-admin:', req.headers.get('x-is-admin'), 'tier:', req.headers.get('x-user-tier'));
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  try {
    const { action, userId, name, email, role, status } = await req.json();
    if (action === 'update' && userId) {
      await updateUser(tenantId, userId, { ...(role && { role }), ...(status && { status }) });
      return NextResponse.json({ ok: true });
    }
    if (action === 'delete' && userId) {
      await deleteUser(tenantId, userId);
      return NextResponse.json({ ok: true });
    }
    if (action === 'create' && name && email && role) {
      const user = await createUser(tenantId, { name, email, role, tenantId, status: 'active', mustChangePassword: !!body.tempPassword });
      return NextResponse.json({ ok: true, user });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
