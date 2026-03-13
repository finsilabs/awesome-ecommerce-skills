---
name: order-management-system
description: "Design an order management system that routes orders to the right warehouse, handles split shipments, and manages backorders gracefully"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [OMS, order-management, split-orders, backorders, distributed-fulfillment, fulfillment-routing]
triggers: ["order management system", "OMS", "split orders", "backorder handling", "fulfillment routing", "distributed fulfillment", "order routing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Order Management System

## Overview

Design and implement a robust Order Management System (OMS) that handles the full order lifecycle from placement to delivery. Covers distributed fulfillment routing (route to the nearest warehouse or dropship supplier), automatic order splitting when items ship from multiple locations, backorder management for out-of-stock items, and the state machine that governs order status transitions.

## When to Use This Skill

- When your order volume has outgrown a single-warehouse pick-pack-ship workflow and you need multi-location routing
- When orders that mix in-stock and out-of-stock items need to ship in separate shipments without blocking fulfillment
- When integrating multiple fulfillment sources (own warehouse, 3PLs, dropship suppliers) into a unified routing engine
- When building the core order processing pipeline for a new platform that will support high order volume
- When you need a complete audit trail of every order state change for customer service and finance

## Prerequisites & Platform Notes

**Shopify**: Integrate with Shopify via Admin API for orders, customers, and inventory. Use Shopify Flow for automation. Connect ERP/OMS via apps or custom webhooks.
**WooCommerce**: Use WooCommerce REST API for order/inventory data. Automate with AutomateWoo or custom WordPress cron jobs. Connect external systems via webhooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A running store, API access, relevant third-party accounts (ERP, OMS, etc.)

## Core Instructions

1. **Order lifecycle state machine**

   ```typescript
   type OrderStatus =
     | 'pending'             // payment not yet confirmed
     | 'payment_processing'  // payment in flight
     | 'paid'                // payment confirmed
     | 'awaiting_fulfillment'
     | 'partially_fulfilled' // some shipments sent, others pending
     | 'fulfilled'           // all shipments sent
     | 'partially_delivered'
     | 'delivered'
     | 'cancelled'
     | 'refunded'
     | 'partially_refunded';

   const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
     pending:               ['payment_processing', 'cancelled'],
     payment_processing:    ['paid', 'cancelled'],
     paid:                  ['awaiting_fulfillment', 'cancelled'],
     awaiting_fulfillment:  ['partially_fulfilled', 'fulfilled', 'cancelled'],
     partially_fulfilled:   ['fulfilled', 'partially_refunded'],
     fulfilled:             ['partially_delivered', 'delivered', 'partially_refunded', 'refunded'],
     partially_delivered:   ['delivered', 'partially_refunded'],
     delivered:             ['partially_refunded', 'refunded'],
   };

   async function transitionOrder(
     orderId: string,
     newStatus: OrderStatus,
     actorId: string,
     note?: string
   ): Promise<void> {
     const order = await db.orders.findById(orderId);
     const allowed = VALID_TRANSITIONS[order.status] ?? [];

     if (!allowed.includes(newStatus)) {
       throw new Error(`Invalid order transition: ${order.status} → ${newStatus}`);
     }

     await db.transaction(async tx => {
       await tx.orders.update(orderId, { status: newStatus, updated_at: new Date() });
       await tx.orderEvents.insert({
         order_id: orderId,
         from_status: order.status,
         to_status: newStatus,
         actor_id: actorId,
         note: note ?? null,
         occurred_at: new Date(),
       });
     });
   }
   ```

2. **Route order to the optimal fulfillment source**

   ```typescript
   interface FulfillmentSource {
     type: 'warehouse' | 'dropship';
     id: string;
     name: string;
     location?: { lat: number; lng: number };
   }

   async function routeOrderLine(
     productId: string,
     quantity: number,
     destinationZip: string
   ): Promise<FulfillmentSource | null> {
     // 1. Try own warehouses first (cheapest to fulfill)
     const warehouses = await db.warehouseInventory.findAvailable(productId, quantity);
     if (warehouses.length > 0) {
       // Pick the warehouse closest to the destination
       const sorted = await sortByDistanceToZip(warehouses, destinationZip);
       return { type: 'warehouse', id: sorted[0].warehouse_id, name: sorted[0].name };
     }

     // 2. Fall back to dropship supplier
     const supplierProduct = await db.supplierProducts.findOne({
       product_id: productId,
       stock_qty: { gte: quantity },
       is_active: true,
     }, { orderBy: ['cost_price', 'asc'] });

     if (supplierProduct) {
       const supplier = await db.suppliers.findById(supplierProduct.supplier_id);
       return { type: 'dropship', id: supplier.id, name: supplier.name };
     }

     return null; // no source available — will become a backorder
   }
   ```

3. **Split an order into shipment groups**

   ```typescript
   interface ShipmentGroup {
     source: FulfillmentSource;
     lines: { orderLineId: string; productId: string; quantity: number }[];
   }

   async function planFulfillment(orderId: string): Promise<ShipmentGroup[]> {
     const order = await db.orders.findById(orderId);
     const lines = await db.orderLines.findByOrderId(orderId);
     const groups = new Map<string, ShipmentGroup>();
     const backorderedLines: typeof lines = [];

     for (const line of lines) {
       const source = await routeOrderLine(line.product_id, line.quantity, order.shipping_address.zip);

       if (!source) {
         backorderedLines.push(line);
         continue;
       }

       const key = `${source.type}:${source.id}`;
       if (!groups.has(key)) groups.set(key, { source, lines: [] });
       groups.get(key)!.lines.push({
         orderLineId: line.id,
         productId: line.product_id,
         quantity: line.quantity,
       });
     }

     if (backorderedLines.length > 0) {
       await handleBackorders(orderId, backorderedLines);
     }

     return Array.from(groups.values());
   }

   async function createFulfillmentsFromPlan(orderId: string, plan: ShipmentGroup[]): Promise<void> {
     await db.transaction(async tx => {
       for (const group of plan) {
         const fulfillment = await tx.fulfillments.insert({
           order_id: orderId,
           fulfillment_source_type: group.source.type,
           fulfillment_source_id: group.source.id,
           status: 'awaiting_fulfillment',
         });

         await tx.fulfillmentLines.insertMany(
           group.lines.map(l => ({ fulfillment_id: fulfillment.id, ...l }))
         );
       }

       const newStatus = plan.length > 1 ? 'partially_allocated' : 'awaiting_fulfillment';
       await tx.orders.update(orderId, { status: newStatus });
     });
   }
   ```

4. **Manage backorders**

   ```typescript
   async function handleBackorders(
     orderId: string,
     backorderedLines: OrderLine[]
   ): Promise<void> {
     for (const line of backorderedLines) {
       const product = await db.products.findById(line.product_id);
       const estimatedRestockDate = product.next_restock_date;

       await db.backorders.insert({
         order_id: orderId,
         order_line_id: line.id,
         product_id: line.product_id,
         quantity: line.quantity,
         estimated_restock_date: estimatedRestockDate,
         status: 'pending',
       });

       await db.orderLines.update(line.id, { fulfillment_status: 'backordered' });
     }

     // Notify customer
     const order = await db.orders.findById(orderId);
     await emailService.send({
       to: order.customer_email,
       template: 'backorder-notification',
       data: {
         orderNumber: order.order_number,
         backordered: backorderedLines.map(l => ({
           name: l.product_name,
           qty: l.quantity,
           estimatedDate: l.estimated_restock_date,
         })),
       },
     });
   }

   // Called when new inventory arrives (from a PO receipt or return)
   async function fulfillBackorders(productId: string, availableQty: number): Promise<void> {
     const pending = await db.backorders.findAll({
       product_id: productId,
       status: 'pending',
     }, { orderBy: ['created_at', 'asc'] }); // FIFO

     let remaining = availableQty;

     for (const backorder of pending) {
       if (remaining <= 0) break;
       if (backorder.quantity > remaining) continue; // can't partially fulfill a line

       await db.backorders.update(backorder.id, { status: 'fulfilled' });
       await db.orderLines.update(backorder.order_line_id, { fulfillment_status: 'ready' });

       // Re-trigger fulfillment planning for this order
       await queue.add('plan-fulfillment', { orderId: backorder.order_id });

       remaining -= backorder.quantity;
     }
   }
   ```

5. **Track partial fulfillment progress**

   ```typescript
   async function updateOrderFulfillmentStatus(orderId: string): Promise<void> {
     const fulfillments = await db.fulfillments.findByOrderId(orderId);
     const allShipped = fulfillments.every(f => ['shipped', 'delivered'].includes(f.status));
     const someShipped = fulfillments.some(f => ['shipped', 'delivered'].includes(f.status));

     let newStatus: OrderStatus;
     if (allShipped) newStatus = 'fulfilled';
     else if (someShipped) newStatus = 'partially_fulfilled';
     else return; // no change

     await transitionOrder(orderId, newStatus, 'system');
   }
   ```

## Examples

### Order event log (full audit trail)

```sql
SELECT
  oe.occurred_at,
  oe.from_status,
  oe.to_status,
  COALESCE(u.name, oe.actor_id) AS changed_by,
  oe.note
FROM order_events oe
LEFT JOIN users u ON u.id::text = oe.actor_id
WHERE oe.order_id = $1
ORDER BY oe.occurred_at;
```

### Find orders stuck in `awaiting_fulfillment` for more than 24 hours

```sql
SELECT
  o.order_number,
  o.created_at,
  o.status,
  EXTRACT(HOURS FROM (NOW() - o.updated_at)) AS hours_in_status
FROM orders o
WHERE o.status = 'awaiting_fulfillment'
  AND o.updated_at < NOW() - INTERVAL '24 hours'
ORDER BY o.updated_at;
```

## Best Practices

- **Model orders and fulfillments as separate entities** — an order is a financial record; a fulfillment is a physical shipment; one order can have many fulfillments
- **Never modify order line prices after placement** — the price on the order line is the price the customer agreed to; apply adjustments as separate credit/debit line items
- **Use an event sourcing log** — store every status transition in `order_events` with actor, timestamp, and note; this is essential for fraud investigation and customer service
- **Queue fulfillment planning asynchronously** — don't plan fulfillment synchronously in the checkout request; enqueue it immediately after `paid` and process it in a background worker
- **Handle backorders explicitly** — never silently drop backordered lines; always notify the customer and give them the option to wait or cancel
- **Keep the state machine strict** — reject invalid transitions at the model layer; it's better to throw an exception than to allow an order to enter an inconsistent state
- **Recompute fulfillment status from shipment events** — don't maintain a separate counter; derive `partially_fulfilled` / `fulfilled` from the actual fulfillment records

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Order splits into 3 shipments but customer expects 1 | Pre-warn customers at checkout if an order will ship from multiple locations; show estimated delivery per shipment |
| Backorder fulfilled twice (race condition) | Use `UPDATE backorders SET status = 'fulfilled' WHERE status = 'pending' AND id = ?` and check `rowCount === 1` |
| Cancellation fails for an order already partially shipped | Implement partial cancellation — only cancel lines that haven't been picked yet; issue a refund for cancelled lines |
| State machine allows illegal transition in race condition | Perform the status check and update in a single `UPDATE ... WHERE status = old_status RETURNING id` |

## Related Skills

- @order-fulfillment-workflow
- @returns-management
- @multi-channel-selling
- @dropshipping-integration
- @demand-forecasting
