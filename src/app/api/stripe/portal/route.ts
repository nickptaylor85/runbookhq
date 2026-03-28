import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { customerId?: string; returnUrl?: string };
    const { customerId, returnUrl = 'https://getwatchtower.io/dashboard' } = body;
    if (!customerId) return NextResponse.json({ ok: false, error: 'customerId required' }, { status: 400 });
    if (!STRIPE_SECRET) return NextResponse.json({ ok: false, error: 'Stripe not configured — add STRIPE_SECRET_KEY env var' }, { status: 503 });

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `customer=${customerId}&return_url=${encodeURIComponent(returnUrl)}`,
    });
    if (!res.ok) {
      const err = await res.json() as { error?: { message?: string } };
      return NextResponse.json({ ok: false, error: err.error?.message || 'Stripe error' }, { status: 400 });
    }
    const session = await res.json() as { url: string };
    return NextResponse.json({ ok: true, url: session.url });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
