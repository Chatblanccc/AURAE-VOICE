import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  ensureSchema,
  getUserPlan,
  getUsageCount,
  getMonthlyUsageCount,
  getStripeSubscriptionId,
} from '@/lib/db';
import type { UsageInfo } from '@/types';

type S = { user?: { id?: string } | null } | null;

const FREE_LIMIT = 100;
const FREE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // rolling 7-day window (~weekly)
const PLUS_LIMIT = 1000;

export async function GET() {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();
  } catch {
    // non-fatal
  }

  const plan = await getUserPlan(userId);

  let billingPaid: 'subscription' | 'prepaid' | undefined;
  if (plan === 'plus' || plan === 'pro') {
    const subId = await getStripeSubscriptionId(userId);
    billingPaid = subId ? 'subscription' : 'prepaid';
  }

  if (plan === 'pro') {
    const info: UsageInfo = {
      plan: 'pro',
      used: 0,
      limit: Infinity,
      resetAt: null,
      window: 'unlimited',
      billing: billingPaid!,
    };
    return NextResponse.json(info);
  }

  if (plan === 'plus') {
    const used = await getMonthlyUsageCount(userId);
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const info: UsageInfo = {
      plan: 'plus',
      used,
      limit: PLUS_LIMIT,
      resetAt: nextMonth.getTime(),
      window: 'month',
      billing: billingPaid!,
    };
    return NextResponse.json(info);
  }

  // free
  const windowStart = Date.now() - FREE_WINDOW_MS;
  const used = await getUsageCount(userId, windowStart);
  // Approximate reset edge for rolling window (same simplification as chat route).
  const resetAt = used >= FREE_LIMIT ? windowStart + FREE_WINDOW_MS : null;
  const info: UsageInfo = {
    plan: 'free',
    used,
    limit: FREE_LIMIT,
    resetAt,
    window: 'week',
    billing: 'free',
  };
  return NextResponse.json(info);
}
