# Limited-Edition Drop: Concurrent Checkout Protection

## Problem/Feature Description

A streetwear brand is launching a limited-edition sneaker collection on their e-commerce platform. Previous drops suffered from significant overselling — customers completed checkout for sizes that were already gone, leading to order cancellations, refund headaches, and social media backlash. The engineering team has traced the root cause: the current system reads available stock, decides whether to proceed, and then decrements in two separate database queries. Under normal load this works fine, but during a product drop with thousands of simultaneous checkout attempts the gap between read and write is long enough for dozens of users to see the same "in stock" result before any reservation is committed.

The team needs a `reserveInventory` function that safely handles concurrent requests for the same variant-location combination. The function must cope with situations where a reservation attempt collides with another in-flight write, recover gracefully, and ultimately either succeed or report exactly why it could not fulfill the request. It should also support backorder scenarios for certain variants where the brand will accept orders beyond physical stock up to a supplier-confirmed limit.

## Output Specification

Write the implementation as a JavaScript/TypeScript module at `lib/inventory.js` (or `.ts`). The file should export a `reserveInventory` function. You may define any helper classes or types needed (e.g., a custom error class).

Also produce a `lib/inventory.test.js` (or `.test.ts`) file with at least 3 unit/integration test cases that demonstrate:
- A successful reservation
- A failed reservation due to insufficient stock
- The retry behaviour when a concurrent write is detected

You may use any test framework (Jest, Vitest, node:test, etc.) and mock the database layer as needed. The tests do not need to pass against a live database — stubs/mocks are fine.
