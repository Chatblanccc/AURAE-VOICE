import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import {
  ensureSchema,
  getStripeCustomerId,
  upsertUserPlan,
} from '@/lib/db';
import { z } from 'zod';
import { PAID_PLANS_LIVE } from '@/lib/product-flags';

type S = { user?: { id?: string; email?: string | null; name?: string | null } | null } | null;

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  plus: process.env.STRIPE_PLUS_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
};

const bodySchema = z.object({
  plan: z.enum(['plus', 'pro']),
});

export async function POST(req: Request) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!PAID_PLANS_LIVE) {
    return NextResponse.json(
      { error: 'Paid plans are temporarily unavailable.' },
      { status: 503 },
    );
  }

  const { plan } = parsed.data;
  const priceId = PLAN_PRICE_MAP[plan];

  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID for plan "${plan}" is not configured on the server.` },
      { status: 500 },
    );
  }

  try {
    await ensureSchema();
  } catch {
    // non-fatal — schema may already exist
  }

  // Find or create a Stripe Customer for this user
  let stripeCustomerId = await getStripeCustomerId(userId);

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session?.user?.email ?? undefined,
      name: session?.user?.name ?? undefined,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;

    // Persist the customer ID immediately so concurrent requests don't create duplicates
    await upsertUserPlan({ userId, plan: 'free', stripeCustomerId });
  }

  const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  // Subscription Checkout uses cards (and other methods Stripe enables for recurring in your account).
  // Alipay / WeChat Pay are NOT supported in Checkout subscription mode — see:
  // https://docs.stripe.com/payments/alipay — enable Alipay in Dashboard for other flows; recurring Alipay may require Stripe approval.

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/chat?checkout=success`,
      cancel_url: `${appUrl}/#pricing`,
      subscription_data: {
        metadata: { userId },
      },
      metadata: { userId },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe checkout failed';
    console.error('[checkout] Stripe error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
