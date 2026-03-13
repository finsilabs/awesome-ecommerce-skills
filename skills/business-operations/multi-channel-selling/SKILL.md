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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Multi-Channel Selling

## Overview

Multi-channel selling lets you list products on your own website, Amazon, eBay, Walmart, and wholesale portals simultaneously — with inventory synchronized in real time so you never oversell. The critical rule: one inventory pool, updated immediately when any channel sells or restocks. Purpose-built channel management tools (Linnworks, Sellbrite, Skubana/Extensiv) make this manageable without custom integration work.

## When to Use This Skill

- When expanding beyond your own website to sell on Amazon, eBay, or Walmart Marketplace
- When running both a retail DTC site and a wholesale B2B portal from the same inventory pool
- When selling the same products under different brand names or content across channels
- When overselling on one channel because inventory is not shared in real time
- When building a channel management platform that lets brands manage all their sales channels in one place

## Core Instructions

### Step 1: Determine your platform and choose the right channel management tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Shopify's native Sales Channels + Sellbrite or Linnworks for external marketplaces | Shopify has built-in Facebook, Instagram, Google, and TikTok channels; Sellbrite adds Amazon/eBay/Walmart with inventory sync |
| **WooCommerce** | WP-Lister Pro (Amazon + eBay) or Linnworks | WP-Lister Pro lists products from WooCommerce directly to Amazon/eBay and syncs orders back |
| **BigCommerce** | BigCommerce Channels + Codisto (for Amazon/eBay) | BigCommerce has a native Channel Manager; Codisto extends it to Amazon, eBay, and Walmart with real-time sync |
| **Any Platform** | Linnworks or Skubana (Extensiv) as a central OMS | These tools sit above all channels and act as the single source of inventory truth for high-volume multi-channel operations |

### Step 2: Set up your primary store as the inventory master

Before connecting any channels, ensure your primary store has:
- Accurate stock levels for all SKUs
- Product dimensions and weights entered (required for marketplace listings)
- HS codes if selling internationally
- UPC/GTIN barcodes on all products (required for Amazon and Walmart listings)

#### Shopify

1. Go to **Settings → Sales channels** — Shopify lists all available channels
2. Add **Facebook & Instagram** (free, by Meta) to sync products to your Facebook Shop and Instagram Shopping
3. Add **Google & YouTube** (free, by Google) to sync products to Google Shopping
4. For Amazon: install **Codisto** or **Sellbrite** from the Shopify App Store — these handle the Amazon SP-API integration

#### WooCommerce

1. Your WooCommerce store is the inventory master
2. Install **WP-Lister Pro for Amazon** and/or **WP-Lister Pro for eBay** from wpla.net
3. WP-Lister reads your WooCommerce products and creates Amazon/eBay listings from them
4. Orders from Amazon/eBay are imported back to WooCommerce automatically

#### BigCommerce

1. Go to **Channel Manager** in BigCommerce admin (available on all plans)
2. Connect Google Shopping, Facebook, Instagram via the native channel connectors
3. For Amazon and eBay: install **Codisto** from the BigCommerce App Marketplace — it's the recommended Amazon/eBay integration for BigCommerce

### Step 3: Connect marketplace channels

#### Amazon

Amazon requires a Professional Seller account ($39.99/month) and approved product categories. You'll also need GTINs (UPCs or ASINs) for every listing.

**Via Shopify + Sellbrite:**
1. Install **Sellbrite** from the Shopify App Store
2. Connect your Amazon Seller Central account in Sellbrite → Channels → Add Channel → Amazon
3. Sellbrite imports your existing Amazon ASINs if you already have listings, or you can create new listings from your Shopify products
4. Enable inventory sync: Sellbrite pushes your Shopify inventory quantity to Amazon in real time (within minutes of a sale on either channel)
5. Amazon orders import into Sellbrite and sync to Shopify as new orders automatically

**Via WooCommerce + WP-Lister:**
1. Connect your Amazon Seller Central account in WP-Lister Pro → Amazon → Settings
2. Map your WooCommerce products to ASINs (match by UPC/GTIN or search Amazon's catalog)
3. WP-Lister syncs inventory from WooCommerce to Amazon and imports Amazon orders to WooCommerce

#### eBay

**Via Shopify + Sellbrite:**
1. In Sellbrite, go to Channels → Add Channel → eBay
2. Connect your eBay Seller account via OAuth
3. Map Shopify products to eBay listing templates; Sellbrite handles category requirements and eBay-specific fields
4. Inventory syncs both ways in near real time

**Via WooCommerce + WP-Lister:**
1. Same setup as Amazon — connect your eBay account in WP-Lister Pro → eBay → Settings
2. Create listing templates in WP-Lister to map WooCommerce product data to eBay category requirements

#### Walmart Marketplace

**Via Shopify + Sellbrite:**
1. Walmart Marketplace requires an application and approval (apply at marketplace.walmart.com)
2. Once approved: connect Walmart in Sellbrite → Channels → Add Channel → Walmart
3. Sellbrite handles Walmart's specific listing requirements (requires GTIN, specific image dimensions)

**Via BigCommerce + Codisto:**
1. Apply for Walmart Marketplace approval separately
2. Once approved: connect Walmart in Codisto → Channels → Walmart
3. Codisto syncs products and inventory automatically

### Step 4: Configure inventory allocation per channel

When one channel sells out, you want to prevent other channels from showing stock you don't have. Most channel management tools handle this — configure buffer quantities per channel.

**In Sellbrite:**
1. Go to Sellbrite → Channels → [Channel] → Inventory Settings
2. Set "Channel Buffer": e.g., keep 5 units in reserve so Shopify always has stock even if Amazon buys the rest
3. Enable "Stop selling when inventory = 0" to prevent oversells

**In Linnworks:**
1. Linnworks → Settings → Stock Management → Configure per-channel stock allocation
2. Set safety stock levels per channel to prevent one channel from consuming all inventory

**In Codisto (BigCommerce):**
1. Codisto → Inventory → Configure "Available stock formula": e.g., `BigCommerce stock - 3` for Amazon (holds 3 units back for other channels)

### Step 5: Handle orders from all channels

Every channel order should flow into your central system and trigger fulfillment from the same process.

**Shopify with Sellbrite:**
- Amazon and eBay orders import to Sellbrite and sync to Shopify as regular orders
- Fulfill in Shopify normally — ShipStation or Shopify Shipping handles label creation
- Sellbrite pushes tracking numbers back to Amazon/eBay automatically (required within 2 business days for Amazon)

**WooCommerce with WP-Lister:**
- Amazon and eBay orders import to WooCommerce as regular orders
- Fulfill in WooCommerce (or ShipStation); tracking numbers sync back to the marketplace automatically

**Linnworks (any platform):**
- All orders from all channels appear in Linnworks → Orders in one view
- Create pick lists and shipping labels in Linnworks
- Linnworks pushes fulfillment confirmation and tracking to each channel automatically

#### Custom / Headless — cross-channel order ingestion

```typescript
// Normalize an order from any marketplace into a common format
interface NormalizedMarketplaceOrder {
  channelName: string;       // 'amazon', 'ebay', 'walmart', 'shopify'
  channelOrderId: string;    // the marketplace's order ID
  lines: {
    channelSku: string;
    masterSku: string;       // your internal SKU
    quantity: number;
    unitPriceCents: number;
  }[];
  shippingAddress: Address;
  customerEmail: string;
}

async function ingestMarketplaceOrder(order: NormalizedMarketplaceOrder): Promise<void> {
  // Idempotency: skip if already imported
  const existing = await db.orders.findByChannelOrderId(order.channelName, order.channelOrderId);
  if (existing) return;

  await db.transaction(async tx => {
    // Create the order in your system
    const createdOrder = await tx.orders.insert({
      channel: order.channelName,
      channel_order_id: order.channelOrderId,
      status: 'awaiting_fulfillment',
      shipping_address: order.shippingAddress,
      customer_email: order.customerEmail,
    });

    // Reserve inventory for each line
    for (const line of order.lines) {
      await tx.orderLines.insert({
        order_id: createdOrder.id,
        sku: line.masterSku,
        quantity: line.quantity,
        unit_price_cents: line.unitPriceCents,
      });
      // Decrement inventory immediately
      await tx.raw(
        'UPDATE inventory SET reserved = reserved + ? WHERE sku = ? AND (quantity_on_hand - reserved) >= ?',
        [line.quantity, line.masterSku, line.quantity]
      );
    }
  });
}
```

### Step 6: Monitor cross-channel performance

Track per-channel metrics monthly to understand your channel economics:

| Metric | Where to find it |
|--------|-----------------|
| Revenue per channel | Sellbrite/Linnworks Reports → Sales by Channel |
| Sell-through rate per channel | Compare starting inventory to units sold per period |
| Inventory sync lag (stale listings) | Check your channel tool's "last synced" timestamp — anything over 30 minutes needs investigation |
| Return rate per channel | Amazon has its own return dashboard; WooCommerce/Shopify show returns by source channel tag |

## Best Practices

- **Never maintain separate stock counts per channel** — one pool, updated immediately after every sale on any channel; stale inventory leads to oversells
- **Use channel-specific SKU mappings** — Amazon uses ASINs, eBay uses item IDs, your store uses your internal SKU; maintain a mapping table rather than exposing your internal SKUs to marketplaces
- **Set safety stock buffers per channel** — allocate a reserve so one channel can't sell out your entire inventory before the sync propagates to other channels
- **Test with a single product before scaling** — connect one product to Amazon, verify the listing, place a test order, and confirm inventory syncs before connecting your entire catalog
- **Log all channel sync failures with retry** — marketplace API calls fail intermittently; use your channel management tool's retry logic and review the failure log weekly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Oversell when two channels receive orders simultaneously | Use atomic inventory reservation with a WHERE clause checking available qty; Sellbrite/Linnworks handle this; for custom builds use database-level atomic updates |
| Amazon listing goes inactive after a price change | Amazon may require a price change notification or your listing could violate their pricing policies; check the Amazon Seller Central notification inbox immediately when listings go inactive |
| Duplicate order imports when webhook fires twice | Add a unique constraint on (channel_name, channel_order_id) in your orders table and use INSERT ... ON CONFLICT DO NOTHING |
| Tracking number not pushed back to marketplace | Amazon requires tracking within 2 business days or seller performance metrics drop; verify your channel tool's automatic fulfillment confirmation is enabled |

## Related Skills

- @order-management-system
- @vendor-management
- @b2b-commerce
- @dropshipping-integration
- @marketplace-building
