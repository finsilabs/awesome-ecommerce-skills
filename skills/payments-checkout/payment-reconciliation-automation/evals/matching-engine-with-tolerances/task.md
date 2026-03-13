# Payment Transaction Matching Engine

## Problem/Feature Description

Clearbook, an accounting automation startup, has built a data pipeline that pulls transactions from Stripe and PayPal into a normalized database alongside their internal order records. Now they need to build the matching engine — the core component that compares internal order records against external processor records and determines which ones correspond to each other.

The matching engine needs to handle realistic payment scenarios: most payments will have clean reference IDs to match against, but some processors strip or mangle order references, and settlement timing varies such that a payment captured on one day may not appear in the processor feed until two days later. Additionally, some transactions will have no match at all and need to be flagged for human review — but the finance team is insistent that no flagged exceptions be automatically closed or resolved by the system itself, since this creates audit compliance issues.

## Output Specification

Implement the matching engine as a JavaScript module and write a brief design document:

- `matcher.js` — The matching engine implementation
- `matcher.test.js` — Unit tests demonstrating the matching logic with at least 3 test cases covering different matching scenarios
- `DESIGN.md` — A short document (can be bullet points) explaining the matching strategy, the tolerance values chosen for amount comparison, and the exception handling policy

The code should be self-contained and not require a live database connection to understand — use comments or mock data where needed.
