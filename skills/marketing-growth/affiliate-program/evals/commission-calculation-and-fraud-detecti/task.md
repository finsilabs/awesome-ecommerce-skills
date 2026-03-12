# Affiliate Order Attribution Engine

## Problem/Feature Description

Northpine Commerce runs a multi-category online marketplace selling electronics, software licenses, and general merchandise. They have an existing affiliate program where affiliates refer traffic via tracked cookies. Now they need to build the backend logic that fires when an order is completed: the system must look up the affiliate from the order's attribution cookie, perform any necessary integrity checks, calculate how much commission is owed, and record the conversion.

The commission structure varies across product categories because different categories have different profit margins. Electronics, software/digital goods, and general merchandise all carry different rates, and each affiliate sits in one of three tiers that further adjusts their rate. The finance team is strict about what counts as commissionable revenue — certain components of an order total must not be included in the commission base.

The fraud team has been seeing an increase in suspicious conversions and wants robust checks run before any commission is ever recorded. They particularly care about affiliates gaming their own referral links, bulk orders placed from suspicious IP patterns, and customers who sign up and immediately purchase.

## Output Specification

Produce a TypeScript file `order-attribution.ts` containing:

- The `COMMISSION_RATES` data structure with category-specific rates for each affiliate tier
- An `attributeOrderToAffiliate(orderId, affiliateCookieId)` function
- An `isFraudulent(order, affiliate)` function with signal-based scoring

Include TypeScript interfaces for `Order`, `Affiliate`, and `FraudSignal`. Use a `db` object assumed to be in scope. You do not need to implement actual database calls, but the function signatures and logic should be complete.

Also produce a `commission-design.md` explaining which order components are included vs excluded from the commission base, and how the fraud scoring works.
