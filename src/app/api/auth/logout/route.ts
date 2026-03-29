import { NextResponse } from 'next/server';
export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookieOpts = { maxAge: 0, path: '/' };
  res.cookies.set('wt_session', '', cookieOpts);
  res.cookies.set('wt_tier', '', cookieOpts);
  res.cookies.set('wt_mfa_pending', '', cookieOpts);
  res.cookies.set('wt_tenant', '', cookieOpts);
  return res;
}
