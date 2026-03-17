import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, getTenantFromRequest } from '@/lib/config-store';
import { hashPassword } from '@/lib/crypto';

export async function POST(req: Request) {
  const { email: adminEmail } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  if (!adminEmail || platform.users?.[adminEmail]?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, newPassword } = await req.json();
  if (!email || !newPassword) return NextResponse.json({ error: 'Email and newPassword required' }, { status: 400 });
  if (newPassword.length < 8) return NextResponse.json({ error: 'Min 8 characters' }, { status: 400 });
  if (!platform.users?.[email]) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  platform.users[email].password = hashPassword(newPassword);
  platform.users[email].passwordResetAt = new Date().toISOString();
  platform.users[email].passwordResetBy = adminEmail;

  if (!platform.auditLog) platform.auditLog = [];
  platform.auditLog.push({ action: 'admin_password_reset', target: email, by: adminEmail, time: new Date().toISOString() });

  await savePlatformData(platform);
  return NextResponse.json({ ok: true, message: `Password reset for ${email}` });
}
