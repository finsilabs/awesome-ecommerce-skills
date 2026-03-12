# Cart Continuity Across Guest and Authenticated Sessions

## Problem/Feature Description

NestMarket, an online home-goods retailer, is losing sales because customers who browse and fill their cart as a guest find it empty after signing in or creating an account. The support team gets daily complaints: "I added 4 items before logging in and they all disappeared!" The development team needs to fix this by implementing a proper cart handoff when a guest authenticates.

There's a wrinkle though: a returning customer may have leftover items in their account cart from a previous session. When that customer's fresh guest cart is merged in, the team wants a sensible conflict resolution strategy — if the same product appears in both carts, the system should keep whichever quantity reflects the customer's most recent intent. After merging, the old guest cart should remain in the database for audit purposes but should no longer be shown as active.

Write a standalone Node.js module implementing this merge logic. Stub out any database calls so the code can be read and reviewed without a running database.

## Output Specification

Produce:
- `lib/mergeCart.js` — the cart merge function
- `lib/mergeCart.test.js` — unit tests (using any test framework, or plain assertions) covering: guest cart with no matching user cart, guest cart with overlapping variants, guest cart with non-overlapping variants, and an empty guest cart (no-op)

Keep the test file runnable with `node lib/mergeCart.test.js` or a standard test runner.
