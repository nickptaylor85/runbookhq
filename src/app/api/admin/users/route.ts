import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/users';

function requireAdmin(req: NextRequest) {
  if ((req.headers.get('x-is-admin') !== 'true' && req.headers.get('x-user-tier') !== 'mssp')) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const users = await getUsers(tenantId);
  return NextResponse.json({ ok: true, users: users.map(u => ({ ...u, passwordHash: undefined, inviteToken: undefined })) });
}

export async function POST(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;
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
      const user = await createUser(tenantId, { name, email, role, tenantId, status: 'active' });
      return NextResponse.json({ ok: true, user });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
