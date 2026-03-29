import { NextResponse } from 'next/server';
// This endpoint has been superseded by /api/auth/signup which includes
// scrypt hashing, rate limiting, 2FA enrollment, and welcome email.
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is no longer active. Use /api/auth/signup.' },
    { status: 410 }
  );
}
export async function GET() {
  return NextResponse.json({ error: 'Gone' }, { status: 410 });
}
