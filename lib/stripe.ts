import 'server-only';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
}) as InstanceType<typeof Stripe>;

/** Map a Stripe Price ID to the internal plan name. */
export function planFromPriceId(priceId: string): 'plus' | 'pro' | null {
  if (priceId === process.env.STRIPE_PLUS_PRICE_ID) return 'plus';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return null;
}
