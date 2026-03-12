# Fair Launch Protection for Limited-Edition Product Drops

## Problem/Feature Description

A streetwear brand is preparing a limited-edition sneaker drop — 500 pairs available at 9 AM. In their last two releases, bots purchased the entire stock within seconds of launch, leaving thousands of legitimate fans empty-handed and generating a PR backlash. The engineering team needs a system that detects automated checkout behavior, gives real customers a fair shot by queuing them, and prevents any single customer from buying more than their allotted quantity regardless of how fast their connection is or how many accounts they register.

The team has a Next.js application with Redis already available. They want to be able to detect bots that complete the checkout process at superhuman speeds or exhibit no human interaction patterns (no mouse movement, no keystrokes, instant form completion). They also want a queuing mechanism for the launch so that customers are admitted to checkout in the order they arrived, not by raw connection speed. Finally, they need purchase limits that can't be defeated by hammering the submit button multiple times concurrently.

## Output Specification

Produce the following files:

- `lib/behavioral-analysis.ts` — client-side signal collection and server-side scoring logic that flags sessions exhibiting bot-like behavior
- `lib/waiting-room.ts` — waiting room queue implementation using Redis, including functions to join the queue, compute position/estimated wait, and admit batches of customers to checkout
- `lib/purchase-limit.ts` — server-side purchase limit enforcement with concurrency protection
- `IMPLEMENTATION_NOTES.md` — explanation of how the three components work together, the specific thresholds and limits chosen, and how the solution handles bots that rotate IP addresses

The implementation should be TypeScript and assume a Redis client (`redis`) is imported from a shared module. You do not need to implement the full checkout flow — focus on these protection layers.
