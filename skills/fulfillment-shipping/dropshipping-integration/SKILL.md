---
name: dropshipping-integration
description: "Connect to supplier APIs for automatic order routing to dropship vendors, real-time inventory sync, and margin calculation per order"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [dropshipping, supplier-integration, order-routing, inventory-sync, margin-calculation, dropship]
triggers: ["dropshipping", "dropship integration", "supplier order routing", "dropship inventory sync", "dropship margin", "supplier API"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Dropshipping Integration

## Overview

A dropshipping integration routes customer orders automatically to supplier warehouses, syncs supplier inventory to your storefront, and tracks your margin on every sale. Done right, customers receive their products on time without you ever touching physical inventory. Done poorly, oversells and fulfillment failures destroy your reputation.

This skill walks through setting up dropshipping on your platform using the right tools, then covers custom/headless implementations for those building from scratch.

## When to Use This Skill

- When launching a store without physical inventory by routing orders directly to supplier warehouses
- When adding a dropship-fulfilled product category alongside your own inventory
- When building a multi-supplier routing engine that picks the best supplier per order based on price, stock, or location
- When you need to keep your storefront inventory in sync with supplier availability feeds (CSV, EDI, API)
- When tracking dropship margins for accounting and vendor performance reporting

## Core Instructions

### Step 1: Determine your platform and choose the right integration approach

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | DSers (free), AutoDS, or Spocket | DSers is the official AliExpress partner; AutoDS and Spocket handle premium/US-based suppliers with automated order routing |
| **WooCommerce** | AliDropship plugin, DropshipMe, or WooCommerce + custom webhook | AliDropship handles AliExpress automation; for other suppliers use WooCommerce webhooks to push orders to a supplier API |
| **BigCommerce** | Modalyst, Spocket, or BigCommerce + custom integration | Modalyst and Spocket have native BigCommerce apps with inventory sync |
| **Custom / Headless** | Build a supplier integration layer using the supplier's API or CSV/EDI feed | Full control over routing logic, margin tracking, and supplier selection |

### Step 2: Set up inventory sync

Keeping your storefront stock levels in sync with supplier availability is the most critical piece — oversells damage customer trust immediately.

#### Shopify

**Using DSers (AliExpress dropshipping):**
1. Install DSers from the Shopify App Store
2. Connect your AliExpress account in DSers settings
3. Import products from AliExpress via DSers → Products → Import
4. DSers syncs stock levels automatically every few hours
5. Enable "Auto-update inventory" in DSers → Settings → Supplier to push supplier stock to Shopify inventory

**Using Spocket (US/EU suppliers):**
1. Install Spocket from the Shopify App Store
2. Browse the Spocket marketplace and import products to Shopify
3. Spocket syncs inventory changes automatically — no manual configuration needed
4. Enable "Auto-fulfill orders" in Spocket settings to route new Shopify orders to suppliers automatically

**Using AutoDS (multi-supplier):**
1. Install AutoDS from the Shopify App Store
2. Add suppliers (AliExpress, Amazon, Walmart, etc.) and import their products
3. AutoDS monitors supplier prices and stock, updating your Shopify listings automatically
4. Configure price rules in AutoDS → Settings → Price Rules to set your markup automatically

#### WooCommerce

**Using AliDropship plugin:**
1. Purchase and install the AliDropship plugin
2. Use the Chrome extension to import products from AliExpress directly into WooCommerce
3. Enable automatic price and inventory updates in AliDropship → Settings → Auto-update
4. For order routing: AliDropship auto-places orders on AliExpress when you approve them in the plugin dashboard

**For non-AliExpress suppliers:**
1. Install the **WooCommerce Zapier** extension or use **n8n** (free, self-hosted) to connect WooCommerce order webhooks to supplier systems
2. Go to WooCommerce → Settings → Advanced → Webhooks, create a webhook for "Order created" events
3. Point the webhook URL at your automation workflow (Zapier/n8n) that formats and forwards the order to your supplier
4. For inventory sync, schedule a daily WP-Cron job to pull the supplier's CSV feed and update WooCommerce stock via the REST API

#### BigCommerce

**Using Modalyst:**
1. Install Modalyst from the BigCommerce App Marketplace
2. Browse Modalyst's supplier catalog and import products to BigCommerce
3. Modalyst handles inventory sync and order routing automatically once connected

**Using Spocket:**
1. Install Spocket from the BigCommerce App Marketplace
2. Import products and enable auto-fulfillment in Spocket settings
3. New orders with Spocket products are routed to suppliers automatically

#### Custom / Headless

For headless storefronts, build a supplier integration layer:

```typescript
// Supplier product and inventory schema
interface SupplierProduct {
  supplierId: string;
  supplierSku: string;       // supplier's own SKU
  internalProductId: string; // your product ID
  costPriceCents: number;    // what you pay the supplier
  stockQty: number;
  lastSyncedAt: Date;
}

// Route an order line to the best available supplier
async function selectBestSupplier(
  productId: string,
  requiredQty: number
): Promise<SupplierProduct | null> {
  // Pick the cheapest in-stock supplier with enough quantity
  return db.supplierProducts.findOne({
    internal_product_id: productId,
    stock_qty: { gte: requiredQty },
    is_active: true,
  }, { orderBy: ['cost_price_cents', 'asc'] });
}

// Sync supplier inventory from CSV feed
async function syncSupplierInventoryFromCsv(
  supplierId: string,
  csvContent: string
): Promise<void> {
  const rows = parseCsv(csvContent); // [{sku, qty, cost}]
  for (const row of rows) {
    await db.supplierProducts.upsert({
      supplier_id: supplierId,
      supplier_sku: row.sku,
      stock_qty: parseInt(row.qty),
      cost_price_cents: Math.round(parseFloat(row.cost) * 100),
      last_synced_at: new Date(),
    });
  }
  // Zero out SKUs not in the feed (discontinued)
  const activeSKUs = new Set(rows.map(r => r.sku));
  const allProducts = await db.supplierProducts.findBySupplierId(supplierId);
  for (const sp of allProducts) {
    if (!activeSKUs.has(sp.supplier_sku)) {
      await db.supplierProducts.update(sp.id, { stock_qty: 0 });
    }
  }
}

// Submit a dropship order to a supplier API
async function submitDropshipOrder(params: {
  supplierApiEndpoint: string;
  supplierApiKey: string;
  orderReference: string;
  shippingAddress: Address;
  items: { supplierSku: string; quantity: number }[];
}): Promise<string> {
  const response = await fetch(params.supplierApiEndpoint + '/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.supplierApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference: params.orderReference,
      ship_to: params.shippingAddress,
      items: params.items,
    }),
  });
  if (!response.ok) throw new Error(`Supplier API error: ${response.status}`);
  const result = await response.json();
  return result.order_id; // supplier's order reference
}
```

### Step 3: Configure automated order routing

#### Shopify

- **DSers**: Go to DSers → Settings → Automatic Actions and enable "Auto-sync tracking number to Shopify" and "Auto-fulfill Shopify orders"
- **AutoDS**: Enable Auto-Orders in AutoDS → Settings. Orders paid in Shopify are automatically placed with the supplier, and tracking numbers sync back to Shopify fulfillments
- If a supplier order fails (out of stock), DSers and AutoDS alert you via email so you can manually reroute

#### WooCommerce

- For AliDropship: approved orders in the AliDropship dashboard are auto-placed. Go to AliDropship → Orders and confirm pending orders, or enable full automation in settings
- For custom supplier integrations: use the WooCommerce webhook to trigger your supplier order submission, then use a second webhook or polling to receive tracking numbers and mark orders fulfilled via the WooCommerce REST API (`POST /wp-json/wc/v3/orders/{id}`)

#### BigCommerce

- Modalyst and Spocket both handle order routing automatically. Monitor BigCommerce → Orders and check the "Fulfillment" column — orders routed to suppliers show the supplier name
- For tracking numbers: both apps sync tracking back to BigCommerce orders automatically and trigger BigCommerce's built-in shipment notification emails

### Step 4: Track dropship margins

Margin tracking is critical — your cost price can drift from your selling price without you noticing.

#### Shopify

- Use the Shopify Analytics → Profit report (requires entering your costs in Shopify admin)
- Go to each product's variant in Shopify admin and enter the "Cost per item" — Shopify calculates margin automatically
- For multi-supplier tracking: export orders and costs from DSers/AutoDS and use a Google Sheet or QuickBooks to calculate margin per order

#### WooCommerce

- Install the **WooCommerce Cost of Goods** plugin (SkyVerge) to track per-product costs and automatically calculate margin in WooCommerce reports
- AliDropship shows cost vs. selling price in its analytics dashboard

#### BigCommerce

- Enter cost prices on each product variant in BigCommerce admin → Products → [Product] → Variants → Cost
- BigCommerce's built-in Insights report (available on Plus and above) shows margin by product

## Best Practices

- **Sync inventory at least every 4 hours** — supplier stock changes frequently; for high-velocity SKUs, sync every hour if the supplier's API allows it
- **Keep a stock buffer** — don't sell the last 3–5 units per supplier; stock can change between sync cycles and your "in stock" data may be stale
- **Store the supplier's order reference** — always save the supplier's order confirmation number so customer service can contact the supplier directly about specific shipments
- **Track lead times per supplier** — different suppliers have different fulfillment speeds; display accurate delivery estimates by using each supplier's lead time, not a generic estimate
- **Send tracking numbers to customers as soon as the supplier ships** — most supplier apps sync tracking automatically; enable this in your app settings and test it with a sample order
- **Reconcile supplier invoices monthly** — compare what you were charged against what you recorded at order time; pricing discrepancies accumulate into meaningful losses

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer orders an item that goes out of stock at the supplier after your sync | Sync frequently and keep a buffer stock threshold; enable email alerts in DSers/AutoDS for stock-out events |
| Supplier ships the wrong items | Most supplier apps don't validate fulfilled items — contact the supplier directly and have their order reference ready |
| Dropship order is placed twice when the app retries | DSers and AutoDS use idempotency internally; for custom integrations, check for an existing supplier order reference before re-submitting |
| Margin calculation ignores shipping costs | If you offer "free shipping" but pay the supplier for shipping, subtract that from your margin calculation — it's a real cost |
| Tracking number doesn't sync back to platform | Check the app's tracking sync settings; for WooCommerce webhooks verify the webhook delivery log in WooCommerce → Settings → Advanced → Webhooks |

## Related Skills

- @order-fulfillment-workflow
- @vendor-management
- @shipment-tracking
- @multi-channel-selling
- @order-management-system
