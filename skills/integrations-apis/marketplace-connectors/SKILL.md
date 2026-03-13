---
name: marketplace-connectors
description: "List products on Amazon, eBay, and Walmart with two-way inventory sync, automated listing creation, and order import into your store"
category: integrations-apis
risk: critical
source: curated
date_added: "2026-03-12"
tags: [marketplace, amazon, ebay, walmart, sp-api, inventory-sync, order-import, multichannel, listing]
triggers: ["amazon integration", "ebay integration", "walmart marketplace", "marketplace connector", "multichannel commerce", "amazon sp-api", "marketplace listing sync"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Marketplace Connectors

## Overview

Selling across Amazon, eBay, and Walmart Marketplace multiplies your sales channel reach but introduces operational complexity: each marketplace has its own product data model, listing requirements, order lifecycle, and inventory management API. This skill covers connecting your store to major marketplaces — using apps for managed platforms and direct API integration for custom storefronts.

## When to Use This Skill

- When expanding sales channels beyond your own storefront to major marketplace platforms
- When building a multichannel commerce system that keeps inventory in sync across channels
- When automating order imports from marketplaces into your OMS or ERP
- When existing marketplace feeds are manual (spreadsheet uploads) and need automation

## Core Instructions

### Step 1: Determine your platform and recommended approach

| Platform | Recommended Approach | Key Apps |
|----------|---------------------|----------|
| **Shopify** | Use a marketplace app — no custom code needed | **Codisto** ($39/month) for Amazon + eBay + Walmart; **LitCommerce** ($19/month) for multi-channel listing management |
| **WooCommerce** | Use a plugin for standard integrations | **WooCommerce Amazon Fulfillment** (free, amazon.com) for FBA; **WP-Lister Pro for Amazon** ($99) for full listing and order management |
| **BigCommerce** | Use App Marketplace connectors | **Sellbrite** ($79/month, marketplace.bigcommerce.com) syncs Amazon, eBay, Walmart, and Etsy; **ChannelAdvisor** for enterprise multi-channel |
| **Custom / Headless** | Direct API integration | Build using Amazon SP-API, eBay REST API, and Walmart Marketplace API; use a queue for order imports and inventory sync |

### Step 2: Platform-specific marketplace setup

---

#### Shopify

**Connect Amazon with Codisto:**

1. Install **Codisto** from the Shopify App Store ($39/month for Amazon + eBay)
2. Connect your Amazon Seller Central account (US, UK, EU, AU supported)
3. In Codisto, go to **Listings → Amazon** and click **Link Products** — it matches your Shopify products to existing ASINs or creates new listings
4. Enable **Inventory Sync** to update Amazon quantities automatically when Shopify inventory changes
5. Enable **Order Import** — Codisto imports Amazon orders as Shopify orders so you manage fulfillment from one place

**Important before listing:**
- Set a safety stock buffer in Codisto settings: reserve 10–20% of your Shopify inventory from marketplaces to avoid oversells if sync lags
- Configure marketplace-specific pricing in Codisto to account for Amazon fees (15% referral fee + FBA fees) — list at a higher price than your Shopify store

---

#### WooCommerce

**Connect Amazon with WP-Lister Pro:**

1. Purchase and install **WP-Lister Pro for Amazon** ($99 from wp-lister.com)
2. Go to **WP-Lister → Settings → Amazon** and enter your Amazon Marketplace Web Service (MWS) credentials
3. In **WP-Lister → Products**, select products to list and configure ASIN matching or create new listings
4. Enable **Auto-sync inventory** — WP-Lister updates Amazon quantities when WooCommerce stock changes
5. Enable **Import Amazon orders** — orders appear in WooCommerce automatically

**For eBay with WooCommerce:**

1. Install **WP-Lister Pro for eBay** ($99) — same workflow as Amazon version
2. Connect via eBay API credentials in WP-Lister settings
3. Configure category mapping between your WooCommerce categories and eBay categories

---

#### BigCommerce

**Connect Amazon, eBay, and Walmart with Sellbrite:**

1. Install **Sellbrite** from the BigCommerce App Marketplace ($79/month)
2. Connect your marketplace seller accounts (Amazon, eBay, Walmart) and your BigCommerce store
3. Sellbrite pulls your BigCommerce product catalog and syncs listings to all connected marketplaces
4. Set inventory buffer rules per channel (e.g., reserve 5 units for your BigCommerce store)
5. Configure automatic order import — marketplace orders appear in BigCommerce for unified fulfillment

---

#### Custom / Headless

**Amazon SP-API authentication:**

```typescript
// lib/amazon/auth.ts — LWA OAuth token with caching
let tokenCache: { accessToken: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) return tokenCache.accessToken;

  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.AMAZON_REFRESH_TOKEN!,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
    }),
  });

  const data = await res.json();
  tokenCache = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.accessToken;
}
```

**Update Amazon inventory (SP-API Listings Items):**

```typescript
export async function updateAmazonInventory(sellerId: string, sku: string, quantity: number) {
  const accessToken = await getAccessToken();
  // SP-API also requires AWS Signature V4 — use @smithy/signature-v4
  return fetch(`https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}`, {
    method: 'PATCH',
    headers: { 'x-amz-access-token': accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productType: 'PRODUCT',
      patches: [{ op: 'replace', path: '/attributes/fulfillment_availability', value: [{
        fulfillment_channel_code: 'DEFAULT',
        quantity,
        marketplace_id: 'ATVPDKIKX0DER', // US marketplace
      }] }],
    }),
  });
}
```

**Import Amazon orders (polling every 5 minutes):**

```typescript
export async function pollAmazonOrders() {
  const lastPolledAt = await db.syncState.getLastPolled('amazon') ?? new Date(Date.now() - 3_600_000);
  const accessToken = await getAccessToken();

  const params = new URLSearchParams({
    MarketplaceIds: 'ATVPDKIKX0DER',
    CreatedAfter: lastPolledAt.toISOString(),
    OrderStatuses: 'Unshipped,PartiallyShipped',
  });

  const res = await fetch(`https://sellingpartnerapi-na.amazon.com/orders/v0/orders?${params}`, {
    headers: { 'x-amz-access-token': accessToken },
  });
  const { payload } = await res.json();

  for (const amazonOrder of payload.Orders ?? []) {
    // Idempotent: skip if already imported
    if (await db.orders.findByExternalId(amazonOrder.AmazonOrderId)) continue;

    await orderQueue.add('import-order', {
      externalId: amazonOrder.AmazonOrderId,
      channel: 'amazon',
      // ...map order fields
    }, { jobId: `amazon-${amazonOrder.AmazonOrderId}` });
  }

  await db.syncState.updateLastPolled('amazon', new Date());
}
```

**Sync inventory across all channels when stock changes:**

```typescript
export async function syncInventoryAcrossChannels(sku: string, quantity: number, source: string) {
  const tasks = [];

  if (source !== 'amazon') {
    tasks.push(updateAmazonInventory(process.env.AMAZON_SELLER_ID!, sku, quantity)
      .catch(err => console.error(`Amazon sync failed for ${sku}:`, err)));
  }

  if (source !== 'ebay') {
    tasks.push(ebayClient.updateInventoryItem(sku, quantity)
      .catch(err => console.error(`eBay sync failed for ${sku}:`, err)));
  }

  // Run all syncs in parallel; individual failures logged but don't block others
  await Promise.allSettled(tasks);
}
```

## Best Practices

- **Set a safety stock buffer for each channel** — never expose 100% of your inventory to marketplaces; reserve a buffer for your own store and to absorb sync lag
- **Implement idempotent order imports** — use the marketplace order ID as a unique key; polling can return the same order multiple times; a unique constraint prevents duplicates
- **Acknowledge marketplace orders promptly** — Walmart requires acknowledgment within 4 hours; Amazon expects shipping confirmation within the promised delivery SLA; late responses result in account defect metrics
- **Respect marketplace-specific rate limits** — Amazon SP-API uses token bucket limits per operation; use exponential backoff and the Feeds API for bulk inventory updates (thousands of SKUs) instead of individual calls
- **Monitor listing health, not just sync status** — track listing suppression, buy box win rate, and account health per marketplace; suppressed listings cost revenue

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Amazon listing succeeds but goes inactive | Check for listing suppressions in the Listings API response; common causes include missing required attributes for the product type |
| Inventory oversells due to sync lag | Set a safety stock buffer in your marketplace app settings; always run a final inventory check at checkout |
| SP-API returns `QuotaExceeded` | Each SP-API operation has separate rate limits; use the Feeds API for bulk inventory updates instead of individual PATCH calls |
| Shopify marketplace app not importing orders | Check that the app has **Write** permissions for Orders in your Shopify admin under **Apps → App permissions** |
| eBay listing rejected for policy violation | Pre-screen product titles for restricted terms before automating; review eBay's Prohibited Items policy |

## Related Skills

- @webhook-architecture
- @product-information-management
- @erp-integration
- @monitoring-alerting-commerce
