/**
 * When `false`, paid tiers are treated as unavailable: Stripe checkout & portal entry
 * points in the UI are hidden, and related API routes reject requests.
 * Set to `true` when Plus/Pro are live and Stripe is ready.
 */
export const PAID_PLANS_LIVE = false;
