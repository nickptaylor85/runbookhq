import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://getwatchtower.io';

const PRICE_IDS: Record<string, string> = {
  team:     process.env.STRIPE_TEAM_PRICE_ID     || '',
  business: process.env.STRIPE_BUSINESS_PRICE_ID || '',
  mssp:     process.env.STRIPE_MSSP_PRICE_ID     || '',
};

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json();

    if (!STRIPE_SECRET) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    const priceId = PRICE_IDS[plan];
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${BASE_URL}/stripe/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`);
    params.append('cancel_url', `${BASE_URL}/pricing`);
    params.append('allow_promotion_codes', 'true');
    params.append('billing_address_collection', 'auto');
    if (email) params.append('customer_email', email);

    // 14-day trial on all paid plans
    params.append('subscription_data[trial_period_days]', '14');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error('Stripe error:', session);
      return NextResponse.json({ error: session.error?.message || 'Stripe error' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('Checkout error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
