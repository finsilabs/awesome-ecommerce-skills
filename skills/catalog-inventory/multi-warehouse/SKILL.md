---
name: multi-warehouse
description: "Manage inventory across multiple warehouses with smart allocation rules, transfer orders between locations, and split-fulfillment routing"
category: catalog-inventory
risk: critical
source: curated
date_added: "2026-03-12"
tags: [warehouse, multi-location, fulfillment, allocation, transfer, split-shipment, 3pl]
triggers: ["multi warehouse", "multi location inventory", "warehouse allocation", "transfer order", "split fulfillment", "distributed inventory"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Multi-Warehouse Inventory

## Overview

Multi-warehouse inventory lets you stock products at multiple physical locations — warehouses, stores, 3PLs — and route each order to the location best positioned to fulfill it. Shopify and BigCommerce have multi-location inventory built in. WooCommerce needs a plugin. Only build a custom allocation engine if your routing logic (zone-based, cost-optimized, split fulfillment) exceeds what platform tools support.

## When to Use This Skill

- When a merchant operates more than one warehouse, store, or 3PL (third-party logistics) provider
- When shipping cost is significant and routing orders from the nearest warehouse matters
- When stock imbalance between locations requires transfer orders to redistribute inventory
- When orders must sometimes be split across two warehouses because no single location has all items

## Core Instructions

### Step 1: Determine platform and choose the right tool

| Platform | Built-in Multi-Location | Recommended Extension |
|----------|-----------------------|----------------------|
| **Shopify** | Yes — up to 1,000 locations (Basic: 4, Shopify plan: 5, Advanced: 8) | ShipBob or Flexport for 3PL fulfillment routing; ShipHero for advanced routing rules |
| **WooCommerce** | No — requires a plugin | ATUM Multi-Inventory (add-on) or WooCommerce Multi-Location Inventory by Iconic |
| **BigCommerce** | Yes — Multi-Location Inventory app (free) | ShipStation for advanced routing; Whiplash or ShipBob for 3PL integration |
| **Custom / Headless** | Build allocation engine with proximity-first routing | Required when no platform tools meet routing and split-fulfillment requirements |

---

### Step 2: Platform-specific setup

---

#### Shopify

Shopify has native multi-location inventory.

**Set up locations:**

1. Go to **Settings → Locations → Add location**
2. Add each warehouse, store, or fulfillment center
3. Enter the address (used for shipping rate calculation)
4. Assign products to each location — go to a product, click a variant, and set the quantity at each location

**Configure fulfillment routing:**

1. Go to **Settings → Shipping and delivery → Shipping**
2. Under **Fulfillment from**, set the priority order for your locations
3. Shopify routes orders to the first location in your priority list that has stock for all items
4. For more sophisticated routing (proximity-based, cost-optimized): install **ShipHero** or **ShipBob** from the App Store

**Transfer orders between locations:**

1. Go to **Inventory → Transfers → Create transfer**
2. Select the **Origin location** (where stock is coming from)
3. Select the **Destination location**
4. Add the products and quantities to transfer
5. When goods arrive, go to **Transfers → [Transfer] → Accept items** — Shopify automatically increments the destination and decrements the origin

**3PL integration:**
- For ShipBob: Install ShipBob from the App Store; ShipBob pulls orders from Shopify and routes to the nearest fulfillment center automatically
- For Flexport: Install the Flexport app; products and inventory sync bi-directionally

---

#### WooCommerce

WooCommerce requires a plugin for multi-location inventory.

**Option A: ATUM Multi-Inventory (recommended)**

1. Install **ATUM Inventory Management for WooCommerce** (free core) + **ATUM Multi-Inventory** add-on (paid)
2. In ATUM, go to **Multi-Inventory → Locations → Add Location**
3. For each product, go to the **ATUM Multi-Inventory** tab and assign quantities per location
4. Configure inventory selection rule (region-based, priority-based, or first-available)

**Option B: WooCommerce Multi-Location Inventory by Iconic**

1. Install the plugin
2. Go to **WooCommerce → Multi-Location Inventory → Locations** and add your warehouses
3. Edit each product and set per-location stock quantities
4. Configure fulfillment routing in the plugin settings

**Transfer orders:**
- ATUM Multi-Inventory includes a transfer order feature — go to **ATUM → Inventory Transfers → New Transfer**
- Set origin, destination, products, and quantities
- Mark as received to update stock automatically

---

#### BigCommerce

BigCommerce supports multi-location inventory via a free app.

**Enable Multi-Location Inventory:**

1. Go to **Apps → Search "Multi-Location Inventory"**
2. Install and launch the app
3. Add locations: **Locations → Add location** with name and address
4. Assign stock per product per location

**Configure fulfillment routing:**

1. In the Multi-Location Inventory app, go to **Routing Rules**
2. Set rules: ship from nearest, ship from cheapest, ship from location with most stock, etc.
3. BigCommerce generates split shipments automatically when an order can't be fulfilled from a single location

**For 3PL integration:**
- Install **ShipStation** from the BigCommerce App Marketplace
- ShipStation connects to your 3PL providers and routes based on your rules

---

#### Custom / Headless

For headless storefronts, build an allocation engine that selects the best location(s) for each order:

```typescript
// lib/allocation.ts
import { haversineDistance } from './geo';

interface OrderItem { variantId: string; quantity: number; productName: string; }
interface AllocationResult {
  type: 'single' | 'split';
  fulfillments: { locationId: string; items: OrderItem[] }[];
}

export async function allocateOrder(orderItems: OrderItem[], shippingAddress: Address): Promise<AllocationResult> {
  const locations = await db.locations.findMany({ where: { active: true } });

  // Fetch inventory availability for all required variants at all locations
  const inventory = await db.inventoryLevels.findMany({
    where: { variantId: { in: orderItems.map(i => i.variantId) } },
  });
  const invMap = buildInventoryMap(inventory); // locationId -> variantId -> available

  // Score locations by distance to shipping address (proximity-first routing)
  const scored = locations
    .map(loc => ({
      ...loc,
      distanceKm: haversineDistance({ lat: loc.lat, lng: loc.lng }, { lat: shippingAddress.lat, lng: shippingAddress.lng }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Prefer single-location fulfillment to avoid split shipments
  for (const location of scored) {
    const canFulfillAll = orderItems.every(item => (invMap[location.id]?.[item.variantId] ?? 0) >= item.quantity);
    if (canFulfillAll) return { type: 'single', fulfillments: [{ locationId: location.id, items: orderItems }] };
  }

  // Fall back to split fulfillment — greedy assignment to nearest location with stock
  const remaining = [...orderItems];
  const fulfillments: AllocationResult['fulfillments'] = [];

  for (const location of scored) {
    const canFulfill = remaining.filter(item => (invMap[location.id]?.[item.variantId] ?? 0) >= item.quantity);
    if (canFulfill.length > 0) {
      fulfillments.push({ locationId: location.id, items: canFulfill });
      canFulfill.forEach(item => remaining.splice(remaining.findIndex(r => r.variantId === item.variantId), 1));
    }
    if (remaining.length === 0) break;
  }

  if (remaining.length > 0) throw new Error('Cannot fulfill order — insufficient stock across all locations');
  return { type: 'split', fulfillments };
}

// Transfer order management
export async function receiveTransferOrder(transferOrderId: string, receivedItems: { variantId: string; quantity: number }[]) {
  const transfer = await db.transferOrders.findUnique({ where: { id: transferOrderId }, include: { items: true } });

  await db.$transaction([
    // Decrease on_hand + reserved at source
    ...receivedItems.map(item => db.inventoryLevels.update({
      where: { variantId_locationId: { variantId: item.variantId, locationId: transfer.fromLocationId } },
      data: { onHand: { decrement: item.quantity }, reserved: { decrement: item.quantity } },
    })),
    // Increase on_hand at destination
    ...receivedItems.map(item => db.inventoryLevels.upsert({
      where: { variantId_locationId: { variantId: item.variantId, locationId: transfer.toLocationId } },
      create: { variantId: item.variantId, locationId: transfer.toLocationId, onHand: item.quantity, reserved: 0 },
      update: { onHand: { increment: item.quantity } },
    })),
    db.transferOrders.update({ where: { id: transferOrderId }, data: { status: 'received' } }),
  ]);
}
```

---

### Step 3: Configure split-shipment communication

When an order is split across two locations, customers must be informed before confirming their order.

**Shopify:** Shopify's native checkout shows "Ships from multiple locations" in the shipping options when a split is needed. Customize the messaging in **Settings → Checkout → Checkout language**.

**WooCommerce:** Display a notice in the cart/checkout when ATUM detects a split is needed. ATUM Multi-Inventory includes configurable messaging for split shipments.

**In the order confirmation email:** Include all fulfillment groups with their expected shipping dates. "Your order will arrive in 2 shipments" with item breakdowns reduces support tickets.

---

### Step 4: Balance stock across locations

Chronic stock imbalances (one warehouse overstocked, another out of stock) increase transfer costs and split fulfillments. Run a weekly analysis:

**Signs of imbalance:**
- One location consistently has the same SKU at zero while another has excess
- More than 20% of orders require split fulfillment for the same SKU
- Transfer requests for the same product direction repeat every week

**Action:** Create a transfer order from the overstocked location to the understocked one before the next reorder cycle.

**Shopify Stocky:** Shows an "Inventory distribution" report that identifies imbalanced SKUs across locations.

## Best Practices

- **Prefer single-location fulfillment** — split shipments increase cost and confusion; exhaust single-location options before splitting
- **Use platform-native multi-location before buying an app** — Shopify and BigCommerce handle the common case well; only add apps when routing logic is more complex than what the platform supports
- **Model transfer orders as in-transit inventory** — reduce available stock at the source when the transfer ships; don't increment the destination until goods arrive and are counted
- **Inform customers of split shipments at checkout**, not after purchase — finding out after payment feels deceptive
- **Run stock-balancing analysis weekly** — a 15-minute review of the distribution report prevents chronic imbalances that compound over time

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Split fulfillment creates two shipping charges | Consolidate shipping cost at the order level; absorb the second shipment cost or notify the customer during checkout — never charge twice silently |
| Transfer received quantity differs from sent | Support partial receipt — record the actual received quantity per item and handle discrepancies (damaged in transit) separately |
| Inventory double-counted across locations | Each inventory record is location-scoped; when reporting total stock, always sum across locations explicitly |
| Location goes offline mid-fulfillment | Mark location as inactive; re-run allocation for unfulfilled orders assigned to that location |
| Customer confused about multiple tracking numbers | Send a separate tracking email per fulfillment with a clear note: "This is shipment 1 of 2 for your order" |

## Related Skills

- @inventory-tracking
- @low-stock-alerts
- @catalog-import-export
