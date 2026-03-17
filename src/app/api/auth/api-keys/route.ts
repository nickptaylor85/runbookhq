import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData, getTenantFromRequest } from '@/lib/config-store';
import { randomBytes } from 'crypto';

export async function GET(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  const user = platform.users?.[email || ''];
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const keys = (platform.apiKeys || []).filter((k: any) => k.tenantId === user.tenantId && !k.revoked);
  return NextResponse.json({ keys: keys.map((k: any) => ({ id: k.id, name: k.name, prefix: k.prefix, createdAt: k.createdAt, createdBy: k.createdBy, lastUsedAt: k.lastUsedAt, scopes: k.scopes })) });
}

export async function POST(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  const user = platform.users?.[email || ''];
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { name, scopes } = await req.json();
  if (!name) return NextResponse.json({ error: 'Key name required' }, { status: 400 });

  const rawKey = 'wt_' + randomBytes(32).toString('hex');
  const id = 'key_' + Date.now().toString(36);

  if (!platform.apiKeys) platform.apiKeys = [];
  platform.apiKeys.push({ id, name, key: rawKey, prefix: rawKey.substring(0, 12) + '...', tenantId: user.tenantId, createdBy: email, createdAt: new Date().toISOString(), lastUsedAt: null, scopes: scopes || ['read'], revoked: false });

  platform.auditLog?.push({ action: 'api_key_created', name, by: email, time: new Date().toISOString() });
  await savePlatformData(platform);

  return NextResponse.json({ ok: true, key: rawKey, id, message: 'Copy this key — it will not be shown again' });
}

export async function DELETE(req: Request) {
  const { email } = getTenantFromRequest(req);
  const platform = await loadPlatformData();
  const user = platform.users?.[email || ''];
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { id } = await req.json();
  const key = (platform.apiKeys || []).find((k: any) => k.id === id && k.tenantId === user.tenantId);
  if (key) { key.revoked = true; key.revokedAt = new Date().toISOString(); }
  platform.auditLog?.push({ action: 'api_key_revoked', keyId: id, by: email, time: new Date().toISOString() });
  await savePlatformData(platform);
  return NextResponse.json({ ok: true });
}
