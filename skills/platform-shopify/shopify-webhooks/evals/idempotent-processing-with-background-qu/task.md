# Reliable Order Event Processing Pipeline

## Problem/Feature Description

A growing e-commerce logistics company has built a Shopify app that listens for order creation events and performs several downstream operations: syncing the order to their ERP system, updating warehouse inventory levels, and sending a confirmation notification to the merchant. Occasionally, Shopify delivers the same order event twice (this is expected behavior), causing orders to be synced to the ERP twice and triggering duplicate warehouse updates and notifications. The operations team has also reported that during peak traffic, some webhook deliveries appear to time out before any response is sent.

You need to redesign the order creation webhook handler so that it responds quickly to Shopify, processes orders reliably in the background, and is safe to receive the same event multiple times without side effects.

## Output Specification

Produce the following files:

- `src/queues/order-queue.ts` — TypeScript module that defines and exports a Bull job queue for order processing, including a job processor that calls `syncOrderToERP(order, shop)`, `updateInventoryInWarehouse(order.line_items)`, and `sendConfirmationNotification(order)` (stub implementations are fine).
- `src/handlers/order-create.ts` — TypeScript module exporting an Express route handler for the `POST /webhooks/orders-create` endpoint.
- `src/db/processed-webhooks.ts` — TypeScript module exporting a simple in-memory or database-backed store with `hasProcessed(webhookId, shop)` and `markProcessed(webhookId, shop, topic)` functions.
- `README.md` — A brief description of how duplicate delivery is handled and how the response timing requirement is met.
