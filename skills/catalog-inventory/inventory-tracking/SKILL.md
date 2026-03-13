---
name: inventory-tracking
description: "Track stock levels in real time across all your warehouses with inventory reservation to prevent overselling and support for backorders"
category: catalog-inventory
risk: critical
source: curated
date_added: "2026-03-12"
tags: [inventory, stock, warehouse, reservation, backorder, real-time, oversell-protection]
triggers: ["inventory tracking", "stock management", "real-time inventory", "oversell prevention", "inventory reservation", "backorder handling"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Inventory Tracking

## Overview

Implement real-time inventory tracking that prevents overselling through atomic reservations, manages backorder logic, and aggregates stock across multiple warehouse locations. Uses optimistic concurrency control (version-based locking) to safely handle concurrent checkout attempts for the same SKU without relying on serialized database locks that would bottleneck throughput.

## When to Use This Skill

- When overselling is occurring because inventory is checked then decremented in two separate operations
- When implementing a multi-warehouse inventory system with per-location stock levels
- When building backorder or pre-order functionality for out-of-stock products
- When a flash sale or product launch will create thousands of concurrent checkout attempts for limited-stock items

## Core Instructions

1. **Design the inventory data model with version-based locking**

   ```javascript
   // inventory_levels table
   {
     id,
     variant_id: 'var_blue_M',
     location_id: 'wh_east',      // warehouse/location
     on_hand: 100,                 // Physical units in the warehouse
     reserved: 15,                 // Units held by open carts/orders
     available: 85,                // on_hand - reserved (computed or maintained)
     backorder_allowed: false,
     backorder_limit: 0,           // 0 = unlimited when allowed
     reorder_point: 20,
     version: 42,                  // Optimistic lock counter
     updated_at: Date,
   }

   // inventory_transactions table — immutable audit log
   {
     id,
     variant_id,
     location_id,
     type: 'reserve'|'release'|'fulfill'|'receive'|'adjust',
     quantity: -5,                 // negative = decrease, positive = increase
     reference_id: 'order_123',    // order/cart/shipment ID
     created_at: Date,
     created_by: 'system'|'usr_admin',
     notes: 'Reserved for cart abc123',
   }
   ```

2. **Implement atomic inventory reservation using optimistic concurrency**

   Attempt to reserve inventory using a conditional UPDATE. If another process modified the record first, retry.

   ```javascript
   // lib/inventory.js
   const MAX_RETRIES = 3;

   export async function reserveInventory({ variantId, locationId, quantity, referenceId }) {
     for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
       const level = await db.inventoryLevels.findUnique({
         where: { variantId_locationId: { variantId, locationId } },
       });

       if (!level) throw new Error(`Inventory record not found: ${variantId} @ ${locationId}`);

       const available = level.onHand - level.reserved;
       if (available < quantity && !level.backorderAllowed) {
         throw new InventoryInsufficientError({
           variantId, available, requested: quantity,
         });
       }

       // Optimistic update — only succeeds if version has not changed
       const updated = await db.inventoryLevels.updateMany({
         where: {
           variantId_locationId: { variantId, locationId },
           version: level.version,   // Concurrency guard
         },
         data: {
           reserved: level.reserved + quantity,
           version: level.version + 1,
         },
       });

       if (updated.count === 0) {
         // Another process modified inventory; retry
         await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
         continue;
       }

       // Log the transaction
       await db.inventoryTransactions.create({
         data: {
           variantId, locationId,
           type: 'reserve',
           quantity: -quantity,
           referenceId,
           notes: `Reserved for ${referenceId}`,
         },
       });

       return { success: true, remaining: available - quantity };
     }

     throw new Error(`Failed to reserve inventory after ${MAX_RETRIES} retries`);
   }
   ```

3. **Release reservations when orders are cancelled or carts expire**

   ```javascript
   export async function releaseReservation({ variantId, locationId, quantity, referenceId }) {
     // Idempotency check — ensure we are not releasing twice
     const existing = await db.inventoryTransactions.findFirst({
       where: { type: 'release', referenceId, variantId },
     });
     if (existing) {
       console.warn(`Reservation ${referenceId} already released`);
       return;
     }

     await db.$transaction([
       db.inventoryLevels.update({
         where: { variantId_locationId: { variantId, locationId } },
         data: { reserved: { decrement: quantity } },
       }),
       db.inventoryTransactions.create({
         data: {
           variantId, locationId,
           type: 'release',
           quantity: +quantity,
           referenceId,
           notes: `Released — order/cart cancelled`,
         },
       }),
     ]);
   }
   ```

4. **Fulfill inventory when orders ship**

   ```javascript
   export async function fulfillInventory({ variantId, locationId, quantity, orderId }) {
     // Atomic: decrement both reserved and on_hand
     await db.$transaction([
       db.inventoryLevels.update({
         where: { variantId_locationId: { variantId, locationId } },
         data: {
           onHand: { decrement: quantity },
           reserved: { decrement: quantity },
         },
       }),
       db.inventoryTransactions.create({
         data: {
           variantId, locationId,
           type: 'fulfill',
           quantity: -quantity,
           referenceId: orderId,
           notes: `Fulfilled for order ${orderId}`,
         },
       }),
     ]);
   }
   ```

5. **Expire stale cart reservations via a background job**

   Carts that are abandoned should not hold inventory indefinitely. Run a periodic job (every 5-10 minutes) to release expired reservations.

   ```javascript
   // jobs/expireCartReservations.js
   export async function expireStaleCartReservations() {
     const RESERVATION_TTL_MINUTES = 30;
     const cutoff = new Date(Date.now() - RESERVATION_TTL_MINUTES * 60 * 1000);

     const staleCarts = await db.carts.findMany({
       where: {
         status: 'active',
         updatedAt: { lt: cutoff },
         reservedAt: { not: null },
       },
       include: { items: true },
     });

     for (const cart of staleCarts) {
       for (const item of cart.items) {
         await releaseReservation({
           variantId: item.variantId,
           locationId: item.locationId,
           quantity: item.quantity,
           referenceId: cart.id,
         });
       }
       await db.carts.update({
         where: { id: cart.id },
         data: { reservedAt: null },
       });
     }

     return staleCarts.length;
   }
   ```

## Examples

### Aggregated availability across warehouses

For multi-location stores, compute total availability as the sum across all locations that can fulfill a given order:

```javascript
export async function getTotalAvailability(variantId, fulfillableLocationIds) {
  const levels = await db.inventoryLevels.findMany({
    where: {
      variantId,
      locationId: { in: fulfillableLocationIds },
    },
  });

  const total = levels.reduce((sum, l) => {
    const available = l.onHand - l.reserved;
    return sum + Math.max(0, available);
  }, 0);

  return { total, byLocation: Object.fromEntries(levels.map(l => [l.locationId, l.onHand - l.reserved])) };
}
```

### Inventory level API response

```json
{
  "variantId": "var_shirt_red_M",
  "aggregated": {
    "onHand": 42,
    "reserved": 7,
    "available": 35
  },
  "byLocation": {
    "wh_east": { "onHand": 20, "reserved": 5, "available": 15 },
    "wh_west": { "onHand": 22, "reserved": 2, "available": 20 }
  },
  "backorderAllowed": false,
  "status": "in_stock"
}
```

## Best Practices

- **Never use read-then-write for inventory** — checking available stock and then decrementing in two separate queries creates a race condition; always use atomic updates with an optimistic lock or database transaction
- **Log every inventory change** — the `inventory_transactions` table is your audit trail; it must be append-only and never updated
- **Release reservations on cart expiry** — use a background job with a configurable TTL (typically 15-30 minutes) to prevent abandoned carts from holding inventory
- **Use database transactions for multi-step operations** — fulfill (decrement `on_hand` + `reserved`) must be atomic; partial execution leaves inventory in an inconsistent state
- **Model `available` as a computed value** — either maintain it as `on_hand - reserved` in the DB or compute it on read; never let it drift from these components
- **Set reorder points** — populate `reorder_point` per variant-location; trigger low-stock alerts when available crosses below this threshold

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Overselling during flash sales | Use optimistic concurrency (version column) with retries; do not use `SELECT FOR UPDATE` which serializes all readers |
| Negative reserved counts after manual adjustments | Add a database CHECK constraint: `reserved >= 0`; also guard in application code |
| Inventory not released after payment failure | Hook into payment webhook `payment_intent.payment_failed`; trigger `releaseReservation` there, not only on frontend timeout |
| Cart reservation released too early | Set TTL based on `cart.updatedAt` not `cart.createdAt`; reset the timer on any cart update |
| Backorder quantity exceeds supplier capacity | Store `backorder_limit` on the inventory record; enforce it in the `reserveInventory` function |

## Related Skills

- @multi-warehouse
- @low-stock-alerts
- @order-processing-pipeline
- @variant-matrix
