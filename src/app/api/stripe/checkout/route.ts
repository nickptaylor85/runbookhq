import { NextResponse } from 'next/server';

const PRICES: Record<string, string> = {
  team: process.env.STRIPE_PRICE_TEAM || '',
  team_annual: process.env.STRIPE_PRICE_TEAM_ANNUAL || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
  business_annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || '',
  mssp: process.env.STRIPE_PRICE_MSSP || '',
  addon_seats: process.env.STRIPE_PRICE_SEATS || '',
  addon_ai: process.env.STRIPE_PRICE_AI || '',
  addon_intel: process.env.STRIPE_PRICE_INTEL || '',
  addon_reports: process.env.STRIPE_PRICE_REPORTS || '',
  addon_api: process.env.STRIPE_PRICE_API || '',
  addon_branding: process.env.STRIPE_PRICE_BRANDING || '',
  addon_support: process.env.STRIPE_PRICE_SUPPORT || '',
  addon_mssp_clients: process.env.STRIPE_PRICE_MSSP_CLIENTS || '',
};

export async function POST(req: Request) {
  const { plan, email, addons, seatQty, annual } = await req.json();
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to Vercel env vars.' });

  const lineItems: Array<{ price: string; quantity: number }> = [];

  // Base plan (annual variant if selected)
  const planKey = annual ? plan + '_annual' : plan;
  const basePriceId = PRICES[planKey] || PRICES[plan];
  if (basePriceId) {
    const baseQty = plan === 'team' ? Math.max(3, (seatQty || 0) + 3) : 1;
    lineItems.push({ price: basePriceId, quantity: plan === 'team' ? baseQty : 1 });
  }

  // Add-ons
  if (addons && Array.isArray(addons)) {
    for (const addon of addons) {
      const addonPriceId = PRICES['addon_' + addon];
      if (addonPriceId) {
        lineItems.push({ price: addonPriceId, quantity: 1 });
      }
    }
  }

  if (lineItems.length === 0) {
    return NextResponse.json({
      error: 'No Stripe prices configured yet.',
      setup: 'Go to Stripe Dashboard → Product Catalog → create products with these lookup keys: wt_team_monthly, wt_business_monthly, wt_mssp_monthly. Then add Price IDs to Vercel env vars.',
      envVarsNeeded: Object.entries(PRICES).filter(([_, v]) => !v).map(([k]) => k),
    });
  }

  try {
    const origin = req.headers.get('origin') || 'https://runbookhq.vercel.app';
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', origin + '/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}');
    params.set('cancel_url', origin + '/pricing?billing=cancelled');
    if (email) params.set('customer_email', email);
    params.set('subscription_data[trial_period_days]', '14');
    params.set('allow_promotion_codes', 'true');
    params.set('subscription_data[metadata][plan]', plan);
    params.set('subscription_data[metadata][source]', 'watchtower');

    lineItems.forEach((item, i) => {
      params.set('line_items[' + i + '][price]', item.price);
      params.set('line_items[' + i + '][quantity]', String(item.quantity));
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + stripeKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const session = await res.json();
    if (session.url) return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
    return NextResponse.json({ error: session.error?.message || 'Checkout failed', detail: session });
  } catch(e) {
    return NextResponse.json({ error: String(e) });
  }
}
