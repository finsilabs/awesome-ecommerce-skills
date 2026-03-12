# Checkout Promotions Evaluator

## Problem/Feature Description

Trendy Threads is a mid-size online fashion retailer that runs several promotions at any given time: a site-wide seasonal sale, a loyalty members-only discount, and periodic flash coupon codes distributed via email. Until now each of these was a separate if-statement scattered across the checkout service, which made it impossible to predict or debug which discounts would fire for a given cart.

The engineering team wants a single TypeScript function, `evaluateRules`, that accepts a cart context and a list of active promotion rules, and returns an array of applied promotion results. The function must handle the full complexity of concurrent promotions: conflicting exclusive deals, coupon-code-gated offers, rules that have run their course, time-limited campaigns, and the need to layer additional discounts on top of an already-reduced price. Marketing has also asked for a way to preview what discounts *would* apply to a cart without actually recording anything, so they can test new rules before launching.

## Output Specification

Implement the `evaluateRules` function in TypeScript (or JavaScript). Produce a `solution/` directory containing:

- `evaluator.ts` (or `.js`) — the core evaluation function with full inline comments explaining key decisions
- `evaluator.test.ts` (or `.test.js`) — test cases that achieve good coverage of the evaluation logic across a variety of cart and rule configurations
- A `README.md` briefly describing the approach and any notable design choices

All monetary values in the tests should be expressed as integers (e.g. a $29.99 item should appear as `2999`).
