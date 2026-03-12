# Backorder Management and Inventory Replenishment

## Problem/Feature Description

Nomad Outfitters is a specialty outdoor gear retailer with highly seasonal inventory. During peak season launches, many items sell out within hours, leaving hundreds of orders with one or more unfulfillable lines. Their current system simply drops these lines silently — customers discover items are missing only when their package arrives, generating a flood of support tickets. Finance has also reported cases where restocked inventory was "claimed" by multiple orders simultaneously (a race condition in the replenishment worker), leading to fulfillment promises that couldn't be kept.

The engineering team needs a proper backorder subsystem. When an order line cannot be fulfilled immediately, it should be tracked formally with the product's expected restock date, the customer should be informed, and once stock arrives the backorders should be processed fairly. When new inventory arrives for a product (from a purchase order receipt or a return), the system needs to allocate it to waiting backorders and re-trigger the fulfillment pipeline for the affected orders. Orders that have had some shipments go out but still have pending backorders need their status reflected accurately.

## Output Specification

Produce the following TypeScript files:

- `backorder-handler.ts` — handles recording new backorders and sending customer notifications when items cannot be fulfilled
- `replenishment-worker.ts` — handles allocating newly arrived inventory to pending backorders and triggering downstream fulfillment
- `fulfillment-status.ts` — handles computing and updating an order's fulfillment status based on its shipments

Also produce `backorder-design.md` that explains:
- How the system prevents an order from being double-claimed by concurrent replenishment workers
- How partial cancellation is handled for orders that have already had some items shipped

Stub out database and queue calls — the logic, data structures, and flow must be complete even if connections are mocked.
