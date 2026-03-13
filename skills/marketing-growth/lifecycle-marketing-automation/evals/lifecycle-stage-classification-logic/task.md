# Customer Lifecycle Stage Engine

## Problem Description

Growthwave is a mid-sized DTC apparel brand that has been running a single broadcast newsletter to its entire customer base. The marketing team has noticed declining open rates and repeat purchase rates, and the VP of Growth suspects that customers are receiving completely irrelevant emails — loyal customers get the same acquisition-focused messages as someone who signed up yesterday but never bought anything.

The engineering team has been tasked with building a core customer lifecycle classification module in TypeScript. This module will form the foundation of a new behavior-triggered automation platform. The goals are: (1) classify every customer into the right lifecycle bucket based on their purchase history and engagement signals, and (2) keep the stage model simple enough for non-technical marketers to understand and act on.

The system should be designed to run reliably at scale — Growthwave has roughly 400,000 customers, so the nightly re-evaluation job needs to be written with performance in mind to avoid timeouts.

## Output Specification

Produce a TypeScript module (one or more `.ts` files) that implements:

1. The lifecycle stage taxonomy as TypeScript types and interfaces
2. A function `assignLifecycleStage(customerId)` that classifies a customer
3. A batch update function `updateLifecycleStages()` that nightly re-evaluates all customers — make sure it handles large tables without timing out
4. A mechanism to prevent a customer from bouncing back and forth between stages on consecutive nightly runs

Write the output to a file named `lifecycle-engine.ts`.

Additionally, write a brief `design-notes.md` describing:
- The stage taxonomy you chose and why
- How the at-risk and lapsed thresholds work
- Any performance optimizations in the batch job
- How you handle the stage-stability problem
