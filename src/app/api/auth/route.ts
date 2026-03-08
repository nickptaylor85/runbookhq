import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json();
  const correct = process.env.DASHBOARD_PASSWORD;

  if (!correct || password === correct) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('secops-auth', correct || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return res;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
