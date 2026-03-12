# Returns Policy Audit Trail and Historical Evaluation

## Problem/Feature Description

FinSi's legal team has flagged a compliance gap in the returns system: whenever a return is disputed, the customer service team has no way to prove what the return policy said *at the time the customer placed the order*. The company recently tightened the electronics return window from 30 days to 15 days, and several customers with older orders are now receiving incorrect rejection notices because the system is applying the new policy retroactively. One customer has already filed a chargeback, citing a policy they can prove was different when they bought.

The ops team needs two things: first, an immutable record of every change made to any return policy so they can reconstruct what rules were in force on any given date; second, the return eligibility engine must evaluate a return request against the policy that was *active when the order was placed*, not whatever rule currently exists.

## Output Specification

Produce the following files:

- `schema.sql` — DDL for a `return_policies` table and a versioning/audit table that captures the full state of a policy at each change
- `policy-service.ts` (or `.js`) — Business logic including:
  - A function to create a new policy (must record an initial version)
  - A function to update an existing policy (must record a new version, not overwrite history)
  - A function to retrieve the full version history for a policy, ordered most-recent-first
  - A function to look up which policy snapshot was in effect at a given timestamp for a given product category / customer segment combination
  - A return-eligibility evaluation function that uses the policy active at the order's purchase date
- `demo.ts` (or `.js`) — A runnable script (no database required; use in-memory structures) that:
  1. Creates a "Standard" 30-day return policy
  2. Updates it to reduce the window to 15 days
  3. Shows the version history (both versions should appear)
  4. Evaluates return eligibility for an order placed *before* the change using the historical policy (should use 30-day window)
  5. Evaluates return eligibility for an order placed *after* the change (should use 15-day window)
  6. Prints a summary of each evaluation result

Run the demo with `npx ts-node demo.ts` or `node demo.js`.
