import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { getStripeCustomerId } from '@/lib/db';
import { PAID_PLANS_LIVE } from '@/lib/product-flags';

type S = { user?: { id?: string } | null } | null;

export async function POST() {
  const session = (await auth()) as S;
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!PAID_PLANS_LIVE) {
    return NextResponse.json(
      { error: 'Billing portal is temporarily unavailable.' },
      { status: 503 },
    );
  }

  const stripeCustomerId = await getStripeCustomerId(userId);

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'No active subscription found. Please subscribe first.' },
      { status: 404 },
    );
  }

  const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/chat`,
  });

  return NextResponse.json({ url: portalSession.url });
}
