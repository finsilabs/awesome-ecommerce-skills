# Subscription Plan Change Endpoint

## Problem/Feature Description

A SaaS company offers three tiers: Starter ($29/mo), Growth ($79/mo), and Enterprise ($199/mo). Customers frequently want to upgrade mid-billing-cycle when they outgrow their current plan, or downgrade when budgets are cut. The product team has received complaints that customers are surprised by unexpected charges when they upgrade — they didn't know how much they'd be billed immediately for the partial month.

The engineering team needs to build a plan-change API that solves two problems: first, a "preview" mode that lets the frontend show customers exactly what they'll be charged before they commit; second, the actual plan-change operation. The endpoint also needs to handle the difference between upgrades (which should charge/credit immediately for the partial cycle) and downgrades (which should take effect at the next renewal to avoid complicated partial refunds).

The database record for the subscription must be kept in sync, and the endpoint should be robust to re-use across both upgrade and downgrade scenarios.

## Output Specification

Write the plan-change endpoint as `api/subscriptions/change-plan.js`, exporting `async function changePlan(req, res)`.

The endpoint should accept:
- `subscriptionId` — the internal DB subscription ID
- `newPlanId` — the Stripe price ID to switch to
- `direction` — `"upgrade"` or `"downgrade"`
- Optional query parameter `?preview=true` to return cost preview without applying

Also write `IMPLEMENTATION_NOTES.md` documenting:
- How proration is handled for upgrades vs. downgrades
- What is returned in preview mode vs. apply mode
- Any edge cases or important design decisions
