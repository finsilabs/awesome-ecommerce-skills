# Checkout Coupon Validation Service

## Problem/Feature Description

The FinSi checkout team needs a TypeScript module that validates promotional codes when a customer applies one at checkout. The validator must reject codes that are past their end date, have reached their global redemption cap, don't meet the basket minimum, or have already been used by the same customer — and it must return a machine-readable reason in each case so the frontend can display a friendly message without any further API calls.

The discount calculation must correctly handle the three coupon types the marketing team uses: flat dollar-off, percentage-off (where a maximum discount cap is sometimes set to protect margin), and free-shipping codes. Free-shipping codes are processed in a separate shipping-cost step and should produce a zero discount in the subtotal calculation.

Validation attempts — including failures and their reasons — need to be persisted so the fraud and analytics teams can monitor misuse patterns over time.

## Output Specification

Produce a TypeScript file `coupon-validator.ts` that exports:
- A `CouponValidationResult` interface
- A `validateCoupon` function
- A `calculateDiscount` helper function

The file should contain inline comments explaining key decisions. You may define a minimal stub/mock for any database layer — the grader cares about the structure and logic of the exported functions, not the DB implementation details.
