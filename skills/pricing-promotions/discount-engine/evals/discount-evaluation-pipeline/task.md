# Cart Discount Engine Implementation

## Problem/Feature Description

A growing online marketplace needs a discount engine that can apply multiple types of promotions to a shopping cart. The operations team regularly runs several promotions simultaneously — for example, a site-wide free shipping offer may be active at the same time as a product-specific bulk discount. The business rules around which promotions combine and which ones override each other are complex, and getting the math wrong has directly caused losses in the past (including one incident where a percentage-off coupon was applied to an already heavily discounted order with no cap).

The engineering team needs a TypeScript implementation of the core evaluation logic: given a list of discount rules and a cart snapshot, compute how much each discount should reduce the order. The implementation must handle the full range of discount types the business uses (percentage off, fixed dollar off, buy-N-get-M-free, and free shipping), and respect the configured combination rules so that promotions don't stack in unintended ways.

## Output Specification

Produce the following files in your working directory:

1. `discount-engine.ts` — The TypeScript implementation containing the evaluation pipeline, condition checking, allocation calculation for all discount types, and the stacking/priority logic. Include type definitions for cart context, line items, and discount allocations in the same file or as imports.
2. `discount-engine.test.ts` — A test file (using any test framework of your choice, or plain assertions with console output) that exercises at minimum: (a) a tiered bulk discount scenario, (b) a BOGO scenario, (c) a fixed-amount order discount, and (d) a case where two competing line-item discounts are present and stacking must be resolved.
3. `README.md` — Brief notes describing how the priority and stacking system works.
