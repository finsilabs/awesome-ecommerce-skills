# Flash Sale Data Layer

## Problem/Feature Description

ShopNow, a growing e-commerce platform, is launching a new "Deals of the Day" feature where select products are sold at heavily discounted prices for a limited time with a hard cap on units available. The existing inventory system handles normal stock, but flash sales have their own quantity pools that must never oversell — even during Black Friday traffic where thousands of users hit the reservation endpoint simultaneously.

The engineering lead wants the data layer and reservation service implemented as a clean, standalone module before the frontend team builds on top of it. They've had bad experiences with naive `SELECT` + `UPDATE` patterns causing overselling in the past and are insisting on a high-throughput approach that can handle spikes without database lock contention. The module must also not lose data if the in-memory layer goes away — so reservations need to be durably persisted, and there should be a mechanism to keep the persistent store consistent over time.

## Output Specification

Produce a TypeScript module that covers the following:

1. **`schema.sql`** — SQL DDL to create the required database tables and indexes for the flash sale system.
2. **`reserveFlashSaleUnit.ts`** — TypeScript implementation of the stock reservation function, including all edge case handling (sale not active, sale ended, sold out).
3. **`reconcile.ts`** — A short TypeScript snippet or function that describes how the persistent sold count is kept in sync with the in-memory counter.
4. **`DESIGN.md`** — A brief (1–2 paragraph) explanation of the reservation strategy chosen, covering why that approach was taken and how data durability is maintained.

All monetary values in the codebase should follow the convention used in your data model.
