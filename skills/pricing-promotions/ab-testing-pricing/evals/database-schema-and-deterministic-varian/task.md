# Price Experiment Infrastructure Setup

## Problem/Feature Description

A mid-size e-commerce company is launching a new initiative to run controlled price tests before committing to any pricing changes across their catalog. The engineering lead has asked you to build the foundational layer: the database schema and the core TypeScript function that decides which price variant a shopper sees.

The system must handle tens of thousands of concurrent sessions reliably. A shopper who loads a product page twice in the same session should always see the same price — price inconsistency within a session breaks trust and skews data. The schema must also support partial traffic rollouts (not all shoppers need to see the experiment), a clean lifecycle for experiments, and the ability to run independent experiments on different products.

## Output Specification

Produce the following files:

1. `schema.sql` — the complete SQL DDL to create all necessary tables for the experiment system
2. `assignVariant.ts` — a TypeScript function `assignVariant(experimentId: string, sessionId: string)` that returns the assigned variant (or null if the session is not in the experiment). Include any helper types needed.
3. `getExperimentPrice.ts` — a TypeScript function `getExperimentPrice(productId: string, sessionId: string, defaultPrice: number)` that looks up any active experiment for the product and returns the price to show along with tracking metadata.

Assume a `db` object is available with methods: `db.priceExperiments.findById`, `db.priceExperiments.findOne`, `db.priceExperimentVariants.findByExperiment`, `db.priceExperimentAssignments.findOne`, `db.priceExperimentAssignments.insert`, `db.priceExperimentVariants.findById`, `db.raw`.
