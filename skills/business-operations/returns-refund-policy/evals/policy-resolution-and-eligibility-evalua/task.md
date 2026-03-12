# Returns Policy Engine — Core Implementation

## Problem/Feature Description

FinSi is an e-commerce platform that has grown rapidly and now handles dozens of product categories — everything from electronics to perishable consumables. Their current returns logic is hardcoded in a single customer-service script that treats every order identically. The operations team is constantly editing the script to handle exceptions: electronics need a shorter window and a restocking fee, final-sale clearance items shouldn't be returnable at all, and B2B wholesale accounts have different terms. Every change requires a developer deploy, and when customers dispute a return decision they have no record of which rule applied.

The team wants to replace this with a proper policy engine: a database-backed system where different rules can be configured per product category, customer segment, or order tag, without touching code. The engine must also tell callers exactly *why* a return was denied (window expired, final sale, reason not allowed, etc.) and what restocking fee to apply so the front end can show it to the customer before they confirm.

## Output Specification

Produce the following files in your working directory:

- `schema.sql` — DDL for all tables the policy engine requires
- `seed.sql` — INSERT statements that populate a useful set of default policies
- `policy-engine.ts` (or `.js`) — The policy resolution and eligibility-evaluation logic, including:
  - A function that resolves the highest-priority matching policy for a given combination of product categories, customer segments, and order tags
  - A function that evaluates whether a specific return request is eligible, returning a structured result object
  - A function that calculates the restocking fee (as a cent amount) given a policy and the items' total value in cents
- `policy-engine.test.ts` (or `.js`) — Unit tests covering at least the following cases:
  - A delivered order within the return window → eligible
  - An order that has not yet been delivered → ineligible (with reason)
  - An order past its return window → ineligible (with reason)
  - A final-sale order → ineligible (with reason)
  - A return reason not permitted by the applicable policy → ineligible (with reason)
  - A high-restocking-fee scenario where the fee is capped at the maximum
  - A policy with NULL category filter matching any product category

You may stub out any database calls. The test file should run with `npx ts-jest` or `node --experimental-vm-modules node_modules/.bin/jest` (or plain Node if you write `.js`). Include a `package.json` if needed.
