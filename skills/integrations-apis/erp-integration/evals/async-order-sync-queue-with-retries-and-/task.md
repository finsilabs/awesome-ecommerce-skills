# Reliable Order Sync to ERP

## Problem/Feature Description

GardenHarvest, a mid-size online retailer of gardening supplies, recently rolled out a new headless e-commerce storefront and connected it to their existing NetSuite ERP. Their engineering team quickly ran into a painful problem: whenever the ERP was slow or briefly unavailable during peak checkout hours, orders failed to sync, leaving operations staff scrambling to manually re-enter orders into NetSuite and customers without fulfillment updates.

The team has decided to decouple order syncing from the checkout flow entirely. They want a robust background processing system that picks up newly placed orders, attempts to push them to the ERP, and gracefully handles failures with automatic retries. They also need visibility into orders that could not be synced after all retry attempts — these must be preserved and accessible for manual intervention by the ops team, rather than simply being lost.

## Output Specification

Implement the order sync background processing system in TypeScript. Produce the following files:

- `src/queues/orderSyncQueue.ts` — Queue setup, job producer function (called when an order is placed), and worker configuration
- `src/services/orderSyncService.ts` — The sync service logic: fetches the order, checks for prior sync, calls the ERP adapter, updates the sync log, and stores the ERP reference on the order
- `src/queues/deadLetterQueue.ts` — Dead letter queue setup, handler for moving exhausted jobs there, and alert logic
- `src/routes/adminIntegrations.ts` — Admin API endpoint(s) for managing stuck jobs from the dead letter queue

Include a `src/types.ts` with relevant TypeScript interfaces (OrderSyncPayload, RetryPolicy, SyncLogEntry, etc.).

Write a brief `DESIGN.md` explaining the architecture decisions made, including how retries work and how the dead letter queue fits in.
