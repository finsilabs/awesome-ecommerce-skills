---
name: multi-channel-selling
description: "Sync your catalog and inventory across your own site, Amazon, eBay, and wholesale channels to sell everywhere from one system"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [multi-channel, omnichannel, catalog-sync, inventory-sync, marketplace, wholesale, DTC]
triggers: ["multi-channel selling", "omnichannel inventory", "channel sync", "marketplace integration", "unified catalog", "cross-channel inventory"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Multi-Channel Selling

## Overview

Build a unified catalog and inventory layer that serves as the single source of truth across your DTC website, wholesale portal, and third-party marketplaces (Amazon, Walmart, eBay). The architecture separates the master catalog and inventory from channel-specific listings, enabling per-channel pricing, content, and availability rules while keeping stock levels synchronized in real time.

## When to Use This Skill

- When expanding beyond your own website to sell on Amazon, eBay, or Walmart Marketplace
- When running both a retail DTC site and a wholesale B2B portal from the same inventory pool
- When selling the same products under different brand names or content across channels
- When overselling on one channel because inventory is not shared in real time
- When building a channel management platform that lets brands manage all their sales channels in one place

## Prerequisites & Platform Notes

**Shopify**: Integrate with Shopify via Admin API for orders, customers, and inventory. Use Shopify Flow for automation. Connect ERP/OMS via apps or custom webhooks.
**WooCommerce**: Use WooCommerce REST API for order/inventory data. Automate with AutomateWoo or custom WordPress cron jobs. Connect external systems via webhooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A running store, API access, relevant third-party accounts (ERP, OMS, etc.)

## Core Instructions

1. **Design the channel-agnostic catalog architecture**

   ```sql
   -- Master product catalog (channel-agnostic)
   CREATE TABLE products (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     master_sku    VARCHAR(64) NOT NULL UNIQUE,
     title         VARCHAR(255) NOT NULL,
     brand         VARCHAR(128),
     weight_oz     NUMERIC(8,2),
     dimensions    JSONB,            -- {length, width, height, unit}
     created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Channels (DTC, wholesale, amazon, walmart, ebay, etc.)
   CREATE TABLE channels (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name          VARCHAR(64) NOT NULL UNIQUE,  -- 'dtc', 'wholesale', 'amazon_us', 'walmart'
     type          VARCHAR(16) NOT NULL
                     CHECK (type IN ('dtc', 'wholesale', 'marketplace', 'pos')),
     is_active     BOOLEAN NOT NULL DEFAULT true
   );

   -- Per-channel product listings (channel-specific content and pricing)
   CREATE TABLE channel_listings (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id    UUID NOT NULL REFERENCES products(id),
     channel_id    UUID NOT NULL REFERENCES channels(id),
     channel_sku   VARCHAR(64) NOT NULL,  -- e.g. Amazon ASIN, Walmart item ID
     title         VARCHAR(255),           -- channel-specific title override
     price         INTEGER NOT NULL,       -- cents
     is_active     BOOLEAN NOT NULL DEFAULT true,
     last_synced_at TIMESTAMPTZ,
     UNIQUE(channel_id, channel_sku)
   );

   -- Shared inventory pool
   CREATE TABLE inventory (
     product_id    UUID NOT NULL REFERENCES products(id) PRIMARY KEY,
     quantity_on_hand INTEGER NOT NULL DEFAULT 0,
     reserved      INTEGER NOT NULL DEFAULT 0,   -- held by pending orders across ALL channels
     CONSTRAINT qty_non_negative CHECK (quantity_on_hand >= 0)
   );

   -- Per-channel inventory allocation (optional — for prioritizing channels)
   CREATE TABLE channel_inventory_allocations (
     product_id    UUID NOT NULL REFERENCES products(id),
     channel_id    UUID NOT NULL REFERENCES channels(id),
     allocated_qty INTEGER NOT NULL DEFAULT 0,  -- 0 = draws from shared pool
     PRIMARY KEY (product_id, channel_id)
   );
   ```

2. **Reserve inventory on order across any channel**

   ```typescript
   async function reserveInventory(
     productId: string,
     channelId: string,
     quantity: number,
     orderId: string
   ): Promise<void> {
     await db.transaction(async tx => {
       // Check available quantity
       const result = await tx.raw(`
         UPDATE inventory
         SET reserved = reserved + ?
         WHERE product_id = ?
           AND (quantity_on_hand - reserved) >= ?
         RETURNING product_id
       `, [quantity, productId, quantity]);

       if (result.rowCount === 0) {
         throw new Error(`Insufficient inventory for product ${productId}`);
       }

       await tx.inventoryReservations.insert({
         product_id: productId,
         channel_id: channelId,
         order_id: orderId,
         quantity,
         reserved_at: new Date(),
       });
     });
   }
   ```

3. **Sync inventory to marketplace channels**

   ```typescript
   async function pushInventoryToChannels(productId: string): Promise<void> {
     const inventory = await db.inventory.findByProductId(productId);
     const available = inventory.quantity_on_hand - inventory.reserved;

     const listings = await db.channelListings.findByProductId(productId, { is_active: true });
     const channels = await db.channels.findByIds(listings.map(l => l.channel_id));

     await Promise.allSettled(
       listings.map(async listing => {
         const channel = channels.find(c => c.id === listing.channel_id)!;

         // Per-channel inventory allocation: if allocated, cap at allocation
         const allocation = await db.channelInventoryAllocations.findOne({
           product_id: productId, channel_id: channel.id
         });
         const channelQty = allocation?.allocated_qty > 0
           ? Math.min(available, allocation.allocated_qty)
           : available;

         await syncToChannel(channel, listing, channelQty);
       })
     );
   }

   async function syncToChannel(
     channel: Channel,
     listing: ChannelListing,
     quantity: number
   ): Promise<void> {
     if (channel.name === 'amazon_us') {
       await syncAmazonInventory(listing.channel_sku, quantity);
     } else if (channel.name === 'walmart') {
       await syncWalmartInventory(listing.channel_sku, quantity);
     } else if (channel.name === 'dtc') {
       // DTC reads directly from inventory table — no push needed
     }

     await db.channelListings.update(listing.id, { last_synced_at: new Date() });
   }
   ```

4. **Handle incoming orders from marketplace webhooks**

   ```typescript
   // Marketplace adapters normalize to a common format
   interface NormalizedOrder {
     channelOrderId: string;
     channelId: string;
     lines: { channelSku: string; quantity: number; pricePerUnit: number }[];
     shippingAddress: Address;
     customerEmail: string;
   }

   async function ingestMarketplaceOrder(normalizedOrder: NormalizedOrder): Promise<string> {
     // Idempotency: skip if already imported
     const existing = await db.orders.findByChannelOrderId(normalizedOrder.channelId, normalizedOrder.channelOrderId);
     if (existing) return existing.id;

     return db.transaction(async tx => {
       // Resolve channel SKUs to master product IDs
       const lines = await Promise.all(normalizedOrder.lines.map(async l => {
         const listing = await tx.channelListings.findByChannelSku(normalizedOrder.channelId, l.channelSku);
         if (!listing) throw new Error(`Unknown channel SKU: ${l.channelSku}`);
         return { product_id: listing.product_id, quantity: l.quantity, unit_price: l.pricePerUnit };
       }));

       const order = await tx.orders.insert({
         channel_id: normalizedOrder.channelId,
         channel_order_id: normalizedOrder.channelOrderId,
         status: 'paid',
         shipping_address: normalizedOrder.shippingAddress,
         customer_email: normalizedOrder.customerEmail,
       });

       await tx.orderLines.insertMany(lines.map(l => ({ ...l, order_id: order.id })));

       // Reserve inventory
       for (const line of lines) {
         await reserveInventory(line.product_id, normalizedOrder.channelId, line.quantity, order.id);
       }

       return order.id;
     });
   }
   ```

5. **Catalog sync: push product updates to channels**

   ```typescript
   async function publishProductToChannel(
     productId: string,
     channelId: string
   ): Promise<void> {
     const product = await db.products.findById(productId);
     const listing = await db.channelListings.findOne({ product_id: productId, channel_id: channelId });
     if (!listing) throw new Error(`No listing for this product/channel combination`);

     const channel = await db.channels.findById(channelId);
     const content = await db.productContent.findOne({ product_id: productId, channel_id: channelId })
       ?? await db.productContent.findDefault(productId);

     if (channel.name === 'amazon_us') {
       await amazonSPAPI.updateListing({
         sku: listing.channel_sku,
         title: listing.title ?? content.title,
         price: listing.price / 100,
         bulletPoints: content.bullet_points,
         description: content.description,
         images: content.image_urls,
       });
     }
     // Add handlers for other channels...
   }
   ```

## Examples

### Detect channels with stale inventory (not synced in 30+ minutes)

```sql
SELECT
  c.name AS channel,
  COUNT(*) AS stale_listings,
  MAX(cl.last_synced_at) AS last_sync
FROM channel_listings cl
JOIN channels c ON c.id = cl.channel_id
WHERE cl.is_active = true
  AND c.type = 'marketplace'
  AND (cl.last_synced_at IS NULL OR cl.last_synced_at < NOW() - INTERVAL '30 minutes')
GROUP BY c.id, c.name
ORDER BY stale_listings DESC;
```

### Cross-channel revenue report

```sql
SELECT
  c.name AS channel,
  COUNT(DISTINCT o.id) AS orders,
  SUM(ol.quantity * ol.unit_price) / 100.0 AS revenue
FROM orders o
JOIN channels c ON c.id = o.channel_id
JOIN order_lines ol ON ol.order_id = o.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name
ORDER BY revenue DESC;
```

## Best Practices

- **Maintain a single inventory truth** — never maintain separate stock counts per channel; always deduct from a single pool and push the available quantity to each channel after every change
- **Use channel-specific SKU mappings** — don't expose your master SKUs to marketplaces; maintain a `channel_listings` table that maps their external IDs to your internal product IDs
- **Push inventory updates immediately after any stock change** — trigger an inventory sync job on every order reservation, fulfillment, and return; stale inventory leads to oversells
- **Allocate safety stock per channel** — for high-velocity channels, set `allocated_qty` buffers so one channel can't drain all stock before the sync fires
- **Normalize incoming marketplace orders** — build a per-channel adapter that maps marketplace order formats to your internal order model; don't scatter marketplace-specific logic throughout the codebase
- **Log all sync failures with retry** — marketplace API calls will fail intermittently; use a queue with exponential backoff so failures are retried without losing updates
- **Test with sandbox credentials before going live** — Amazon, Walmart, and eBay all provide sandbox environments; always validate the integration before enabling live syncs

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Overselling when two channels receive orders simultaneously | Use `UPDATE inventory SET reserved = reserved + n WHERE (on_hand - reserved) >= n` atomically |
| Product content gets out of sync across channels after a catalog update | Trigger a `publishProductToChannel` job on every product update event, for all active channel listings |
| Marketplace order imports duplicate when webhook fires twice | Add `UNIQUE(channel_id, channel_order_id)` on the orders table and use `INSERT ... ON CONFLICT DO NOTHING` |
| Channel price changes take hours to reflect | Use a real-time event (inventory write triggers a price+stock push); don't rely solely on scheduled jobs |

## Related Skills

- @order-management-system
- @vendor-management
- @b2b-commerce
- @dropshipping-integration
- @marketplace-building
