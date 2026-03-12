# Affiliate Payout and Tier Management System

## Problem/Feature Description

StyleHub, a fashion e-commerce platform, has been running its affiliate program for six months and now needs to operationalize recurring commission payments and tier management. Currently, conversions pile up as unprocessed records and affiliates have no automated way to receive their earnings. The finance team runs a manual payment process once a month that has become too time-consuming and error-prone.

They need an automated monthly processing system that: identifies which conversions are mature enough to pay out (the business has a return policy window), groups payouts by affiliate, sends funds through their payment infrastructure, and records the payment trail for accounting. Additionally, they've noticed some affiliates gaining outsized tier status based on a single lucky month, then coasting — they want the tier calculation to reflect sustained performance. The trust and safety team also wants a utility to catch a specific type of click fraud that's been hitting their top affiliates.

All affiliates are onboarded through a formal payment account setup process; the system should gracefully handle affiliates who haven't completed this step.

## Output Specification

Produce a TypeScript file `payout-system.ts` containing:

- A `processMonthlyPayouts()` function that handles the full monthly payment cycle
- A `checkAndUpgradeTier(affiliateId)` function for tier management
- A `detectCookieStuffing(orderId, affiliateId)` function for fraud detection

Include relevant TypeScript interfaces. Use `stripe` as an imported Stripe client and `db` as the database object (both assumed to be in scope). Do not implement actual database calls, but logic and conditions must be complete.

Also produce a `payout-design.md` explaining the payout eligibility rules, minimum thresholds, tier recalculation approach, and the cookie stuffing detection logic.
