# Order Lifecycle Management Module

## Problem/Feature Description

A growing e-commerce company is rebuilding its order processing backend after years of accumulated technical debt. Their current system uses a single `status` column with no enforcement of which transitions are legal — support tickets regularly show orders jumping from `pending` directly to `fulfilled`, or sitting in `cancelled` after a refund was already processed. Finance also complains that order line prices get overwritten when the warehouse applies discounts during pick-and-pack, making revenue reporting unreliable.

The team wants a clean TypeScript module that manages the order lifecycle correctly. The module must make illegal status changes impossible at the model level (not just in the API layer), keep a complete audit trail of every change so customer service can reconstruct what happened to any order, and handle concurrent updates safely so two workers processing the same order simultaneously can't corrupt its state.

## Output Specification

Produce a TypeScript source file `order-lifecycle.ts` containing:

- The order status type definition
- The allowed transition rules
- A `transitionOrder` function (or equivalent) that enforces the rules, records the change, and is safe under concurrency

Also produce a short `design-notes.md` explaining:
- How price adjustments after order placement should be handled (not modelled, just explained)
- How the concurrency safety approach works

The code does not need to be runnable end-to-end (no real DB connection required), but the logic and types must be complete and correct. Pseudo-code or stub implementations for the DB calls are fine.
