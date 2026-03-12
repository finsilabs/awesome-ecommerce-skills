# Real-Time Inventory Availability Sync

## Problem/Feature Description

BrightFrame, an online furniture retailer, sources most of its product catalog from a NetSuite ERP that manages warehouse stock across three fulfillment centers. Their storefront currently shows stale inventory — updated once per night via a full data dump — causing customers to add out-of-stock items to their cart and leading to a high rate of order cancellations. Customer complaints have spiked around popular product lines, and the merchandising team is losing trust in the website's stock indicators.

The engineering team needs a scheduled inventory sync service that runs frequently and keeps e-commerce stock levels closely aligned with ERP data. The service must be efficient enough to run often without hammering the ERP's API — meaning it should only pull records that have actually changed since the last run, handle large catalogs gracefully, and be fast to query at storefront request time.

## Output Specification

Implement the inventory sync service in TypeScript. Produce the following files:

- `src/services/inventorySyncService.ts` — The core sync service with a `syncInventoryLevels()` method that performs the full sync cycle, including paginated ERP fetching, quantity calculation, database updates, and cache updates
- `src/scheduler.ts` — Scheduler setup that calls `syncInventoryLevels()` on a recurring basis
- `src/types.ts` — TypeScript interfaces for ERP inventory items, sync results, and related types

Write a short `DESIGN.md` explaining how the service avoids redundant updates, how it handles large catalogs, and how it keeps the storefront cache fresh.
