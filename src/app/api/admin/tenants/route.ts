import { NextResponse } from 'next/server';
import { loadToolConfigs, saveToolConfigs } from '@/lib/config-store';

async function requireSuperAdmin(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const authMatch = cookie.match(/secops-auth=([^;]+)/);
  const email = authMatch?.[1] ? decodeURIComponent(authMatch[1]) : null;
  if (!email) return null;
  const configs = await loadToolConfigs();
  const user = configs.users?.[email];
  if (!user || user.role !== 'superadmin') return null;
  return { email, configs };
}

export async function GET(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  
  const tenants = Object.entries(auth.configs.tenants || {}).map(([id, t]: any) => ({
    id, name: t.name, plan: t.plan, owner: t.owner,
    memberCount: t.members?.length || 0, members: t.members || [],
    createdAt: t.createdAt,
  }));
  return NextResponse.json({ tenants, total: tenants.length });
}
