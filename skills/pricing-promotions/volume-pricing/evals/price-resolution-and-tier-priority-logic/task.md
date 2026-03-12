# Storefront Pricing Engine: Unit Price Resolver

## Problem/Feature Description

A growing e-commerce platform needs a TypeScript pricing module that determines the correct unit price for any product in a shopping context. The platform has both retail and B2B customers. B2B customers belong to named customer groups (e.g., "wholesale", "distributor") and may have dedicated price agreements negotiated with account managers. All customers can also benefit from quantity breaks — the more they buy, the cheaper the unit price.

The pricing team has reported bugs where B2B customers sometimes get the wrong price because the system doesn't consistently apply their negotiated rates. The team needs a clean, correct implementation of a `resolveUnitPrice` function that handles all these cases deterministically. When multiple pricing rules could apply, behavior must be predictable and documented.

## Output Specification

Produce a self-contained TypeScript file `pricing.ts` that:
- Exports a `resolveUnitPrice` function that accepts productId, quantity, customerGroup (nullable), and basePrice (in cents)
- Returns `{ unitPrice: number; tierApplied: string | null }`
- Includes inline comments explaining the resolution priority order
- Uses a mock/stub db layer (you can define the data inline or as a simple in-memory structure) so the logic can be read without a real database

Also produce `pricing.test.ts` with at least 4 test cases covering:
1. A customer with a matching price list entry
2. A customer without a price list but with a matching volume tier
3. A customer where no tier applies (returns base price)
4. Overlapping tiers with different priorities (verify correct tier is selected)

You may use any test framework or plain assertion functions — the test file should be runnable with `npx ts-node pricing.test.ts` or `node --loader ts-node/esm pricing.test.ts`.
