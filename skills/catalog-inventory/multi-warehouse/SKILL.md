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
platforms: [platform-agnostic]
difficulty: advanced
---

# Multi-Warehouse Inventory

## Overview

Manage inventory across multiple warehouse locations with intelligent allocation rules that minimize shipping cost and delivery time. Covers the location data model, allocation algorithm (proximity-first, cost-first, single-shipment preference), transfer order management for stock balancing, and split fulfillment when no single location can fulfill an entire order.

## When to Use This Skill

- When a merchant operates more than one warehouse, store, or 3PL (third-party logistics) provider
- When shipping cost is significant and routing from the nearest warehouse matters
- When stock imbalance between locations requires transfer orders to redistribute inventory
- When orders must sometimes be split across two warehouses because no single location has all items in stock

## Core Instructions

1. **Design the location and allocation data model**

   ```javascript
   // locations table
   {
     id: 'wh_east',
     name: 'East Coast Warehouse',
     type: 'warehouse'|'store'|'3pl'|'dropship',
     address: { street, city, state, zip, country },
     lat: 40.7128,
     lng: -74.0060,
     ships_to_regions: ['US-NE', 'US-SE'],   // regions this location can ship to
     active: true,
     fulfillment_priority: 1,                 // lower = higher priority in tie-breaks
   }

   // inventory_levels table (per variant per location)
   {
     variant_id, location_id, on_hand, reserved, available, ...
   }

   // allocation_rules table — optional merchant-configured overrides
   {
     id, rule_type: 'pin_region'|'exclude'|'priority_override',
     location_id, region_code, priority,
   }
   ```

2. **Implement the allocation algorithm**

   Determine which location(s) should fulfill an order. Prefer single-location fulfillment to minimize splits, then fall back to multi-location.

   ```javascript
   // lib/allocation.js
   import { haversineDistance } from './geo';

   export async function allocateOrder(orderItems, shippingAddress) {
     // 1. Get all active locations
     const locations = await db.locations.findMany({ where: { active: true } });

     // 2. Fetch inventory availability for all required variants at all locations
     const variantIds = orderItems.map(i => i.variantId);
     const inventory = await db.inventoryLevels.findMany({
       where: { variantId: { in: variantIds } },
     });
     // Map: locationId -> variantId -> available quantity
     const invMap = buildInventoryMap(inventory);

     // 3. Score locations by distance to shipping address
     const scored = locations.map(loc => ({
       ...loc,
       distanceKm: haversineDistance(
         { lat: loc.lat, lng: loc.lng },
         { lat: shippingAddress.lat, lng: shippingAddress.lng }
       ),
     })).sort((a, b) => a.distanceKm - b.distanceKm);

     // 4. Try to fulfill the entire order from a single location
     for (const location of scored) {
       const canFulfillAll = orderItems.every(item => {
         const available = invMap[location.id]?.[item.variantId] ?? 0;
         return available >= item.quantity;
       });

       if (canFulfillAll) {
         return {
           type: 'single',
           fulfillments: [{ locationId: location.id, items: orderItems }],
         };
       }
     }

     // 5. Fall back to split fulfillment (greedy — assign items to nearest location with stock)
     return allocateSplit(orderItems, scored, invMap);
   }

   function allocateSplit(orderItems, scoredLocations, invMap) {
     const remaining = orderItems.map(i => ({ ...i }));
     const fulfillments = [];

     for (const location of scoredLocations) {
       const canFulfill = remaining.filter(item => {
         const available = invMap[location.id]?.[item.variantId] ?? 0;
         return available >= item.quantity;
       });

       if (canFulfill.length > 0) {
         fulfillments.push({ locationId: location.id, items: canFulfill });
         canFulfill.forEach(item => {
           const idx = remaining.findIndex(r => r.variantId === item.variantId);
           remaining.splice(idx, 1);
         });
       }

       if (remaining.length === 0) break;
     }

     if (remaining.length > 0) {
       throw new AllocationError('Cannot fulfill order — insufficient stock across all locations', remaining);
     }

     return { type: 'split', fulfillments };
   }
   ```

3. **Create fulfillment records per location**

   After allocation, create one fulfillment per location. Each fulfillment tracks its own shipment and tracking number.

   ```javascript
   export async function createFulfillments(orderId, allocationResult) {
     const fulfillments = await Promise.all(
       allocationResult.fulfillments.map(async ({ locationId, items }) => {
         return db.fulfillments.create({
           data: {
             orderId,
             locationId,
             status: 'pending',
             items: {
               create: items.map(item => ({
                 variantId: item.variantId,
                 quantity: item.quantity,
               })),
             },
           },
         });
       })
     );

     // Reserve inventory at each location
     for (const fulfillment of fulfillments) {
       for (const item of fulfillment.items) {
         await reserveInventory({
           variantId: item.variantId,
           locationId: fulfillment.locationId,
           quantity: item.quantity,
           referenceId: fulfillment.id,
         });
       }
     }

     return fulfillments;
   }
   ```

4. **Implement transfer orders for stock balancing**

   Transfer orders move inventory from an over-stocked location to an under-stocked one.

   ```javascript
   // api/admin/transfer-orders.js
   export async function createTransferOrder(req, res) {
     const { fromLocationId, toLocationId, items } = req.body;
     // items: [{ variantId, quantity }]

     // Validate source has sufficient stock
     for (const item of items) {
       const sourceLevel = await db.inventoryLevels.findUnique({
         where: { variantId_locationId: { variantId: item.variantId, locationId: fromLocationId } },
       });
       if ((sourceLevel?.available ?? 0) < item.quantity) {
         return res.status(400).json({
           error: `Insufficient stock for ${item.variantId} at ${fromLocationId}`,
         });
       }
     }

     const transferOrder = await db.transferOrders.create({
       data: {
         fromLocationId,
         toLocationId,
         status: 'draft',
         items: { create: items },
       },
     });

     res.status(201).json(transferOrder);
   }

   // Called when transfer is physically shipped from source
   export async function markTransferShipped(transferOrderId) {
     const transfer = await db.transferOrders.findUnique({
       where: { id: transferOrderId }, include: { items: true },
     });

     await db.$transaction([
       // Reserve at source (reduces available while in transit)
       ...transfer.items.map(item =>
         db.inventoryLevels.update({
           where: { variantId_locationId: { variantId: item.variantId, locationId: transfer.fromLocationId } },
           data: { reserved: { increment: item.quantity } },
         })
       ),
       db.transferOrders.update({ where: { id: transferOrderId }, data: { status: 'in_transit' } }),
     ]);
   }

   // Called when transfer is received at destination
   export async function receiveTransferOrder(transferOrderId, receivedItems) {
     const transfer = await db.transferOrders.findUnique({
       where: { id: transferOrderId }, include: { items: true },
     });

     await db.$transaction([
       // Decrease on_hand + reserved at source
       ...receivedItems.map(item =>
         db.inventoryLevels.update({
           where: { variantId_locationId: { variantId: item.variantId, locationId: transfer.fromLocationId } },
           data: {
             onHand: { decrement: item.quantity },
             reserved: { decrement: item.quantity },
           },
         })
       ),
       // Increase on_hand at destination
       ...receivedItems.map(item =>
         db.inventoryLevels.upsert({
           where: { variantId_locationId: { variantId: item.variantId, locationId: transfer.toLocationId } },
           create: { variantId: item.variantId, locationId: transfer.toLocationId, onHand: item.quantity, reserved: 0 },
           update: { onHand: { increment: item.quantity } },
         })
       ),
       db.transferOrders.update({ where: { id: transferOrderId }, data: { status: 'received' } }),
     ]);
   }
   ```

5. **Surface split-shipment information to the customer**

   When an order is split across locations, inform the customer before checkout and in their order confirmation.

   ```jsx
   // SplitShipmentNotice.jsx
   function SplitShipmentNotice({ fulfillments }) {
     if (fulfillments.length <= 1) return null;
     return (
       <div className="split-shipment-notice" role="alert">
         <p>
           Your order will arrive in {fulfillments.length} separate shipments because some items
           are shipping from different locations.
         </p>
         <ul>
           {fulfillments.map((f, i) => (
             <li key={f.locationId}>
               Shipment {i + 1}: {f.items.map(item => item.productName).join(', ')}
             </li>
           ))}
         </ul>
       </div>
     );
   }
   ```

## Examples

### Haversine distance calculation for proximity scoring

```javascript
// lib/geo.js
export function haversineDistance({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 }) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function toRad(deg) { return deg * Math.PI / 180; }
```

### Inventory dashboard by location

```sql
SELECT
  l.name AS location,
  p.name AS product,
  pv.sku,
  il.on_hand,
  il.reserved,
  il.on_hand - il.reserved AS available
FROM inventory_levels il
JOIN locations l ON l.id = il.location_id
JOIN product_variants pv ON pv.id = il.variant_id
JOIN products p ON p.id = pv.product_id
WHERE il.on_hand - il.reserved <= p.reorder_point
ORDER BY available ASC;
```

## Best Practices

- **Prefer single-location fulfillment** — split shipments increase cost and confuse customers; exhaust single-location options before splitting
- **Reserve inventory at the chosen location atomically** — use the `reserveInventory` pattern with optimistic locking from the inventory-tracking skill
- **Notify customers of split shipments before checkout confirmation** — not as a surprise after purchase
- **Model transfer orders as inventory in transit** — increase `reserved` at source, increase `on_hand` at destination only on receipt
- **Geocode warehouse and customer addresses** — proximity-based allocation requires lat/lng; use a geocoding service (Google Maps Geocoding API, Nominatim)
- **Run stock-balancing analysis regularly** — a weekly job that computes demand vs. stock by region and suggests transfer orders prevents chronic stock imbalances

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Allocation picks a far warehouse because the nearest lacks one item | Implement "single-location preference weight" — accept slightly higher shipping cost to avoid a split if one location is within X km |
| Transfer order received quantity differs from sent | Support partial receipt — record `received_quantity` per item and handle the discrepancy (lost in transit, damaged) |
| Inventory double-counted across locations | Each `inventory_levels` row is location-scoped; aggregate explicitly — never sum on_hand without grouping by location |
| Customer charged two shipping fees for a split order | Consolidate shipping cost at the order level, not per fulfillment; absorb the second shipment cost or notify the customer at checkout |
| Location goes offline mid-fulfillment | Mark location as `active: false`; re-run allocation for unfulfilled orders assigned to that location |

## Related Skills

- @inventory-tracking
- @order-processing-pipeline
- @low-stock-alerts
- @fulfillment-shipping
