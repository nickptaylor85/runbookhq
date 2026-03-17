import { NextResponse } from 'next/server';

const PRICES: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
};

export async function POST(req: Request) {
  const { plan, email } = await req.json();
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to env vars.' });
  const priceId = PRICES[plan];
  if (!priceId) return NextResponse.json({ error: `No Stripe price configured for plan: ${plan}. Add STRIPE_PRICE_PRO and STRIPE_PRICE_ENTERPRISE to env vars.` });

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'mode': 'subscription',
        'success_url': `${req.headers.get('origin') || 'https://watchtower.vercel.app'}/dashboard?billing=success`,
        'cancel_url': `${req.headers.get('origin') || 'https://watchtower.vercel.app'}/signup?billing=cancelled`,
        'customer_email': email || '',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'subscription_data[trial_period_days]': '14',
      }).toString(),
    });
    const session = await res.json();
    if (session.url) return NextResponse.json({ ok: true, url: session.url });
    return NextResponse.json({ error: session.error?.message || 'Checkout failed', detail: session });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
