import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, hashPassword } from '@/lib/users';
import { redisSet } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, plan } = await req.json();
    if (!name || !email || !password)
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

    // Check if email already exists
    const existing = await getUserByEmail('global', email);
    if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

    // Create user account
    const user = await createUser('global', {
      name, email,
      role: 'owner', // First user of their org gets owner role
      tenantId: 'global',
      status: 'active',
      passwordHash: hashPassword(password),
    });

    // Set initial plan tier
    const validPlans = ['community','team','business','mssp'];
    const tier = validPlans.includes(plan) ? plan : 'community';
    await redisSet(`wt:tenant:global:settings`, JSON.stringify({ userTier: tier, demoMode: 'true', automation: '0' }));

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
