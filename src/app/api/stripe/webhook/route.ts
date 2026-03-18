import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Simple signature check (in production, use Stripe's verify method)
  // For now, accept all if no secret configured (dev mode)
  if (webhookSecret && !sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    const platform = await loadPlatformData();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        const plan = session.metadata?.plan || session.subscription_data?.metadata?.plan || 'team';
        if (email && platform.users?.[email]) {
          platform.users[email].plan = plan;
          platform.users[email].stripeCustomerId = session.customer;
          platform.users[email].subscriptionId = session.subscription;
          platform.users[email].billingStatus = 'active';
          platform.users[email].trialEndsAt = new Date(Date.now() + 14 * 86400000).toISOString();
        }
        // Log
        if (!platform.auditLog) platform.auditLog = [];
        platform.auditLog.push({ action: 'subscription.created', email, plan, at: new Date().toISOString() });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const email = Object.keys(platform.users || {}).find(e => platform.users[e].stripeCustomerId === sub.customer);
        if (email) {
          platform.users[email].billingStatus = sub.status;
          if (sub.cancel_at_period_end) platform.users[email].billingStatus = 'cancelling';
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const email = Object.keys(platform.users || {}).find(e => platform.users[e].stripeCustomerId === sub.customer);
        if (email) {
          platform.users[email].plan = 'starter';
          platform.users[email].billingStatus = 'cancelled';
        }
        if (!platform.auditLog) platform.auditLog = [];
        platform.auditLog.push({ action: 'subscription.cancelled', customer: sub.customer, at: new Date().toISOString() });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const email = Object.keys(platform.users || {}).find(e => platform.users[e].stripeCustomerId === invoice.customer);
        if (email) {
          platform.users[email].billingStatus = 'past_due';
        }
        if (!platform.auditLog) platform.auditLog = [];
        platform.auditLog.push({ action: 'payment.failed', customer: invoice.customer, at: new Date().toISOString() });
        break;
      }
    }

    await savePlatformData(platform);
    return NextResponse.json({ received: true, type: event.type });
  } catch(e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
