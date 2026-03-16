import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const platform = await loadPlatformData();
  const announcements = (platform.announcements || []).filter((a: any) => !a.expiresAt || new Date(a.expiresAt).getTime() > Date.now());
  return NextResponse.json({ announcements });
}

export async function POST(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  if (!email || platform.users?.[email]?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { message, type, expiresAt } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  if (!platform.announcements) platform.announcements = [];
  platform.announcements.push({ id: 'ann_' + Date.now().toString(36), message, type: type || 'info', createdAt: new Date().toISOString(), createdBy: email, expiresAt: expiresAt || new Date(Date.now() + 7 * 86400000).toISOString() });

  // Keep last 20
  if (platform.announcements.length > 20) platform.announcements = platform.announcements.slice(-20);

  platform.auditLog?.push({ action: 'announcement_created', by: email, message: message.substring(0, 50), time: new Date().toISOString() });
  await savePlatformData(platform);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  if (!email || platform.users?.[email]?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  platform.announcements = (platform.announcements || []).filter((a: any) => a.id !== id);
  await savePlatformData(platform);
  return NextResponse.json({ ok: true });
}
