# Multi-Warehouse Inventory System: Data Layer

## Problem/Feature Description

A fashion retailer is expanding from a single fulfilment centre to a four-warehouse network spanning different regions. Their current inventory system was built for a single location: a flat table of SKU → quantity. It has no concept of per-warehouse stock, no way to accept backorders when stock runs out (even though the buying team pre-orders from suppliers weeks in advance), and no mechanism to alert the warehouse team when replenishment is needed.

As part of this expansion the engineering team needs to design and implement the core data layer from scratch. The data model must support per-location stock levels with enough metadata to drive backorder acceptance, replenishment workflows, and concurrent-safe writes. Importantly, the team has been burned by inventory corruption in the past — manual stock adjustments sometimes leave counts in impossible states (negative reserved quantities) — so the new schema must make these corruptions impossible at the database level.

A key operational requirement is a consolidated availability endpoint: when a customer views a product page the frontend must show total available stock, but the fulfilment team also needs a per-warehouse breakdown to decide which warehouse ships each order.

## Output Specification

Produce the following files:

- `schema.sql` or `prisma/schema.prisma` (or equivalent ORM schema file) — the full table/model definitions for the inventory data layer
- `lib/inventory.js` (or `.ts`) — exporting at minimum:
  - `fulfillInventory({ variantId, locationId, quantity, orderId })` — called when an order ships
  - `getTotalAvailability(variantId, fulfillableLocationIds)` — returns aggregated and per-location availability
  - `reserveInventory({ variantId, locationId, quantity, referenceId })` — reserves stock with backorder support
- `DESIGN.md` — a brief document explaining the schema decisions, how available stock is computed, and how the system prevents impossible inventory states

Do not download or install a real database — use pseudo-SQL, Prisma schema syntax, or plain JavaScript objects/comments to represent the schema. The focus is on the correctness of the design and implementation logic, not on running a live database.
