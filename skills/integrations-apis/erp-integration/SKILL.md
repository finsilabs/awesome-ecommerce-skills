---
name: erp-integration
description: "Sync orders, inventory, and customer data between your store and ERP systems like SAP, NetSuite, or Odoo using middleware and async queues"
category: integrations-apis
risk: critical
source: curated
date_added: "2026-03-12"
tags: [erp, sap, netsuite, odoo, integration, sync, orders, inventory, middleware]
triggers: ["integrate ERP system", "sync orders with ERP", "connect SAP to ecommerce", "ERP inventory sync"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# ERP Integration

## Overview

Build integrations between e-commerce platforms and ERP systems (SAP, NetSuite, Odoo, Microsoft Dynamics) for bidirectional sync of orders, inventory, customers, and products. This skill covers integration architecture patterns (event-driven, polling, middleware), data mapping, conflict resolution, error handling with retry strategies, and idempotent sync that prevents duplicate records.

## When to Use This Skill

- When connecting a storefront to an ERP for automated order fulfillment
- When syncing real-time inventory levels from an ERP/WMS to the e-commerce catalog
- When building customer master data sync between the storefront and ERP
- When implementing product and pricing feeds from the ERP to the storefront
- When designing a middleware layer to handle multiple integration points

## Core Instructions

### Step 1: Determine your platform and integration approach

| Platform | Integration Option | Recommended Approach |
|----------|--------------------|---------------------|
| **Shopify** | Shopify Admin API + webhooks for order data | Use **Zapier** (no-code, $20/month) or **Celigo** (iPaaS) for standard ERP connectors; for NetSuite use the official **NetSuite Connector for Shopify** app; for custom needs use Shopify webhooks |
| **WooCommerce** | WooCommerce REST API + WordPress hooks | Use **Zapier** for simple flows; install the **Zynk WooCommerce** connector (from £500) for SAP/NetSuite; or build a custom integration using WooCommerce's REST API |
| **BigCommerce** | BigCommerce API + webhooks | Use **Celigo** or **Boomi** for enterprise ERP connectors; BigCommerce has pre-built connectors for NetSuite, SAP, and Microsoft Dynamics in the App Marketplace |
| **Custom / Headless** | Full API access — build a middleware service | Implement event-driven order sync (store webhooks → queue → ERP adapter), polling-based inventory sync (scheduled job → ERP API → update catalog), and a dead-letter queue for failed syncs |

### Step 2: Platform-specific ERP integration

---

#### Shopify

**Use a pre-built connector for standard ERPs:**

1. For **NetSuite**: Install the official **NetSuite Connector for Shopify** from the Shopify App Store ($150-$300/month). It syncs orders, inventory, and customers bidirectionally with no custom code
2. For **SAP**: Use **Celigo's SAP + Shopify** integration template or contact your SAP partner for their Shopify connector
3. For **Odoo**: Install the **Odoo Shopify Connector** module in Odoo (free, community edition) — configure your Shopify API credentials in Odoo's settings

**For custom ERP connections using Shopify webhooks:**

1. In your Shopify admin, go to **Settings → Notifications → Webhooks**
2. Click **Create webhook** and add endpoints for `orders/create`, `orders/paid`, and `inventory_levels/update`
3. Your ERP middleware endpoint receives order data in JSON and transforms it to the ERP's format
4. For inventory sync back to Shopify, use the **Inventory API** to update levels after each ERP poll

---

#### WooCommerce

**Use Zapier for simple, low-volume ERP sync:**

1. Connect WooCommerce and your ERP (NetSuite, Odoo, Sage) in [zapier.com](https://zapier.com)
2. Create a Zap: trigger = **New Order in WooCommerce**, action = **Create Sales Order in NetSuite**
3. Map the WooCommerce order fields to your ERP's required fields in Zapier's field mapper
4. Zapier polls WooCommerce every 15 minutes on the free plan; upgrade to Starter ($19.99/month) for faster polling

**For higher volume or custom ERP connections:**

1. Install **WP Webhooks** (free, wordpress.org) to send WooCommerce events to your middleware
2. Use the WooCommerce REST API (`/wp-json/wc/v3/orders`) with OAuth 1.0a for your middleware to pull orders
3. For inventory sync from ERP to WooCommerce, use the WooCommerce Products API (`PUT /wp-json/wc/v3/products/{id}`) to update `stock_quantity`

---

#### Custom / Headless

**Integration architecture — choose the pattern that fits your ERP:**

```
Event-Driven (recommended for real-time order sync):
  Storefront → Webhook/Event → Message Queue (SQS/BullMQ) → ERP Adapter

Polling (for ERPs without webhooks, like legacy SAP installations):
  Scheduler → Poll ERP API → Transform → Update Storefront

Middleware Platform (for complex multi-system environments):
  Storefront ↔ Celigo / MuleSoft / Workato ↔ ERP
```

**Idempotent order sync service:**

```typescript
// lib/erp/order-sync.ts
export async function syncOrder(orderId: string): Promise<void> {
  const order = await db.orders.getWithItems(orderId);

  // Check if already synced
  const existingSync = await db.syncLog.findByOrderId(orderId);
  if (existingSync?.status === 'synced') return;

  // Check ERP for existing record (guards against retries after partial failure)
  const existing = await erpAdapter.findOrderByExternalReference(order.orderNumber);
  if (existing) {
    await db.syncLog.upsert({ orderId, externalId: existing.erpOrderId, status: 'synced' });
    return;
  }

  try {
    const erpOrder = mapOrderToERP(order);
    const { erpOrderId } = await erpAdapter.createSalesOrder(erpOrder);
    await db.syncLog.upsert({ orderId, externalId: erpOrderId, status: 'synced', syncedAt: new Date() });
    await db.orders.updateMetadata(orderId, { erpOrderId });
  } catch (error) {
    await db.syncLog.upsert({ orderId, status: 'failed', lastError: error.message });
    throw error; // Let the retry mechanism handle it
  }
}

function mapOrderToERP(order: Order): ERPSalesOrder {
  return {
    externalReference: order.orderNumber,
    orderDate: order.createdAt.toISOString().split('T')[0],
    customer: {
      externalId: order.customer?.erpCustomerId || null,
      email: order.email,
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
    },
    shippingAddress: {
      line1: order.shippingAddress.street1,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
    },
    lineItems: order.lineItems.map(item => ({
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice / 100,   // Convert cents to dollars for ERP
      taxAmount: item.taxAmount / 100,
    })),
    orderTotal: order.totalPrice / 100,
    currency: order.currency,
  };
}
```

**BullMQ queue for reliable order sync with exponential backoff retries:**

```typescript
import { Queue, Worker, QueueEvents } from 'bullmq';

const orderSyncQueue = new Queue('order-sync', {
  connection: { host: process.env.REDIS_HOST, port: 6379 },
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 }, // 5s, 10s, 20s, 40s, 80s
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

// Producer: enqueue when order is placed
export async function onOrderPlaced(orderId: string) {
  await orderSyncQueue.add('sync-order', { orderId }, {
    jobId: `order-sync-${orderId}`, // Prevents duplicate queue entries
  });
}

// Consumer: process sync
new Worker('order-sync', async (job) => {
  await syncOrder(job.data.orderId);
}, { connection: { host: process.env.REDIS_HOST, port: 6379 }, concurrency: 5 });
```

**Inventory sync (polling-based, ERP to storefront):**

```typescript
// lib/erp/inventory-sync.ts — run via scheduled job every 5 minutes
export async function syncInventoryLevels(): Promise<void> {
  const lastSyncAt = await redis.get('erp:inventory:last_sync');
  let page = 1, hasMore = true;

  while (hasMore) {
    const { items, hasMore: more } = await erpAdapter.getInventoryLevels({
      page, pageSize: 500,
      modifiedSince: lastSyncAt ? new Date(lastSyncAt) : undefined,
    });

    for (const item of items) {
      // Available = On Hand - Reserved - Safety Stock
      const available = Math.max(0, item.onHandQuantity - item.reservedQuantity - (item.safetyStock || 0));
      const current = await db.inventory.getQuantityBySku(item.sku);
      if (current === available) continue; // Skip unchanged

      await db.inventory.updateBySku(item.sku, { quantity: available, lastSyncedAt: new Date() });
      // Update Redis cache for real-time product page availability
      const productId = await db.inventory.getProductIdBySku(item.sku);
      if (productId) await redis.setex(`inventory:${productId}`, 3600, String(available));
    }

    hasMore = more;
    page++;
  }

  await redis.set('erp:inventory:last_sync', new Date().toISOString());
}
```

## Best Practices

- **Make every sync operation idempotent** — use external references (order number, SKU) to check for existing ERP records before creating; this prevents duplicates from retries
- **Use a message queue for order sync** — never call the ERP synchronously during checkout; enqueue and process asynchronously with retries
- **Implement a dead-letter queue** — after all retries are exhausted, move failed jobs to a DLQ for manual inspection; never silently drop messages
- **Use delta sync, not full sync** — query the ERP for records modified since the last sync timestamp; full syncs don't scale past a few thousand records
- **Store the ERP record ID on your local records** — after syncing an order, save the ERP order ID on your record for cross-referencing and future status lookups
- **Calculate available inventory correctly** — `available = onHand - reserved - safetyStock` and clamp to zero; never use raw on-hand quantity from the ERP

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate orders in ERP from retry logic | Use the e-commerce order number as an external reference and check for its existence before creating; most ERPs support duplicate-check on external IDs |
| Inventory quantities go negative after sync | Clamp available quantity to zero; `Math.max(0, onHand - reserved - safetyStock)` |
| ERP rate limits cause sync failures | Implement per-operation rate limiters (token bucket) and use the ERP's bulk/feed API for large batches instead of individual item calls |
| Price sync overwrites promotional prices | Separate base prices (from ERP) from promotional prices (managed in your commerce platform); never let ERP sync overwrite active promotions |
| Large initial data load times out | Break the initial sync into batches with checkpointing so you can resume after a failure; process in parallel with concurrency limits |

## Related Skills

- @webhook-architecture
- @marketplace-connectors
- @monitoring-alerting-commerce
- @product-information-management
