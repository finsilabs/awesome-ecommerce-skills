---
name: pos-integration
description: "Connect your physical point-of-sale system to your online store for unified inventory, shared customer records, and omnichannel order management"
category: integrations-apis
risk: critical
source: curated
date_added: "2026-03-12"
tags: [pos, point-of-sale, omnichannel, inventory-sync, square, shopify-pos]
triggers: ["integrate POS", "connect point of sale", "unified inventory"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# POS Integration

## Overview

Point-of-sale integration connects your physical retail operations with your online store, enabling unified inventory visibility, centralized order management, and consistent customer profiles across channels. When a customer buys in-store, the online store must reflect the updated inventory immediately; when they return an online order in-store, the refund must flow back to the payment gateway. This skill covers connecting Square and Shopify POS to your commerce platform, synchronizing inventory in real time, and handling cross-channel returns.

## When to Use This Skill

- When opening a physical retail location alongside an existing online store
- When inventory discrepancies between in-store and online are causing oversells
- When customers expect to return online purchases in-store (omnichannel returns)
- When franchised or multi-location retail needs unified inventory and reporting
- When building a custom kiosk or tablet-based POS application

## Core Instructions

### Step 1: Determine your platform and POS integration path

| Platform | Easiest POS Integration | What Gets Unified |
|----------|------------------------|------------------|
| **Shopify** | **Shopify POS** (built-in, $89/month for Pro) — designed to work with Shopify's online store natively | Inventory syncs instantly between POS and online store; orders appear in unified admin; customer profiles and loyalty points unified |
| **WooCommerce** | **Square** + WooCommerce Square plugin (free) | Inventory syncs bidirectionally; Square POS sales update WooCommerce stock; orders can be imported into WooCommerce |
| **BigCommerce** | **Square** + BigCommerce Square integration | Same as WooCommerce but configured in BigCommerce's channel settings; BigCommerce also supports Stripe Terminal directly |
| **Custom / Headless** | **Square API** or **Stripe Terminal** | Full control — sync inventory via webhooks, import POS orders via API, build unified order dashboard |

### Step 2: Platform-specific POS setup

---

#### Shopify + Shopify POS

Shopify POS is the most seamless option for Shopify stores since inventory is managed in a single system:

1. **Subscribe to Shopify POS Pro** ($89/month or included in Shopify Plus):
   - Go to **Point of Sale → Devices** in your Shopify admin
   - Install the Shopify POS app on your iPad or iPhone
   - Connect a card reader (Shopify provides its own Tap & Chip reader)

2. **Set up locations for each store:**
   - Go to **Settings → Locations** and click **Add location** for each physical store
   - Assign inventory quantities per location — Shopify tracks stock at each location separately

3. **Inventory automatically stays in sync:**
   - A sale in the POS app immediately decrements inventory for that location
   - The online store can be configured to sell from multiple locations (go to **Settings → Shipping and delivery → Local pickup** to configure)

4. **Configure click-and-collect (Buy Online, Pick Up In Store):**
   - Go to **Settings → Shipping and delivery → Local pickup** and enable it for each location
   - Customers select their pickup location at checkout; the order appears in that store's POS app under **Pickups**

---

#### WooCommerce + Square

**Connect Square to WooCommerce:**

1. Install the **WooCommerce Square** plugin (free, developed by Square) from wordpress.org
2. Go to **WooCommerce → Settings → Integrations → Square** and click **Connect with Square**
3. Log in to your Square account and select your Square business location
4. In the Square plugin settings, enable **Sync inventory** (bidirectional)
5. Run the initial sync: go to **WooCommerce → System Status → Tools → Sync Products with Square**

**How inventory sync works:**

- When you sell a product in your Square POS, WooCommerce stock decrements automatically (within minutes via webhook)
- When WooCommerce receives an online order, Square stock decrements
- Go to **WooCommerce → Square → Sync Log** to see sync history and troubleshoot discrepancies

**Handle in-store returns of online orders:**

- Returns initiated in WooCommerce admin automatically sync to Square if the original payment used Square
- For Stripe-paid online orders returned in-store: process the refund in Square and reconcile in WooCommerce manually, or build a custom refund endpoint (see Custom section below)

---

#### BigCommerce + Square

1. Go to **Channel Manager** in your BigCommerce admin and click **+ Create New Channel**
2. Select **Square** from the channel list
3. Authorize BigCommerce to connect to your Square account
4. Configure inventory sync settings — BigCommerce and Square will sync stock levels bidirectionally
5. Square POS orders can be imported into BigCommerce for unified reporting

---

#### Custom / Headless + Square API

**Initialize the Square client:**

```typescript
// lib/pos/square-client.ts
import { Client, Environment } from 'square';

export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
});

export const { catalogApi, inventoryApi, ordersApi, paymentsApi, locationsApi } = squareClient;
```

**Handle Square inventory webhooks (in-store sale → update online store):**

```typescript
// POST /api/webhooks/square
import { createHmac } from 'node:crypto';

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('x-square-hmacsha256-signature') ?? '';

  // Square HMAC includes the full notification URL in the signature
  const notificationUrl = `${process.env.APP_URL}/api/webhooks/square`;
  const expected = createHmac('sha256', process.env.SQUARE_WEBHOOK_SECRET!)
    .update(notificationUrl + rawBody.toString('utf8'))
    .digest('base64');

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody.toString('utf8'));

  if (event.type === 'inventory.count.updated') {
    const counts = event.data.object.inventory_counts ?? [];
    for (const count of counts) {
      const variant = await db.variants.findBySquareCatalogId(count.catalog_object_id);
      if (!variant) continue;

      await db.inventory.updateLocationQuantity(variant.sku, count.location_id, parseInt(count.quantity));
      const total = await db.inventory.getTotalAvailable(variant.sku);
      await redis.setex(`inventory:${variant.productId}`, 3600, String(total));
    }
  }

  return NextResponse.json({ accepted: true });
}
```

**Handle cross-channel returns (online order returned in-store):**

```typescript
// lib/pos/returns.ts
export async function processInStoreReturn(params: {
  orderId: string;
  lineItems: Array<{ lineItemId: string; quantity: number }>;
  locationId: string;
}) {
  const { orderId, lineItems, locationId } = params;
  const order = await db.orders.findById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Calculate refund amount
  const refundAmount = lineItems.reduce((sum, item) => {
    const line = order.lineItems.find(l => l.id === item.lineItemId)!;
    return sum + (line.unitPriceCents * item.quantity);
  }, 0);

  // Issue refund via original payment gateway
  if (order.paymentGateway === 'stripe') {
    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: refundAmount,
      metadata: { orderId, locationId, channel: 'in_store_return' },
    });
  } else if (order.paymentGateway === 'square') {
    await paymentsApi.createPaymentRefund({
      idempotencyKey: `return_${orderId}_${Date.now()}`,
      paymentId: order.squarePaymentId!,
      amountMoney: { amount: BigInt(refundAmount), currency: 'USD' },
    });
  }

  // Restock returned items at the return location
  for (const item of lineItems) {
    const line = order.lineItems.find(l => l.id === item.lineItemId)!;
    await db.inventory.incrementLocationQuantity(line.sku, locationId, item.quantity);
  }

  await db.orders.addReturn({ orderId, lineItems, processedAtLocation: locationId, processedAt: new Date() });
}
```

**Sync your product catalog to Square** (required before Square can track inventory):

```typescript
export async function syncProductToSquare(product: Product) {
  const { result } = await catalogApi.batchUpsertCatalogObjects({
    idempotencyKey: `sync_${product.sku}_${Date.now()}`,
    batches: [{
      objects: [{
        type: 'ITEM',
        id: `#item_${product.sku}`,
        itemData: {
          name: product.name,
          variations: product.variants.map(variant => ({
            type: 'ITEM_VARIATION' as const,
            id: `#var_${variant.sku}`,
            itemVariationData: {
              itemId: `#item_${product.sku}`,
              name: variant.name,
              sku: variant.sku,
              pricingType: 'FIXED_PRICING',
              priceMoney: { amount: BigInt(Math.round(variant.price * 100)), currency: 'USD' },
              trackInventory: true,
            },
          })),
        },
      }],
    }],
  });

  // Store Square-assigned IDs for future inventory updates
  for (const mapping of result.idMappings ?? []) {
    if (mapping.clientObjectId?.startsWith('#var_')) {
      const sku = mapping.clientObjectId.replace('#var_', '');
      await db.variants.update(sku, { squareCatalogVariationId: mapping.objectId });
    }
  }
}
```

## Best Practices

- **For Shopify merchants, use Shopify POS** — it shares a single inventory system with your online store; no sync lag, no duplicate records, and unified reporting out of the box
- **Reserve a safety stock buffer for the online store** — never expose 100% of physical inventory online; reserve 10–20% as a buffer for in-store sales that happen faster than inventory sync can propagate
- **Implement location-aware inventory** — track stock per physical location (store), not just as a global total; this enables accurate click-and-collect availability
- **Monitor sync lag** — measure the time between a POS sale and the inventory update appearing online; alert when lag exceeds 5 minutes
- **Build a manual reconciliation tool** — inventory discrepancies happen; store managers need a UI to compare POS inventory counts with your system and trigger a manual sync

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| WooCommerce Square sync stops working | Re-authenticate the Square connection in **WooCommerce → Settings → Integrations → Square** — OAuth tokens expire; the plugin usually prompts for re-auth |
| Inventory oversell due to sync lag | Set safety stock buffer in your marketplace/POS settings; for high-demand items, do a final inventory check at checkout against Square's inventory API |
| Square catalog IDs diverge from your SKUs | Maintain a mapping table between your internal SKU and Square's catalog variation IDs; rebuild it from Square's catalog if it gets out of sync |
| Cross-channel return creates duplicate inventory | Only restock inventory when the return is physically received in-store (`status: received`), not when the return is initiated |
| Shopify POS not showing online orders for pickup | Ensure the customer selected **Pick up in store** at checkout and that the correct location is assigned to the POS device in **Settings → Locations** |

## Related Skills

- @marketplace-connectors
- @webhook-architecture
- @flash-sale-scaling
- @monitoring-alerting-commerce
