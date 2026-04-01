import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers, hashPassword } from '@/lib/users';
import { verifySession } from '@/lib/encrypt';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/ratelimit';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-is-admin') === 'true') return true;
  const cookieStore = await cookies();
  const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
  if (token) {
    const payload = verifySession(token) as any;
    if (payload?.isAdmin === true || payload?.tier === 'mssp') return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { userId, email, password } = await req.json() as { userId?: string; email?: string; password: string };
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const users = await getUsers(tenantId);
    const idx = users.findIndex(u => (userId && u.id === userId) || (email && u.email.toLowerCase() === email.toLowerCase()));
    if (idx < 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    users[idx] = {
      ...users[idx],
      passwordHash: hashPassword(password),
      status: 'active',
      inviteToken: undefined,
      inviteExpiry: undefined,
    };
    await saveUsers(tenantId, users);
    return NextResponse.json({ ok: true, userId: users[idx].id, email: users[idx].email });
  } catch(e: any) {
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
