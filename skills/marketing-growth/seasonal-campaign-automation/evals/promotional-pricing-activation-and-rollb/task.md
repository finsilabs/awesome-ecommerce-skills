# Summer Sale Pricing Engine

## Problem/Feature Description

Coastal Surf Co. runs a major Summer Sale every July — 15% off all surfboards and accessories for one week. Last year's sale was a commercial success, but it created two operational headaches. First, when the sale ended, three products were left at sale price for an additional 11 days because the engineer who was supposed to revert prices was on vacation and the task fell through the cracks. Second, a 15% discount code that was created for the sale was still being redeemed in September because it had no expiry — this went unnoticed until a finance review.

You have been asked to build the pricing automation module in TypeScript. It should: activate sale pricing across all eligible products at the start of the campaign, persist enough information to restore original prices afterwards, and ensure the price reversion happens automatically at campaign end without any manual intervention. You also need to implement the discount calculation logic for at least three discount types. Finally, document how discount codes created for the sale should be configured to prevent the September problem from happening again.

## Output Specification

Produce the following files:
- `pricing.ts` — TypeScript implementation of the pricing activation function, discount calculation function, and the rollback scheduling approach
- `discount-codes.md` — A short document describing the required fields and configuration for sale discount codes, including how expiry is handled and how codes are deactivated after the sale

The code in `pricing.ts` should clearly show: how original prices are preserved, how the rollback is scheduled, and the discount calculation for `percent_off`, `fixed_amount`, and `free_shipping` types. Add inline comments where the approach differs from the naive implementation.
