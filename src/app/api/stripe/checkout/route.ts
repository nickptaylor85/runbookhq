import { NextResponse } from 'next/server';

const PRICES: Record<string, string> = {
  // Base plans
  team: process.env.STRIPE_PRICE_TEAM || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
  // Add-ons
  addon_seats: process.env.STRIPE_PRICE_SEATS || '',
  addon_ai: process.env.STRIPE_PRICE_AI || '',
  addon_intel: process.env.STRIPE_PRICE_INTEL || '',
  addon_reports: process.env.STRIPE_PRICE_REPORTS || '',
  addon_api: process.env.STRIPE_PRICE_API || '',
  addon_branding: process.env.STRIPE_PRICE_BRANDING || '',
  addon_support: process.env.STRIPE_PRICE_SUPPORT || '',
};

export async function POST(req: Request) {
  const { plan, email, addons, seatQty } = await req.json();
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to env vars.' });

  const lineItems: Array<{ price: string; quantity: number }> = [];

  // Base plan
  const basePriceId = PRICES[plan];
  if (basePriceId) {
    lineItems.push({ price: basePriceId, quantity: 1 });
  }

  // Additional seats
  if (seatQty && seatQty > 0 && PRICES.addon_seats) {
    lineItems.push({ price: PRICES.addon_seats, quantity: seatQty });
  }

  // Add-ons
  if (addons && Array.isArray(addons)) {
    for (const addon of addons) {
      const addonPriceId = PRICES[`addon_${addon}`];
      if (addonPriceId) {
        lineItems.push({ price: addonPriceId, quantity: 1 });
      }
    }
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'No valid plan or add-ons selected. Configure STRIPE_PRICE_* env vars.' });
  }

  try {
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', `${req.headers.get('origin') || 'https://watchtower.vercel.app'}/dashboard?billing=success`);
    params.set('cancel_url', `${req.headers.get('origin') || 'https://watchtower.vercel.app'}/signup?billing=cancelled`);
    params.set('customer_email', email || '');
    params.set('subscription_data[trial_period_days]', '14');
    params.set('allow_promotion_codes', 'true');

    lineItems.forEach((item, i) => {
      params.set(`line_items[${i}][price]`, item.price);
      params.set(`line_items[${i}][quantity]`, String(item.quantity));
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const session = await res.json();
    if (session.url) return NextResponse.json({ ok: true, url: session.url });
    return NextResponse.json({ error: session.error?.message || 'Checkout failed', detail: session });
  } catch(e) {
    return NextResponse.json({ error: String(e) });
  }
}
