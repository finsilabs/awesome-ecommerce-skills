# Cart Recovery Infrastructure

## Problem/Feature Description

An online sporting goods retailer has been losing roughly $40,000 per month from carts that go silent mid-checkout. Their current approach watches for page close events to flag an abandonment, but support has noticed customers are being tagged as abandoners even while actively browsing — and others slip through entirely. The engineering team has been asked to rebuild the abandonment detection system from scratch and wire it into a reliable, delayed messaging pipeline.

The back-end stack is TypeScript with a PostgreSQL database (accessed via a `db` object) and Redis already running in the environment. The team wants the system to be resilient: no double-sending, no sequences triggered twice for the same cart, and the ability to cancel in-flight jobs cleanly if a customer places an order.

Your job is to implement the core infrastructure: the abandonment detection mechanism, the job scheduling layer that dispatches the sequence of recovery messages, and the secure one-time token used to generate personalised recovery links. You do not need to implement the actual email/SMS sending — focus on the detection, scheduling, and token generation logic.

## Output Specification

Produce a TypeScript module `cart-recovery.ts` that exports:

- `onCartUpdated(cartId: string)` — called on every cart change
- `findAbandonedCarts()` — the periodic check function (document how it should be invoked)
- `startRecoverySequence(cart: Cart)` — schedules all recovery jobs and creates the token
- `onOrderCompleted(orderId: string)` — cancels any in-flight recovery jobs for the related cart

Include a brief `DESIGN.md` explaining:
- How abandonment is detected (trigger mechanism and timing)
- How duplicate sequences are prevented
- How jobs are identified and cancelled on conversion
- The token generation approach and its expiry
