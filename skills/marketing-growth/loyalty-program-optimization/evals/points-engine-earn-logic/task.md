# Loyalty Points Engine Implementation

## Problem/Feature Description

A growing direct-to-consumer apparel brand, ThreadCo, is launching their first customer loyalty program. Their engineering team has built out the customer and order database layer, but needs the core points engine that determines how many points customers earn for different types of interactions with the brand.

The brand wants to reward customers not just for purchases, but for community engagement activities as well — writing product reviews, referring friends, and signing up for the program. They also want a special bonus during a customer's birthday month to drive engagement. Every interaction should be fully auditable, with a complete record of how a customer's balance changed over time. After points are awarded, the system should assess whether the customer qualifies for a new tier.

The team also wants to protect against points abuse from very small orders — customers should only earn points on orders above a meaningful purchase threshold.

## Output Specification

Implement the `earnPoints` function in TypeScript as `loyalty-engine.ts`. The function should:

- Accept parameters for customerId, orderId, orderValue, and the reason for earning points
- Calculate points based on the type of earning event
- Apply any applicable multipliers for the customer's tier and birthday month
- Record the transaction in the database with a full before/after balance snapshot
- Update the customer's running points total
- Trigger a tier status check after awarding points
- Return the number of points awarded

Also write a `loyalty-engine.test.ts` file with at least 4 test cases covering different earn scenarios (you may stub database calls).

You should stub the database layer and helper functions (`db`, `getCustomerTier`, `isCustomerBirthdayMonth`, `evaluateTierStatus`) — you do not need to implement them fully.
