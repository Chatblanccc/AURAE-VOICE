import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, planFromPriceId } from '@/lib/stripe';
import {
  ensureSchema,
  upsertUserPlan,
  getUserIdByStripeCustomerId,
} from '@/lib/db';

// App Router: read raw body with req.text() so Stripe signature verification sees exact bytes.
export const dynamic = 'force-dynamic';

/** Prefer DB mapping (customer → user); subscription metadata is only a fallback and must match DB when both exist. */
async function resolveUserIdForCustomer(
  customerId: string,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const metaUserId = subscription.metadata?.userId as string | undefined;
  const dbUserId = await getUserIdByStripeCustomerId(customerId);

  if (dbUserId && metaUserId && metaUserId !== dbUserId) {
    console.error('[webhook] subscription metadata userId does not match DB; using DB mapping', {
      customerId,
      metaUserId,
      dbUserId,
    });
  }

  if (dbUserId) return dbUserId;
  if (metaUserId) return metaUserId;
  return null;
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const userId = await resolveUserIdForCustomer(customerId, subscription);

  if (!userId) {
    console.error('[webhook] subscription change — could not resolve userId for customer', customerId);
    return;
  }

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id ?? '';
  const plan = planFromPriceId(priceId) ?? 'free';

  // In Stripe SDK v22+, current_period_end lives on each SubscriptionItem
  const periodEnd = firstItem?.current_period_end;
  const expiresAt = periodEnd ? new Date(periodEnd * 1000) : null;

  await upsertUserPlan({
    userId,
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    expiresAt,
  });

  console.log(`[webhook] subscription updated → user=${userId} plan=${plan}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const userId = await resolveUserIdForCustomer(customerId, subscription);

  if (!userId) {
    console.error('[webhook] subscription deleted — could not resolve userId for customer', customerId);
    return;
  }

  await upsertUserPlan({
    userId,
    plan: 'free',
    stripeCustomerId: customerId,
    stripeSubscriptionId: null,
    expiresAt: null,
  });

  console.log(`[webhook] subscription deleted → user=${userId} reverted to free`);
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', String(err));
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await ensureSchema();
  } catch {
    // non-fatal
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Subscription-mode checkouts: subscription is created immediately.
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        await handleSubscriptionChange(subscription);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case 'invoice.payment_failed': {
      // Stripe will retry automatically. Log for monitoring.
      const invoice = event.data.object as Stripe.Invoice;
      console.warn('[webhook] payment failed for customer', invoice.customer);
      break;
    }

    default:
      // Acknowledge all other events to prevent Stripe from retrying them
      break;
  }

  return NextResponse.json({ received: true });
}
