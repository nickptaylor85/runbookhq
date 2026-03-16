import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';

export async function POST(req: Request) {
  const body = await req.text();
  // In production, verify webhook signature with STRIPE_WEBHOOK_SECRET
  try {
    const event = JSON.parse(body);
    const configs = await loadPlatformData();
    if (!configs.auditLog) configs.auditLog = [];

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email;
        if (email && configs.users?.[email]) {
          configs.users[email].plan = session.metadata?.plan || 'pro';
          configs.users[email].stripeCustomerId = session.customer;
          configs.users[email].stripeSubscriptionId = session.subscription;
          configs.auditLog.push({ action: 'subscription_created', email, plan: configs.users[email].plan, time: new Date().toISOString() });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        // Find user by stripe customer ID
        for (const [email, user] of Object.entries(configs.users || {})) {
          if ((user as any).stripeCustomerId === sub.customer) {
            (user as any).plan = sub.status === 'active' ? ((user as any).plan || 'pro') : 'starter';
            configs.auditLog.push({ action: 'subscription_updated', email, status: sub.status, time: new Date().toISOString() });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        for (const [email, user] of Object.entries(configs.users || {})) {
          if ((user as any).stripeCustomerId === sub.customer) {
            (user as any).plan = 'starter';
            configs.auditLog.push({ action: 'subscription_cancelled', email, time: new Date().toISOString() });
          }
        }
        break;
      }
    }

    configs.updatedAt = new Date().toISOString();
    await savePlatformData(configs);
    return NextResponse.json({ received: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
