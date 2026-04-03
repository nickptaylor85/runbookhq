import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, updateUser, saveUsers } from '@/lib/users';
import { sendEmail, inviteEmailHtml } from '@/lib/email';
import { randomBytes } from 'crypto';
import { checkRateLimit } from '@/lib/ratelimit';

function requireAuth(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const isAdmin = req.headers.get('x-is-admin') === 'true';
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  // Provisioned tenant users cannot invite members — only the platform admin can
  if (tenantId !== 'global') {
    return NextResponse.json({ error: 'Member invitations are managed by your platform administrator.' }, { status: 403 });
  }
  // Rate limit: 10 invites per hour per tenant (prevents spam)
  const rl = await checkRateLimit(`invite:${tenantId}`, 10, 3600);
  if (!rl.ok) return NextResponse.json({ error: 'Too many invite attempts. Try again later.' }, { status: 429 });
  const inviterId = req.headers.get('x-user-id') || 'admin';

  try {
    const { name, email, role } = await req.json();
    if (!email || !name || !role) return NextResponse.json({ error: 'name, email and role required' }, { status: 400 });
    if (!['tech_admin','sales','viewer'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    const existing = (await getUsers(tenantId)).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiry = Date.now() + 48 * 3600 * 1000; // 48 hours

    const user = await createUser(tenantId, {
      name, email, role, tenantId, status: 'pending',
      inviteToken, inviteExpiry,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io';
    const inviteUrl = `${baseUrl}/login?invite=${inviteToken}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: `You've been invited to Watchtower`,
      html: inviteEmailHtml({ inviterName: inviterId, role, inviteUrl, orgName: 'Watchtower' }),
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const users = await getUsers(tenantId);
  return NextResponse.json({ ok: true, users: users.map(u => ({ ...u, passwordHash: undefined, inviteToken: undefined })) });
}
