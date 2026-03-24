import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/encrypt';

// Simple credential check — in production replace with real user DB
// WATCHTOWER_ADMIN_PASS env var sets the admin password
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Validate against env var credentials (replace with DB lookup in production)
    const adminEmail = process.env.WATCHTOWER_ADMIN_EMAIL || 'admin@getwatchtower.io';
    const adminPass = process.env.WATCHTOWER_ADMIN_PASS || 'changeme';
    
    if (email !== adminEmail || password !== adminPass) {
      // Rate-limit hint: add delay to slow brute force
      await new Promise(r => setTimeout(r, 500));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Issue session token
    const tenantId = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || 'global';
    const token = signSession({
      userId: email,
      tenantId: 'global',
      isAdmin: true,
      email,
    });

    const res = NextResponse.json({ ok: true, tenantId });
    res.cookies.set('wt_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24h
      path: '/',
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
