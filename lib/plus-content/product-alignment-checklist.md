# Product Alignment Checklist (Plus Rollout)

## Feature Gate and Billing

- [ ] Confirm `PAID_PLANS_LIVE` switch strategy by environment.
- [ ] Ensure Stripe Plus/Pro price IDs are configured before launch.
- [ ] Verify upgrade/paywall copy matches actual availability.

## Scenario Access and Limits

- [ ] Enforce Free plan to 2 scenario entries in selector UI.
- [ ] Expose Plus/Pro 40+ scenario catalog from `scenario-catalog.json`.
- [ ] Confirm usage limits: Free weekly 100, Plus monthly 1000, Pro unlimited.

## Daily Plan and Assessment

- [ ] Run onboarding assessment once per user.
- [ ] Persist assessment result and priority weakness dimension.
- [ ] Generate one daily plan card per day; always keep free-chat path open.

## Reporting

- [ ] Implement Plus detailed weekly report payload fields.
- [ ] Reserve Pro advanced diagnostics fields for future rollout.

## Launch Readiness

- [ ] Update EN/ZH pricing + FAQ copy consistency.
- [ ] Validate quality gate pass for launch 15 scenarios.
- [ ] Confirm support SLA and auto-reply template are active.
