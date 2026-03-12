# Email Campaign Code Generator

## Problem/Feature Description

The FinSi marketing team is running a win-back campaign targeting 5,000 lapsed customers. Each recipient needs a unique, one-time-use discount code worth $10 off their next order — codes will be distributed through an email marketing platform and must not be reusable or shareable between customers. The codes should look professional and be easy to read aloud or type manually, since some customers interact with support to redeem them.

The engineering team also needs the order-processing service to safely redeem a code when an order is placed, even under high concurrency during flash sales where many customers may attempt to use the last available code simultaneously.

## Output Specification

Produce a TypeScript file `campaign-generator.ts` that exports:
- A `generateCouponCode` function for creating a single code
- A `bulkGenerateCoupons` function for generating a large batch

Produce a second TypeScript file `redeem-coupon.ts` that exports:
- A `redeemCoupon` function that safely marks a code as used within an order transaction

Both files should include inline comments. You may stub out the database layer. Also produce a short `README.md` explaining the collision-handling strategy and how concurrent redemption is made safe.
