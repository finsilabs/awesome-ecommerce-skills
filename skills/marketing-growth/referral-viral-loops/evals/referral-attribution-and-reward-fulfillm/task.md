# Implement Referral Attribution and Reward Processing

## Problem/Feature Description

Bloom Beauty has launched a referral program where customers can share their personal referral link. The marketing team has set up the program configuration and link generation — now they need the backend logic that actually makes the program work: capturing when a new visitor arrives through a referral link, and processing rewards when that visitor makes a purchase.

The current system has a gap: there's no middleware to record that a visitor arrived via a referral link, and no logic to handle what happens at checkout when a referred customer completes an order. The team needs both pieces built in TypeScript. The system already uses Express for the web layer and BullMQ (or similar) for background jobs. The reward system supports discount codes and store credit.

Key business rules the team has agreed on:
- Not every completed order should earn a referral reward — there are order value thresholds
- The same email address shouldn't be able to trigger multiple rewards for the same program
- The person who *referred* someone shouldn't be able to refer themselves
- Reward timing matters: not all parties should get their reward at the same moment

## Output Specification

Produce a TypeScript file `attribution.ts` containing:
- An Express middleware function that captures referral attribution from incoming requests
- An `attributeReferral(order, req)` function that processes a completed order and handles reward fulfillment

Also produce a `attribution-design.md` explaining the reward timing strategy and the anti-abuse measures implemented (3–5 bullet points).

Assume the following are available: `db` object with ORM-style access, `referralQueue` for scheduling jobs, `grantReward(customerId, reward, conversionId, role)` function, `createUniqueDiscount(params)` function, and standard Express `Request`/`Response`/`NextFunction` types.
