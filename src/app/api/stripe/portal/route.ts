import { NextResponse } from 'next/server';
import { loadPlatformData } from '@/lib/config-store';

export async function POST(req: Request) {
  const { email } = await req.json();
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' });

  const configs = await loadPlatformData();
  const user = configs.users?.[email];
  if (!user?.stripeCustomerId) return NextResponse.json({ error: 'No billing account found' });

  try {
    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'customer': user.stripeCustomerId,
        'return_url': `${req.headers.get('origin') || 'https://watchtower.vercel.app'}/dashboard`,
      }).toString(),
    });
    const session = await res.json();
    if (session.url) return NextResponse.json({ ok: true, url: session.url });
    return NextResponse.json({ error: session.error?.message || 'Portal failed' });
  } catch (e) { return NextResponse.json({ error: String(e) }); }
}
