# Nightly Retention Engine and Loyalty Tier System

## Problem/Feature Description

Nomad Outfitters, an outdoor gear retailer with 50,000 active customers, is losing roughly 12% of their mid-tier customers each quarter — mostly to a competitor running aggressive promotions. The retention team has identified that timely, targeted outreach is the difference between winning back a lapsing customer and losing them permanently, but right now all outreach is manual and sporadic.

They want two things built: First, a nightly automated job that evaluates each customer's predicted CLV and churn risk and routes them into the appropriate action — high-risk, high-value customers should receive a win-back campaign while moderately at-risk customers should get a personalized nurture touch. Second, a loyalty tier assignment function that segments customers into named tiers (platinum, gold, silver, standard) based on their predicted and historical value, so the merchandising team can adjust offers accordingly.

The existing codebase already has `calculateChurnProbability(customerId)`, `predictCustomerCLV(customerId)`, and `db.customers.findActiveWithOrders({ minOrders })` available. The email/action triggers `triggerWinBackFlow(customerId, opts)` and `triggerPersonalizedNurtureEmail(customerId)` are also available as imported functions.

## Output Specification

Produce a TypeScript file `retention.ts` that exports:

1. `runChurnPreventionAutomation()` — the nightly job function
2. `assignCustomerTier(customerId)` — tier assignment based on CLV values

Also write a `retention-design.md` file documenting:
- The churn probability thresholds used to route customers into different actions
- The CLV threshold used to decide whether a win-back discount is justified
- How the tier thresholds and blending weights are determined
- Any idempotency or duplicate-prevention logic used

## Input Files

No additional input files are provided. The functions listed above (db, triggerWinBackFlow, etc.) can be treated as available in scope.
