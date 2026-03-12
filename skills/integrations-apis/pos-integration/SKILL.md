---
name: pos-integration
description: "Point-of-sale integration with online inventory and unified order management"
category: integrations-apis
risk: critical
source: curated
date_added: "2026-03-12"
tags: [pos, point-of-sale, omnichannel, inventory-sync, square, shopify-pos]
triggers: ["integrate POS", "connect point of sale", "unified inventory"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# POS Integration

## Overview

Point-of-sale integration connects your physical retail operations with your online store, enabling unified inventory visibility, centralized order management, and consistent customer profiles across channels. When a customer buys in-store, the online store must reflect the updated inventory immediately; when they return an online order in-store, the refund must flow back to the payment gateway. This skill covers integrating Square and Shopify POS systems with a headless commerce backend, synchronizing inventory in real time, and handling cross-channel returns.

## When to Use This Skill

- When opening a physical retail location alongside an existing online store
- When inventory discrepancies between in-store and online are causing oversells
- When customers expect to return online purchases in-store (omnichannel returns)
- When building a custom kiosk or tablet-based POS application
- When franchised or multi-location retail needs unified inventory and reporting

## Core Instructions

1. **Set up Square POS API integration**

   Square provides a REST API for catalog, inventory, and payment management:

   ```typescript
   // lib/pos/square-client.ts
   import {Client, Environment} from 'square';

   export const squareClient = new Client({
     accessToken: process.env.SQUARE_ACCESS_TOKEN!,
     environment: process.env.NODE_ENV === 'production'
       ? Environment.Production
       : Environment.Sandbox,
   });

   export const {
     catalogApi,
     inventoryApi,
     ordersApi,
     paymentsApi,
     customersApi,
     locationsApi,
   } = squareClient;

   // Get all locations (stores)
   export async function getLocations() {
     const {result} = await locationsApi.listLocations();
     return result.locations ?? [];
   }
   ```

2. **Sync product catalog from your PIM/commerce platform to Square**

   Square uses a catalog with CatalogItems, CatalogItemVariations, and CatalogInventory:

   ```typescript
   // lib/pos/catalog-sync.ts
   import {catalogApi} from './square-client';
   import type {CatalogObject} from 'square';

   export async function syncProductToSquare(product: Product) {
     // Build a batch of catalog objects: item + variations
     const catalogObjects: CatalogObject[] = [
       {
         type: 'ITEM',
         id: `#item_${product.sku}`, // # prefix indicates a new object (Square assigns real IDs)
         itemData: {
           name: product.name,
           description: product.description?.substring(0, 500), // Square limit: 500 chars
           variations: product.variants.map(variant => ({
             type: 'ITEM_VARIATION' as const,
             id: `#var_${variant.sku}`,
             itemVariationData: {
               itemId: `#item_${product.sku}`,
               name: variant.name,
               sku: variant.sku,
               pricingType: 'FIXED_PRICING',
               priceMoney: {
                 amount: BigInt(Math.round(variant.price * 100)),
                 currency: 'USD',
               },
               trackInventory: true,
             },
           })),
           productType: 'REGULAR',
           labelColor: 'E9E9E9',
         },
       },
     ];

     const {result} = await catalogApi.batchUpsertCatalogObjects({
       idempotencyKey: `sync_${product.sku}_${Date.now()}`,
       batches: [{objects: catalogObjects}],
     });

     // Map Square-assigned IDs back to your products
     const idMapping = result.idMappings ?? [];
     for (const mapping of idMapping) {
       if (mapping.clientObjectId?.startsWith('#var_')) {
         const sku = mapping.clientObjectId.replace('#var_', '');
         await db.variants.update(sku, {squareCatalogVariationId: mapping.objectId});
       }
     }

     return result;
   }
   ```

3. **Subscribe to Square inventory webhooks**

   When a sale occurs in-store, Square fires an `inventory.count.updated` event:

   ```typescript
   // app/api/webhooks/square/route.ts
   import {createHmac} from 'node:crypto';
   import {NextRequest, NextResponse} from 'next/server';

   export async function POST(req: NextRequest) {
     const rawBody = Buffer.from(await req.arrayBuffer());
     const signature = req.headers.get('x-square-hmacsha256-signature') ?? '';
     const notificationUrl = `${process.env.APP_URL}/api/webhooks/square`;

     // Verify signature
     const expected = createHmac('sha256', process.env.SQUARE_WEBHOOK_SECRET!)
       .update(notificationUrl + rawBody.toString('utf8'))
       .digest('base64');

     if (signature !== expected) {
       return NextResponse.json({error: 'Invalid signature'}, {status: 401});
     }

     const event = JSON.parse(rawBody.toString('utf8'));

     switch (event.type) {
       case 'inventory.count.updated':
         await handleInventoryUpdate(event.data.object);
         break;
       case 'payment.completed':
         await handleSquarePayment(event.data.object);
         break;
       case 'refund.created':
         await handleSquareRefund(event.data.object);
         break;
       case 'catalog.version.updated':
         await syncCatalogFromSquare();
         break;
     }

     return NextResponse.json({accepted: true});
   }

   async function handleInventoryUpdate(inventoryEvent: any) {
     const counts = inventoryEvent.inventory_counts ?? [];

     for (const count of counts) {
       const {catalog_object_id: variationId, quantity, location_id: locationId} = count;

       // Find the SKU mapped to this Square variation ID
       const variant = await db.variants.findBySquareCatalogId(variationId);
       if (!variant) continue;

       // Update total inventory across all channels
       await db.inventory.updateLocationQuantity(variant.sku, locationId, parseInt(quantity));

       // Recalculate total available quantity (all locations)
       const total = await db.inventory.getTotalAvailable(variant.sku);

       // Sync the new total to your online store
       await syncInventoryAcrossChannels({sku: variant.sku, quantity: total, source: 'pos'});
     }
   }
   ```

4. **Pull Square inventory for initial stock reconciliation**

   ```typescript
   // lib/pos/inventory-sync.ts
   export async function reconcileInventoryFromSquare() {
     const locations = await getLocations();

     for (const location of locations) {
       const {result} = await inventoryApi.retrieveInventoryCounts(undefined, location.id);
       const counts = result.counts ?? [];

       for (const count of counts) {
         const {catalogObjectId, quantity, locationId} = count;
         if (!catalogObjectId || !quantity) continue;

         const variant = await db.variants.findBySquareCatalogId(catalogObjectId);
         if (!variant) continue;

         await db.inventory.setLocationQuantity(
           variant.sku,
           locationId!,
           parseInt(quantity)
         );
       }

       console.log(`Reconciled inventory for ${location.name}: ${counts.length} items`);
     }

     // Recalculate online available quantity as SUM(all locations) - safety stock
     await db.inventory.recalculateTotalAvailable();
   }
   ```

5. **Handle cross-channel returns (online order returned in-store)**

   ```typescript
   // lib/pos/returns.ts
   export async function processInStoreReturn(params: {
     orderId: string;
     lineItems: Array<{lineItemId: string; quantity: number; reason: string}>;
     locationId: string;
   }) {
     const {orderId, lineItems, locationId} = params;

     // 1. Find the original online order
     const order = await db.orders.findById(orderId);
     if (!order) throw new Error(`Order ${orderId} not found`);
     if (order.status === 'fully_refunded') throw new Error('Order already fully refunded');

     // 2. Validate line items being returned
     for (const item of lineItems) {
       const orderLine = order.lineItems.find(l => l.id === item.lineItemId);
       if (!orderLine) throw new Error(`Line item ${item.lineItemId} not on order`);
       if (item.quantity > orderLine.returnableQuantity) {
         throw new Error(`Cannot return ${item.quantity} — only ${orderLine.returnableQuantity} returnable`);
       }
     }

     // 3. Issue refund via the original payment gateway
     const refundAmount = lineItems.reduce((sum, item) => {
       const line = order.lineItems.find(l => l.id === item.lineItemId)!;
       return sum + (line.unitPriceCents * item.quantity);
     }, 0);

     let gatewayRefund;
     if (order.paymentGateway === 'stripe') {
       gatewayRefund = await stripe.refunds.create({
         payment_intent: order.stripePaymentIntentId,
         amount: refundAmount,
         metadata: {orderId, locationId, channel: 'in_store_return'},
       });
     } else if (order.paymentGateway === 'square') {
       const {result} = await paymentsApi.createPaymentRefund({
         idempotencyKey: `return_${orderId}_${Date.now()}`,
         paymentId: order.squarePaymentId,
         amountMoney: {amount: BigInt(refundAmount), currency: 'USD'},
         reason: 'In-store return',
       });
       gatewayRefund = result.refund;
     }

     // 4. Update order return status
     await db.orders.addReturn({
       orderId,
       lineItems: lineItems.map(item => ({...item, refundedAmountCents: item.quantity * order.lineItems.find(l => l.id === item.lineItemId)!.unitPriceCents})),
       gatewayRefundId: gatewayRefund?.id,
       processedAt: new Date(),
       processedAtLocation: locationId,
     });

     // 5. Restock returned items at the return location
     for (const item of lineItems) {
       const line = order.lineItems.find(l => l.id === item.lineItemId)!;
       await db.inventory.incrementLocationQuantity(line.sku, locationId, item.quantity);
       await syncInventoryAcrossChannels({sku: line.sku, quantity: await db.inventory.getTotalAvailable(line.sku), source: 'pos'});
     }

     return {refundAmount, gatewayRefundId: gatewayRefund?.id};
   }
   ```

6. **Build a unified order dashboard across channels**

   ```typescript
   // lib/pos/unified-orders.ts
   export async function getUnifiedOrders(dateRange: {start: Date; end: Date}, locationFilter?: string) {
     // Fetch from all order sources in parallel
     const [onlineOrders, squareOrders] = await Promise.all([
       db.orders.findByDateRange(dateRange, {channel: 'online', locationId: locationFilter}),
       fetchSquareOrders(dateRange, locationFilter),
     ]);

     const unified = [
       ...onlineOrders.map(o => ({
         ...o,
         channel: 'online' as const,
         source: 'headless_store',
       })),
       ...squareOrders.map(o => mapSquareOrderToUnified(o)),
     ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

     return unified;
   }

   async function fetchSquareOrders(dateRange: {start: Date; end: Date}, locationId?: string) {
     const {result} = await ordersApi.searchOrders({
       locationIds: locationId ? [locationId] : (await getLocations()).map(l => l.id!),
       query: {
         filter: {
           dateTimeFilter: {
             createdAt: {
               startAt: dateRange.start.toISOString(),
               endAt: dateRange.end.toISOString(),
             },
           },
         },
       },
     });
     return result.orders ?? [];
   }
   ```

## Examples

### Square Webhook subscription registration

```typescript
// Register webhooks programmatically via the Square API
const {result} = await squareClient.webhookSubscriptionsApi.createWebhookSubscription({
  subscription: {
    name: 'Commerce Platform Events',
    enabled: true,
    notificationUrl: `${process.env.APP_URL}/api/webhooks/square`,
    eventTypes: [
      'inventory.count.updated',
      'catalog.version.updated',
      'payment.completed',
      'refund.created',
      'order.created',
    ],
  },
});
console.log('Subscription created:', result.subscription?.id);
```

### Shopify POS inventory sync using Shopify Admin API

```typescript
// Shopify POS shares inventory with the online store through Shopify's native inventory system
// Use the Admin API to sync inventory levels across all locations

export async function syncShopifyInventory(inventoryItemId: string, locationId: string, available: number) {
  const mutation = `
    mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup {
          createdAt
          reason
          changes {
            name
            delta
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          reason: 'correction',
          setQuantities: [{inventoryItemId, locationId, quantity: available}],
        },
      },
    }),
  });

  return res.json();
}
```

## Best Practices

- **Use Square's built-in catalog as the POS source of truth** — sync your commerce catalog to Square rather than building a parallel catalog; this ensures the POS always has current product data
- **Reserve a safety stock buffer for the online store** — never expose 100% of physical inventory online; reserve 10–20% as a buffer for in-store sales that happen faster than inventory sync can propagate
- **Implement location-aware inventory** — track inventory per location (store), not just as a global total; this enables accurate click-and-collect availability and prevents allocating stock from the wrong store
- **Use idempotency keys for all Square API mutations** — Square's API supports idempotency keys on orders and payments; use them to safely retry failed requests without creating duplicates
- **Monitor inventory sync lag** — measure the time between a POS sale and the inventory update appearing in your online store; alert when lag exceeds 5 minutes
- **Build a manual reconciliation tool** — inventory discrepancies happen; provide a UI for store managers to compare Square inventory counts with your system and trigger manual sync
- **Handle the "buy online, return anywhere" policy carefully** — cross-channel returns require careful payment gateway handling; ensure the refund goes back to the original payment method even if processed at a different store

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Inventory oversell due to sync lag | Reserve safety stock online; implement a final inventory check at checkout that calls Square's inventory API synchronously for high-demand items |
| Square catalog IDs diverge from your SKUs | Maintain a mapping table between your internal SKU and Square's catalog variation IDs; rebuild it from Square's catalog if it gets out of sync |
| Webhook signature verification fails | Square's HMAC includes the full notification URL; ensure the URL used in verification exactly matches what Square sees, including protocol and path |
| Cross-channel return creates duplicate inventory | Only restock inventory when the return is physically received in-store (status: `received`), not when the return is initiated |
| Multi-location inventory shows wrong totals | Aggregate inventory from all locations but exclude locations that are temporarily closed or undergoing inventory counts |

## Related Skills

- @marketplace-connectors
- @webhook-architecture
- @inventory-management
- @flash-sale-scaling
- @monitoring-alerting-commerce
