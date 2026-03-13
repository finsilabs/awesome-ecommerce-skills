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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Order Management System

## Overview

An Order Management System (OMS) handles the full order lifecycle from placement to delivery: routing orders to the right fulfillment source (own warehouse, 3PL, or dropship supplier), splitting orders when items must ship from multiple locations, handling backorders, and maintaining a complete audit trail. For most merchants, platform-native features plus a shipping app cover 80–90% of OMS needs. A custom OMS is warranted when you have multiple fulfillment locations, complex routing rules, or are building a platform for other brands.

## When to Use This Skill

- When your order volume has outgrown a single-warehouse workflow and you need multi-location routing
- When orders that mix in-stock and out-of-stock items need to ship in separate shipments without blocking fulfillment
- When integrating multiple fulfillment sources (own warehouse, 3PLs, dropship suppliers) into a unified routing engine
- When building the core order processing pipeline for a new platform that will support high order volume
- When you need a complete audit trail of every order state change for customer service and finance

## Core Instructions

### Step 1: Determine your platform and choose the right OMS approach

| Scenario | Recommended Approach | Why |
|----------|---------------------|-----|
| **Single warehouse, Shopify** | Shopify + ShipStation | ShipStation handles order management, label creation, and tracking natively |
| **Multi-location, Shopify** | Shopify Locations + ShipStation or Shopify Fulfillment Network | Shopify supports up to 10 locations; ShipStation routes to the right location based on rules |
| **3PL integration** | ShipBob, Whiplash, or Flexport + your platform's app | Each 3PL has native apps for Shopify, WooCommerce, and BigCommerce |
| **Complex routing + backorders** | Skubana (Extensiv), Linnworks, or ShipHero | These purpose-built OMS tools handle multi-warehouse routing, backorder queues, and split shipments |
| **Custom / Headless** | Build an OMS state machine + integrate Shippo/EasyPost for labels | Full control over routing rules, state transitions, and audit trail |

### Step 2: Set up multi-location order routing

#### Shopify

**Shopify Locations (up to 10 locations on standard plans):**
1. Go to **Settings → Locations → Add location** for each warehouse or fulfillment center
2. In **Settings → Shipping and delivery → Fulfill orders from**, set your fulfillment priority:
   - Shopify will automatically route orders to the location closest to the customer with available stock
3. For each product variant, set which locations stock that item: go to Products → [Product] → Inventory → Check each location's stock level
4. When an order is placed, Shopify selects the optimal fulfillment location automatically based on your priority rules

**For 3PL integration:**
- Install the 3PL's native Shopify app (ShipBob, Whiplash, Flexport all have Shopify apps)
- Configure which products are fulfilled by the 3PL vs. your own warehouse in the app settings
- The 3PL app creates an additional "location" in Shopify and receives order notifications automatically

**For split shipments:**
- Shopify automatically creates separate fulfillments when an order ships from multiple locations
- Each fulfillment gets its own tracking number and triggers its own shipping notification to the customer

#### WooCommerce

**Using ATUM Inventory Management:**
1. Install **ATUM Inventory Management** (free/premium, WordPress.org)
2. ATUM adds multi-location inventory tracking to WooCommerce
3. Configure fulfillment priority in ATUM → Settings → Multi-inventory
4. Orders are routed to the location with available stock based on your priority rules

**For 3PL integration:**
- ShipBob has a WooCommerce plugin; install it and configure which products ship from ShipBob
- ShipStation's WooCommerce plugin connects to multiple carriers and warehouses; configure routing rules in ShipStation → Automation → Rules

#### BigCommerce

1. Go to **Inventory → Locations** to add multiple fulfillment locations (available on Plus and above)
2. Set inventory levels per location for each product
3. BigCommerce routes orders to the location with stock closest to the customer based on your settings
4. For 3PL integration: ShipBob, Whiplash, and ShipStation all have native BigCommerce integrations via the App Marketplace

### Step 3: Handle backorders

A backorder occurs when an order is placed for an item that is out of stock. The customer still wants the item; you need to fulfill it when stock arrives.

#### Shopify

**Enable backorders:**
1. Go to **Products → [Product] → Variants → [Variant]**
2. Set inventory tracking: check "Continue selling when out of stock" — this allows orders to come in even when stock = 0
3. Be transparent: show a "Ships in 2–3 weeks" message on the product page when stock is 0

**Communicate backorders:**
- When a product is backordered, Shopify's standard order confirmation doesn't flag this automatically
- Use **Klaviyo** or **Shopify Email** to create a trigger: when order has a line item with quantity > available stock → send a "Backordered" email with the estimated restock date

**Fulfilling backordered orders:**
- When stock arrives (you receive a shipment): manually fulfill the backordered orders in Shopify → Orders → filter by "Unfulfilled" and sort by order date
- For automatic backorder fulfillment: use **Shopify Flow** (Plus) or a webhook to trigger fulfillment when inventory is replenished

#### WooCommerce

1. Go to **WooCommerce → Settings → Products → Inventory**
2. Enable "Allow backorders" at the global level, or set per product: Products → [Product] → Inventory → Allow Backorders
3. Options: "Do not allow", "Allow but notify customer", "Allow without notification"
4. Recommend: "Allow but notify customer" — WooCommerce adds a "On backorder" badge and notifies the customer at checkout
5. Backordered orders appear in WooCommerce → Orders with status "On Hold" or "Processing" depending on your payment flow

#### BigCommerce

1. Go to **Products → [Product] → Inventory**
2. Enable "Allow Purchasing Out of Stock" — BigCommerce shows the product as "Available for Pre-Order" automatically when stock = 0
3. Set "Back Ordering" message text in Store Setup → Store Settings → Product Settings

### Step 4: Maintain an order audit trail

Every order status change should be logged with who made the change and when. This is essential for customer service and fraud investigation.

#### Shopify

- Shopify automatically logs all order status changes in **Orders → [Order] → Timeline**
- The Timeline shows every event: payment confirmed, fulfillment created, shipping label purchased, tracking updated, etc.
- Add manual notes to the Timeline (visible to staff only) for any manual actions taken

#### WooCommerce

- WooCommerce logs order notes in each order's **Order Notes** section
- Status changes are logged automatically ("Order status changed from Processing to Completed")
- For more comprehensive audit logging: install **WooCommerce Order Status Manager** or **Activity Log** plugin

#### BigCommerce

- BigCommerce logs order status changes in the **Order Activity** section of each order
- The activity log shows all status changes, notes added, and system actions

#### Custom / Headless — order state machine with event log

```typescript
// Order status state machine with full audit trail
type OrderStatus =
  | 'pending'
  | 'payment_processing'
  | 'paid'
  | 'awaiting_fulfillment'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending:              ['payment_processing', 'cancelled'],
  payment_processing:   ['paid', 'cancelled'],
  paid:                 ['awaiting_fulfillment', 'cancelled'],
  awaiting_fulfillment: ['partially_fulfilled', 'fulfilled', 'cancelled'],
  partially_fulfilled:  ['fulfilled'],
  fulfilled:            ['delivered', 'refunded'],
  delivered:            ['refunded'],
};

async function transitionOrder(params: {
  orderId: string;
  newStatus: OrderStatus;
  actorId: string;
  note?: string;
}): Promise<void> {
  const order = await db.orders.findById(params.orderId);
  const allowed = VALID_TRANSITIONS[order.status] ?? [];

  if (!allowed.includes(params.newStatus)) {
    throw new Error(`Invalid transition: ${order.status} → ${params.newStatus}`);
  }

  await db.transaction(async tx => {
    await tx.orders.update(params.orderId, { status: params.newStatus, updated_at: new Date() });
    // Every transition is recorded — this IS the audit trail
    await tx.orderEvents.insert({
      order_id: params.orderId,
      from_status: order.status,
      to_status: params.newStatus,
      actor_id: params.actorId,
      note: params.note ?? null,
      occurred_at: new Date(),
    });
  });
}

// Route an order to the right fulfillment source
async function routeOrder(orderId: string): Promise<void> {
  const order = await db.orders.findById(orderId);
  const lines = await db.orderLines.findByOrderId(orderId);

  for (const line of lines) {
    // Check own warehouse first
    const warehouseStock = await db.inventory.findAvailable(line.sku, line.quantity);
    if (warehouseStock) {
      await db.fulfillmentLines.insert({
        order_id: orderId,
        order_line_id: line.id,
        source: 'warehouse',
        source_id: warehouseStock.location_id,
        status: 'pending',
      });
      continue;
    }

    // Fall back to dropship supplier
    const supplier = await db.supplierProducts.findBestSupplier(line.product_id, line.quantity);
    if (supplier) {
      await db.fulfillmentLines.insert({
        order_id: orderId,
        order_line_id: line.id,
        source: 'dropship',
        source_id: supplier.supplier_id,
        status: 'pending',
      });
      continue;
    }

    // No source available — create a backorder
    await db.backorders.insert({
      order_id: orderId,
      order_line_id: line.id,
      product_id: line.product_id,
      quantity: line.quantity,
      status: 'pending',
    });
    // Notify customer about the backorder
  }
}
```

## Best Practices

- **Use a purpose-built OMS before building custom** — Skubana/Extensiv ($500+/month) or Linnworks handles multi-warehouse routing, backorders, and split shipments with proven reliability; custom development should only start when these tools can't meet your specific needs
- **Keep orders and fulfillments as separate entities** — an order is a financial contract with the customer; fulfillments are physical shipments; one order can generate multiple fulfillments
- **Queue fulfillment planning asynchronously** — don't route orders synchronously during checkout; enqueue routing immediately after payment confirmation and process in a background worker
- **Never silently drop backordered lines** — always notify the customer and give them the option to wait or cancel; silent backorders erode trust when the customer discovers weeks later
- **Alert on orders stuck in "awaiting fulfillment" for 24+ hours** — set up a daily alert for orders that haven't moved to fulfillment; these usually indicate a routing error or system issue

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Order splits into multiple shipments unexpectedly | Pre-warn customers at checkout if an order will ship from multiple locations; show estimated delivery per shipment separately |
| Backorder never fulfilled after stock arrives | Set up an automatic trigger: when inventory is replenished above the backorder quantity, trigger fulfillment for the oldest pending backorder (FIFO) |
| Partial cancellation leaves the order in a broken state | Implement partial cancellation — cancel only lines that haven't been picked; issue a refund for cancelled lines; update the order total |
| Shopify shows "partially fulfilled" but customer thinks full shipment is coming | Send a clear email explaining each shipment as it ships, with the items in that specific shipment and the remaining items to follow |

## Related Skills

- @order-fulfillment-workflow
- @returns-management
- @multi-channel-selling
- @dropshipping-integration
- @demand-forecasting
