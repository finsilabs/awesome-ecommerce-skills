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
platforms: [platform-agnostic]
difficulty: advanced
---

# Marketplace Connectors

## Overview

Selling across Amazon, eBay, and Walmart Marketplace multiplies your sales channel reach but introduces operational complexity: each marketplace has its own product data model, listing requirements, order lifecycle, and inventory management API. This skill covers building marketplace connectors using the Amazon Selling Partner API (SP-API), eBay Trading/REST APIs, and Walmart Marketplace API — including product listing, inventory synchronization, and order import pipelines.

## When to Use This Skill

- When expanding sales channels beyond your own storefront to major marketplace platforms
- When building a multichannel commerce system that keeps inventory in sync across channels
- When automating order imports from marketplaces into your OMS or ERP
- When existing marketplace feeds are manual (spreadsheet uploads) and need automation
- When investigating marketplace integration libraries and deciding on an implementation approach

## Core Instructions

1. **Set up Amazon SP-API authentication**

   Amazon's Selling Partner API uses Login with Amazon (LWA) OAuth with role-based IAM permissions:

   ```typescript
   // lib/amazon/auth.ts
   interface SPAPITokens {
     accessToken: string;
     expiresAt: number;
   }

   let tokenCache: SPAPITokens | null = null;

   export async function getAccessToken(): Promise<string> {
     // Return cached token if valid
     if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
       return tokenCache.accessToken;
     }

     const res = await fetch('https://api.amazon.com/auth/o2/token', {
       method: 'POST',
       headers: {'Content-Type': 'application/x-www-form-urlencoded'},
       body: new URLSearchParams({
         grant_type: 'refresh_token',
         refresh_token: process.env.AMAZON_REFRESH_TOKEN!,
         client_id: process.env.AMAZON_CLIENT_ID!,
         client_secret: process.env.AMAZON_CLIENT_SECRET!,
       }),
     });

     const data = await res.json();
     tokenCache = {
       accessToken: data.access_token,
       expiresAt: Date.now() + data.expires_in * 1000,
     };
     return tokenCache.accessToken;
   }

   // SP-API requests require AWS Signature Version 4
   import {SignatureV4} from '@smithy/signature-v4';
   import {Sha256} from '@aws-crypto/sha256-js';

   const signerV4 = new SignatureV4({
     service: 'execute-api',
     region: 'us-east-1',
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
       sessionToken: process.env.AWS_SESSION_TOKEN,
     },
     sha256: Sha256,
   });

   export async function callSPAPI(path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' = 'GET', body?: object) {
     const accessToken = await getAccessToken();
     const url = new URL(`https://sellingpartnerapi-na.amazon.com${path}`);

     const request = new Request(url.toString(), {
       method,
       headers: {
         'x-amz-access-token': accessToken,
         'Content-Type': 'application/json',
       },
       body: body ? JSON.stringify(body) : undefined,
     });

     const signed = await signerV4.sign(request as any);
     return fetch(signed as any);
   }
   ```

2. **Create or update product listings on Amazon**

   ```typescript
   // lib/amazon/listings.ts

   interface AmazonListing {
     sku: string;
     asin?: string;
     productType: string;
     attributes: Record<string, any>;
   }

   // Use Listings Items API for modern listing management
   export async function putListing(sellerId: string, listing: AmazonListing) {
     const res = await callSPAPI(
       `/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(listing.sku)}`,
       'PUT',
       {
         productType: listing.productType,
         requirements: 'LISTING',
         attributes: {
           item_name: [{value: listing.attributes.title, language_tag: 'en_US', marketplace_id: 'ATVPDKIKX0DER'}],
           brand: [{value: listing.attributes.brand, language_tag: 'en_US', marketplace_id: 'ATVPDKIKX0DER'}],
           bullet_point: listing.attributes.bulletPoints.map((bp: string) => ({
             value: bp,
             language_tag: 'en_US',
             marketplace_id: 'ATVPDKIKX0DER',
           })),
           list_price: [{
             value: listing.attributes.price,
             currency: 'USD',
             marketplace_id: 'ATVPDKIKX0DER',
           }],
         },
       }
     );

     if (!res.ok) {
       const error = await res.json();
       throw new Error(`Amazon listing failed: ${JSON.stringify(error.errors)}`);
     }

     return res.json();
   }

   // Update inventory quantity
   export async function updateInventory(sellerId: string, sku: string, quantity: number) {
     return callSPAPI(
       `/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}`,
       'PATCH',
       {
         productType: 'PRODUCT',
         patches: [{
           op: 'replace',
           path: '/attributes/fulfillment_availability',
           value: [{
             fulfillment_channel_code: 'DEFAULT',
             quantity,
             marketplace_id: 'ATVPDKIKX0DER',
           }],
         }],
       }
     );
   }
   ```

3. **Import orders from Amazon**

   ```typescript
   // lib/amazon/orders.ts
   export async function fetchNewOrders(sellerId: string, createdAfter: Date) {
     const params = new URLSearchParams({
       MarketplaceIds: 'ATVPDKIKX0DER',
       CreatedAfter: createdAfter.toISOString(),
       OrderStatuses: 'Unshipped,PartiallyShipped',
       FulfillmentChannels: 'MFN', // Merchant Fulfilled Network
     });

     const res = await callSPAPI(`/orders/v0/orders?${params}`);
     const data = await res.json();
     return data.payload.Orders;
   }

   export async function getOrderItems(amazonOrderId: string) {
     const res = await callSPAPI(`/orders/v0/orders/${amazonOrderId}/orderItems`);
     const data = await res.json();
     return data.payload.OrderItems;
   }

   // Map Amazon order to your internal order format
   export function mapAmazonOrderToInternal(amazonOrder: any, items: any[]): InternalOrder {
     return {
       externalId: amazonOrder.AmazonOrderId,
       channel: 'amazon',
       status: 'pending',
       placedAt: new Date(amazonOrder.PurchaseDate),
       customer: {
         email: amazonOrder.BuyerInfo.BuyerEmail,
         name: amazonOrder.ShippingAddress?.Name,
       },
       shippingAddress: {
         name: amazonOrder.ShippingAddress?.Name,
         street: amazonOrder.ShippingAddress?.AddressLine1,
         city: amazonOrder.ShippingAddress?.City,
         state: amazonOrder.ShippingAddress?.StateOrRegion,
         postalCode: amazonOrder.ShippingAddress?.PostalCode,
         country: amazonOrder.ShippingAddress?.CountryCode,
       },
       lineItems: items.map(item => ({
         externalLineId: item.OrderItemId,
         sku: item.SellerSKU,
         name: item.Title,
         quantity: parseInt(item.QuantityOrdered),
         unitPrice: parseFloat(item.ItemPrice.Amount),
         currency: item.ItemPrice.CurrencyCode,
       })),
       shippingCost: parseFloat(amazonOrder.ShippingServiceLevel || '0'),
       currency: 'USD',
     };
   }
   ```

4. **Sync inventory across channels in real time**

   When inventory changes on any channel, sync to all others:

   ```typescript
   // lib/inventory/multichannel-sync.ts
   interface InventoryUpdate {
     sku: string;
     quantity: number;
     source: 'internal' | 'amazon' | 'ebay' | 'walmart';
   }

   export async function syncInventoryAcrossChannels(update: InventoryUpdate) {
     const {sku, quantity, source} = update;

     // Update internal inventory first
     if (source !== 'internal') {
       await db.inventory.update(sku, quantity);
     }

     // Sync to all channels except the source to avoid loops
     const syncTasks = [];

     if (source !== 'amazon') {
       syncTasks.push(
         updateInventory(process.env.AMAZON_SELLER_ID!, sku, quantity)
           .catch(err => console.error(`Amazon sync failed for ${sku}:`, err))
       );
     }

     if (source !== 'ebay') {
       syncTasks.push(
         ebayApi.updateInventoryItem(sku, quantity)
           .catch(err => console.error(`eBay sync failed for ${sku}:`, err))
       );
     }

     if (source !== 'walmart') {
       syncTasks.push(
         walmartApi.updateInventory(sku, quantity)
           .catch(err => console.error(`Walmart sync failed for ${sku}:`, err))
       );
     }

     // Run all syncs in parallel; individual failures logged but don't block
     await Promise.allSettled(syncTasks);
   }
   ```

5. **Integrate eBay REST API for listings**

   ```typescript
   // lib/ebay/client.ts
   export class EbayClient {
     private accessToken: string | null = null;
     private tokenExpiry: number = 0;

     async getToken(): Promise<string> {
       if (this.accessToken && this.tokenExpiry > Date.now() + 60000) {
         return this.accessToken;
       }

       const credentials = Buffer.from(
         `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
       ).toString('base64');

       const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
         method: 'POST',
         headers: {
           'Authorization': `Basic ${credentials}`,
           'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
       });

       const data = await res.json();
       this.accessToken = data.access_token;
       this.tokenExpiry = Date.now() + data.expires_in * 1000;
       return this.accessToken!;
     }

     async createOrReplaceInventoryItem(sku: string, product: Product) {
       const token = await this.getToken();
       return fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
         method: 'PUT',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Language': 'en-US',
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           product: {
             title: product.name,
             description: product.descriptionHtml,
             imageUrls: product.images.map(i => i.url),
             aspects: {'Brand': [product.brand], 'Color': product.attributes.color ?? []},
           },
           condition: 'NEW',
           availability: {
             shipToLocationAvailability: {quantity: product.stockQuantity},
           },
         }),
       });
     }
   }
   ```

6. **Set up automated order polling with a queue**

   ```typescript
   // Poll each marketplace for new orders and enqueue for processing
   // Use a cron job or EventBridge rule to run every 5 minutes

   export async function pollMarketplaceOrders() {
     const lastPolledAt = await db.syncState.getLastPolled('amazon') ?? new Date(Date.now() - 3600_000);

     const amazonOrders = await fetchNewOrders(process.env.AMAZON_SELLER_ID!, lastPolledAt);

     for (const amazonOrder of amazonOrders) {
       const existingOrder = await db.orders.findByExternalId(amazonOrder.AmazonOrderId);
       if (existingOrder) continue; // Already imported

       const items = await getOrderItems(amazonOrder.AmazonOrderId);
       const internalOrder = mapAmazonOrderToInternal(amazonOrder, items);

       // Queue for processing (deduplication via external ID)
       await orderQueue.add('import-order', internalOrder, {
         jobId: `amazon-${amazonOrder.AmazonOrderId}`, // Deduplicates
       });
     }

     await db.syncState.updateLastPolled('amazon', new Date());
     console.log(`Imported ${amazonOrders.length} new Amazon orders`);
   }
   ```

## Examples

### Amazon SP-API feed submission for bulk listings

```typescript
// For large catalogs, use Feeds API for bulk operations
export async function submitInventoryFeed(sellerId: string, updates: Array<{sku: string; quantity: number}>) {
  // 1. Create feed document
  const docRes = await callSPAPI('/feeds/2021-06-30/documents', 'POST', {contentType: 'text/tab-separated-values'});
  const {feedDocumentId, url} = await docRes.json();

  // 2. Build TSV feed content
  const tsv = ['sku\tquantity', ...updates.map(u => `${u.sku}\t${u.quantity}`)].join('\n');

  // 3. Upload to pre-signed S3 URL
  await fetch(url, {method: 'PUT', body: tsv, headers: {'Content-Type': 'text/tab-separated-values'}});

  // 4. Submit the feed
  const feedRes = await callSPAPI('/feeds/2021-06-30/feeds', 'POST', {
    feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
    marketplaceIds: ['ATVPDKIKX0DER'],
    inputFeedDocumentId: feedDocumentId,
  });
  const {feedId} = await feedRes.json();

  // 5. Poll for completion (feeds process asynchronously)
  return feedId;
}
```

### Walmart Marketplace order acknowledgment

```typescript
// Walmart requires order acknowledgment within 4 hours
export async function acknowledgeWalmartOrder(purchaseOrderId: string, lineItems: any[]) {
  const ackBody = {
    orderAcknowledgement: {
      purchaseOrderId,
      acknowledgementDate: new Date().toISOString(),
      acknowledgedOrders: lineItems.map(item => ({
        lineNumber: item.lineNumber,
        sellerOrderId: `MYSTORE-${purchaseOrderId}`,
        shipDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      })),
    },
  };

  return fetch(`https://marketplace.walmartapis.com/v3/orders/${purchaseOrderId}/acknowledge`, {
    method: 'POST',
    headers: {
      'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      'WM_CONSUMER.ID': process.env.WALMART_CONSUMER_ID!,
      'Authorization': `Basic ${Buffer.from(`${process.env.WALMART_CLIENT_ID}:${process.env.WALMART_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ackBody),
  });
}
```

## Best Practices

- **Decouple inventory sync from order processing** — use a message queue for both; if Amazon's API is slow, it should not block order processing on your own storefront
- **Implement idempotent order imports** — use the marketplace order ID as a unique key; polling may return the same order multiple times; a unique constraint prevents duplicate orders
- **Handle marketplace-specific product data requirements** — Amazon requires product type-specific attributes (e.g., `parent_product_type` for clothing); build a mapping layer from your canonical product model to each marketplace's schema
- **Respect rate limits for each marketplace API** — Amazon SP-API uses a token bucket system with per-operation limits; implement exponential backoff and queue burst operations
- **Acknowledge marketplace orders promptly** — Walmart requires acknowledgment within 4 hours; Amazon expects shipping confirmation within the SLA; late responses result in account defect metrics
- **Monitor listing health metrics** — track listing suppression, buy box win rate, and account health scores per marketplace; unhealthy listings cost more in lost revenue than the engineering effort to maintain them
- **Build a reconciliation job** — compare your internal inventory with each marketplace's reported inventory daily; discrepancies indicate sync failures that need investigation

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Amazon listing submission succeeds but listing is inactive | Check for listing suppressions in the Listings API response; common causes include missing required attributes for the product type |
| Inventory oversell on marketplace | Always subtract safety stock from available quantity before sending to marketplaces; reserve a buffer for your own storefront |
| SP-API returns `QuotaExceeded` | Each SP-API operation has separate rate limits; implement per-operation rate limiters and use the Feeds API for bulk updates instead of individual item calls |
| eBay listing rejected for policy violation | Review eBay's prohibited items policy and listing policies before automating; pre-screen product titles and descriptions for restricted terms |
| Walmart order not acknowledged within SLA | Implement a monitor that alerts if any Walmart order is unacknowledged after 2 hours; automate acknowledgment even if fulfillment is manual |

## Related Skills

- @webhook-architecture
- @product-information-management
- @pos-integration
- @monitoring-alerting-commerce
- @inventory-management
