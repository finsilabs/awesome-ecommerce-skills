# Implement COGS Cost Assignment Functions

## Problem/Feature Description

A warehouse management system already has an `inventory_cost_layers` table that records purchase lots (each row is a received batch of a given product variant at a given location, with a unit cost and remaining quantity). When an order ships, the system needs to post COGS — it must determine which purchase lots were consumed, record the cost, and reduce the available inventory in those lots.

The company runs two types of products: fast-moving consumables tracked with weighted average cost, and high-value electronics tracked with FIFO. Both methods need to be implemented. The COGS functions will be called inside a larger order fulfillment workflow, so correctness and data integrity are critical — any silent failures or stale cost data will cause the income statement to be wrong.

The engineering team lead has flagged two specific concerns from past incidents: (1) a prior implementation cached a running average per SKU and never recomputed it, causing margin reports to drift significantly after large receipts; and (2) another service used to silently skip COGS posting when inventory data was missing, hiding the problem for weeks. The new implementation must not repeat either mistake.

## Output Specification

Write the COGS assignment logic in a file called `cogs.ts`. The file should contain:

- A function for FIFO cost assignment (`assignCogsFifo` or similar)
- A function for weighted average cost assignment (`assignCogsWeightedAvg` or similar)

Assume a `db` object is available with methods `db.transaction()`, `db.raw()`, and ORM-style finders/updaters on each table. You do not need to make the code runnable — focus on the logic being correct. Add a brief comment in the file explaining any key design decisions.
