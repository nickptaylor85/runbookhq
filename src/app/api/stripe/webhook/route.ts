import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Verify Stripe webhook signature
async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const sig = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    if (!timestamp || !sig) return false;

    const payload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const expected = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
    return expected === sig;
  } catch(e) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    if (WEBHOOK_SECRET) {
      const valid = await verifyStripeSignature(body, signature, WEBHOOK_SECRET);
      if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { customer_email?: string; metadata?: Record<string,string>; customer?: string; subscription?: string };
        const email = session.customer_email;
        const plan = session.metadata?.plan || 'team';
        console.log(`New subscription: ${email} plan=${plan}`);
        if (email) {
          // Update user tier in Redis settings
          const { redisHSet, KEYS } = await import('@/lib/redis');
          await redisHSet(KEYS.TENANT_SETTINGS('global'), 'userTier', plan).catch(() => {});
          await redisHSet(KEYS.TENANT_SETTINGS('global'), 'stripeCustomerId', session.customer || '').catch(() => {});
          await redisHSet(KEYS.TENANT_SETTINGS('global'), 'stripeSubscriptionId', session.subscription || '').catch(() => {});
          console.log(`Plan updated: ${email} → ${plan}`);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as { id: string; status: string; metadata?: Record<string,string>; customer?: string };
        console.log(`Subscription ${event.type}: ${sub.id} status=${sub.status}`);
        if (sub.status === 'active' && sub.metadata?.plan) {
          const { redisHSet, KEYS } = await import('@/lib/redis');
          await redisHSet(KEYS.TENANT_SETTINGS('global'), 'userTier', sub.metadata.plan).catch(() => {});
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string; customer?: string };
        console.log(`Subscription cancelled: ${sub.id}`);
        const { redisHSet, KEYS } = await import('@/lib/redis');
        await redisHSet(KEYS.TENANT_SETTINGS('global'), 'userTier', 'community').catch(() => {});
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as { customer_email?: string };
        console.log(`Payment failed: ${invoice.customer_email}`);
        if (invoice.customer_email) {
          await fetch(new URL('/api/email', req.url).toString(), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'custom', to: invoice.customer_email, subject: 'Payment failed — Watchtower subscription', customHtml: '<p>Your Watchtower payment failed. Please update your payment method to avoid service interruption.</p>' }),
          }).catch(() => {});
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
