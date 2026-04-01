import { NextRequest, NextResponse } from 'next/server';
import { redisGet } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'https://getwatchtower.io';
const STRIPE_CONFIG_KEY = 'wt:platform:stripe_config';

async function getStripeConfig() {
  try {
    const raw = await redisGet(STRIPE_CONFIG_KEY);
    if (raw) return JSON.parse(decrypt(raw));
  } catch {}
  // Fallback to env vars
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    priceMssp: process.env.STRIPE_MSSP_PRICE_ID || '',
    priceBusiness: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    priceTeamPerSeat: process.env.STRIPE_TEAM_PRICE_ID || '',
  };
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 checkout sessions per user per hour
  const _userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const { checkRateLimit } = await import('@/lib/ratelimit');
  const _rl = await checkRateLimit(`checkout:${_userId}`, 5, 3600);
  if (!_rl.ok) return NextResponse.json({ error: 'Too many checkout attempts. Please wait.' }, { status: 429 });

  try {
    const body = await req.json() as { plan?: unknown; email?: unknown };
    if (!body || typeof body.plan !== 'string') return NextResponse.json({ error: 'plan required' }, { status: 400 });
    const { plan } = body;
    // Validate and sanitise email
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const email = rawEmail.match(/^[^@\s]{1,64}@[^@\s]{1,255}$/) ? rawEmail.slice(0, 320) : '';
    const config = await getStripeConfig();

    if (!config.secretKey)
      return NextResponse.json({ error: 'Stripe not configured — add keys in Admin → Stripe' }, { status: 500 });

    const PRICE_MAP: Record<string, string> = {
      team:     config.priceTeamPerSeat || '',
      business: config.priceBusiness || '',
      mssp:     config.priceMssp || '',
    };

    const priceId = PRICE_MAP[plan];
    if (!priceId)
      return NextResponse.json({ error: `Price ID for ${plan} not set — configure in Admin → Stripe` }, { status: 400 });

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${BASE_URL}/stripe/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`);
    params.append('cancel_url', `${BASE_URL}/pricing`);
    params.append('allow_promotion_codes', 'true');
    params.append('billing_address_collection', 'auto');
    params.append('subscription_data[trial_period_days]', '14');
    if (email) params.append('customer_email', email);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const session = await response.json() as { url?: string; error?: { message?: string } };
    if (!response.ok) {
      console.error('Stripe checkout error:', session);
      return NextResponse.json({ error: session.error?.message || 'Stripe error' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('Checkout error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
