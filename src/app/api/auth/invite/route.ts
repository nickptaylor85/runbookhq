import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, getTenantFromRequest } from '@/lib/config-store';
import { hashPassword } from '@/lib/crypto';

// GET: List team members for current tenant
export async function GET(req: Request) {
  const { email, tenantId } = getTenantFromRequest(req);
  if (!email || !tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const platform = await loadPlatformData();
  const user = platform.users?.[email];
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Admin access required to manage team' }, { status: 403 });
  }

  const tenant = platform.tenants?.[tenantId];
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const members = (tenant.members || []).map((memberEmail: string) => {
    const m = platform.users?.[memberEmail];
    return m ? { email: m.email, role: m.role, createdAt: m.createdAt, lastLoginAt: m.lastLoginAt, totpEnabled: !!m.totpEnabled } : { email: memberEmail, role: 'unknown', pending: true };
  });

  const pendingInvites = (tenant.pendingInvites || []).map((inv: any) => ({
    email: inv.email, role: inv.role, invitedBy: inv.invitedBy, invitedAt: inv.invitedAt,
  }));

  return NextResponse.json({ members, pendingInvites, tenantName: tenant.name });
}

// POST: Invite a team member
export async function POST(req: Request) {
  const { email: adminEmail, tenantId } = getTenantFromRequest(req);
  if (!adminEmail || !tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { email, role } = await req.json();
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 });

  const platform = await loadPlatformData();
  const admin = platform.users?.[adminEmail];
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const tenant = platform.tenants?.[tenantId];
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const validRoles = ['admin', 'analyst', 'viewer'];
  const assignRole = validRoles.includes(role) ? role : 'analyst';

  // Check if already a member
  if (tenant.members?.includes(email)) return NextResponse.json({ error: 'Already a team member' }, { status: 409 });

  // Check if user exists (registered)
  if (platform.users?.[email]) {
    // User exists — add to tenant directly
    platform.users[email].tenantId = tenantId;
    platform.users[email].role = assignRole;
    platform.users[email].org = tenant.name;
    if (!tenant.members) tenant.members = [];
    tenant.members.push(email);
    platform.auditLog?.push({ action: 'member_added', email, tenantId, role: assignRole, by: adminEmail, time: new Date().toISOString() });
    await savePlatformData(platform);
    return NextResponse.json({ ok: true, message: `${email} added as ${assignRole}`, status: 'added' });
  }

  // User doesn't exist — create a pending invite
  if (!tenant.pendingInvites) tenant.pendingInvites = [];
  const existingInvite = tenant.pendingInvites.find((i: any) => i.email === email);
  if (existingInvite) return NextResponse.json({ error: 'Invite already pending for this email' }, { status: 409 });

  // Create a pre-registered account with a temp password
  const tempPassword = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
  if (!platform.users) platform.users = {};
  platform.users[email] = {
    email, password: hashPassword(tempPassword), org: tenant.name,
    plan: tenant.plan || 'starter', role: assignRole, tenantId,
    createdAt: new Date().toISOString(), trialEndsAt: null,
    totpEnabled: false, totpSecret: null, mustChangePassword: true,
    invitedBy: adminEmail,
  };
  if (!tenant.members) tenant.members = [];
  tenant.members.push(email);

  tenant.pendingInvites.push({ email, role: assignRole, invitedBy: adminEmail, invitedAt: new Date().toISOString(), tempPassword });

  platform.auditLog?.push({ action: 'member_invited', email, tenantId, role: assignRole, by: adminEmail, time: new Date().toISOString() });
  await savePlatformData(platform);

  return NextResponse.json({ ok: true, message: `Invite created for ${email}`, status: 'invited', role: assignRole, tempPassword, note: 'Share this temporary password — they must change it on first login' });
}

// DELETE: Remove team member
export async function DELETE(req: Request) {
  const { email: adminEmail, tenantId } = getTenantFromRequest(req);
  if (!adminEmail || !tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { email } = await req.json();
  const platform = await loadPlatformData();
  const admin = platform.users?.[adminEmail];
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const tenant = platform.tenants?.[tenantId];
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  if (email === tenant.owner) return NextResponse.json({ error: 'Cannot remove tenant owner' }, { status: 400 });

  tenant.members = (tenant.members || []).filter((m: string) => m !== email);
  tenant.pendingInvites = (tenant.pendingInvites || []).filter((i: any) => i.email !== email);
  platform.auditLog?.push({ action: 'member_removed', email, tenantId, by: adminEmail, time: new Date().toISOString() });
  await savePlatformData(platform);

  return NextResponse.json({ ok: true, message: `${email} removed from team` });
}
