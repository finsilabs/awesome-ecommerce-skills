# Shipping Weight Calculator Module

## Problem/Feature Description

A mid-sized e-commerce company has been losing money on shipping large, lightweight items — bulky foam packaging and oversized gift boxes are costing them significantly more at the carrier counter than what they quoted customers. Their current system only uses the actual scale weight, leading to consistent undercharges.

The engineering team needs a TypeScript utility module that correctly determines the billable weight for any shipment. Carriers charge based on whichever is greater: the actual weight or the dimensional (volumetric) weight — and they use specific divisors for imperial vs metric measurements. The module also needs to reliably normalize package weights from any unit into a common format for downstream processing.

## Output Specification

Write a TypeScript file `shipping-weight.ts` that exports:
- A `calculateBillableWeight(pkg: Package)` function that returns the billable weight in pounds
- A `normalizeWeightToLbs(weight: Package['weight'])` helper function
- The `Package` interface (or import-compatible type definitions)

Include a short `README.md` documenting the DIM factors used and how dimensional weight works, so other engineers understand the business logic.

Write a second file `examples.ts` that demonstrates calling `calculateBillableWeight` with at least 3 different packages (mix of imperial and metric dimensions, varying actual vs dimensional weight scenarios) and logs the results.
