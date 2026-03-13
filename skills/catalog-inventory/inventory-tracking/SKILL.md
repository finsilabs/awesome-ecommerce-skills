---
name: inventory-tracking
description: "Track stock levels in real time across your platform with inventory reservation to prevent overselling and support for backorders"
category: catalog-inventory
risk: critical
source: curated
date_added: "2026-03-12"
tags: [inventory, stock, warehouse, reservation, backorder, real-time, oversell-protection]
triggers: ["inventory tracking", "stock management", "real-time inventory", "oversell prevention", "inventory reservation", "backorder handling"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Inventory Tracking

## Overview

Real-time inventory tracking prevents overselling by reserving stock when customers add items to their cart and decrementing it on order fulfillment. Every major e-commerce platform has this built in. Platform-native inventory tracking is almost always the right starting point — only build custom inventory logic if you have requirements that platforms cannot meet (complex multi-warehouse routing, custom reservation windows, or external WMS integration).

## When to Use This Skill

- When overselling is occurring and orders are being placed for out-of-stock items
- When implementing multi-warehouse inventory with per-location stock levels
- When building backorder or pre-order functionality for out-of-stock products
- When a flash sale or product launch will create high-concurrency checkout attempts for limited-stock items

## Core Instructions

### Step 1: Determine platform and enable inventory tracking

| Platform | Built-in Inventory | Recommended Extension |
|----------|-------------------|----------------------|
| **Shopify** | Native per-variant inventory tracking with location support | Stocky (free, by Shopify) for purchase orders and demand forecasting |
| **WooCommerce** | Native stock management with backorder support | ATUM Inventory Management for advanced multi-warehouse and supplier POs |
| **BigCommerce** | Native per-SKU inventory tracking with low-stock alerts | Multi-Location Inventory app for warehouse routing |
| **Custom / Headless** | Build atomic reservation with optimistic locking | Required for custom platforms without native inventory management |

---

### Step 2: Platform-specific setup

---

#### Shopify

Shopify tracks inventory per variant, per location, natively.

**Enable inventory tracking:**

1. Go to **Admin → Products → [Product] → [Variant]**
2. Under **Inventory**, check **Track quantity**
3. Enter your quantity per location
4. For "Continue selling when out of stock" — only check this if you allow backorders for this product

**Set up locations:**

1. Go to **Settings → Locations**
2. Add each warehouse, store, or fulfillment center as a location
3. When editing a product variant, set the quantity at each location independently

**Backorders:**

- Enable per variant: check **Continue selling when out of stock** on the variant
- Or use a backorder app like **Pre-Order Now** or **Back In Stock** for more control (notify customers when available, collect pre-orders, etc.)

**Oversell prevention during high traffic:**

Shopify's checkout system holds inventory during the checkout process to prevent two customers from purchasing the last item simultaneously. For flash sales, use **Shopify Scripts** (Plus) or the **Inventory Planner** app to set purchase limits.

**Inventory sync with physical locations:**

- Install **Stocky** (free, by Shopify) for purchase orders and receiving
- Stocky automatically updates Shopify inventory when you receive a PO
- Use the **Shopify POS** app to sync inventory between your online store and physical retail locations

---

#### WooCommerce

WooCommerce has built-in stock management.

**Enable inventory tracking:**

1. Go to **WooCommerce → Settings → Products → Inventory**
2. Check **Enable stock management**
3. Set **Hold stock (minutes)** — this is the inventory reservation window during checkout (default: 60 minutes)

**Per-product settings:**

1. Go to **WooCommerce → Products → [Product] → Inventory tab**
2. Enable **Manage stock?**
3. Enter **Stock quantity**
4. Set **Backorders**: "Do not allow" / "Allow, but notify customer" / "Allow"
5. Set a **Low stock threshold** for this product

**Advanced inventory management with ATUM:**

1. Install **ATUM Inventory Management for WooCommerce** (free core, paid advanced features)
2. ATUM provides a central inventory dashboard showing stock levels across all products
3. Add purchase orders through **ATUM → Purchase Orders → Add PO**
4. Receiving a PO in ATUM automatically increments WooCommerce stock
5. For multi-warehouse: ATUM's Multi-Inventory add-on ($) assigns stock per location and routes fulfillment

---

#### BigCommerce

BigCommerce tracks inventory per SKU natively.

**Enable inventory tracking:**

1. Go to **Products → [Product] → Inventory tab**
2. Set **Inventory tracking** to "By product" or "By option" (for variants)
3. Enter the current stock level
4. Set a **Low stock level** for alerts

**Multi-location inventory:**

- Install the **Multi-Location Inventory** app from the BigCommerce App Marketplace
- Assign stock quantities per location
- Set fulfillment routing rules (ship from closest, ship from cheapest, etc.)

**Backorders:**
- BigCommerce handles this natively — set **Allow backorders** on products you want to continue selling when out of stock
- The product page shows "Ships in X days" when on backorder

---

#### Custom / Headless

For custom platforms, implement atomic inventory reservation using optimistic concurrency control to prevent overselling under high load:

```typescript
// lib/inventory.ts
const MAX_RETRIES = 3;

// Reserve inventory atomically — handles concurrent requests safely
export async function reserveInventory({
  variantId, locationId, quantity, referenceId
}: { variantId: string; locationId: string; quantity: number; referenceId: string }) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const level = await db.inventoryLevels.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
    });

    if (!level) throw new Error(`Inventory not found: ${variantId}`);

    const available = level.onHand - level.reserved;
    if (available < quantity && !level.backorderAllowed) {
      throw new Error(`Insufficient stock: ${available} available, ${quantity} requested`);
    }

    // Optimistic update — only succeeds if version hasn't changed (no concurrent modifications)
    const updated = await db.inventoryLevels.updateMany({
      where: { variantId_locationId: { variantId, locationId }, version: level.version },
      data: { reserved: level.reserved + quantity, version: level.version + 1 },
    });

    if (updated.count === 0) {
      // Another process modified inventory concurrently; retry
      await new Promise(r => setTimeout(r, 50 * (attempt + 1)));
      continue;
    }

    // Log the transaction for audit trail
    await db.inventoryTransactions.create({
      data: { variantId, locationId, type: 'reserve', quantity: -quantity, referenceId },
    });

    return { success: true, remaining: available - quantity };
  }
  throw new Error(`Failed to reserve inventory after ${MAX_RETRIES} retries`);
}

// Release reservation when cart expires or order is cancelled
export async function releaseReservation({
  variantId, locationId, quantity, referenceId
}: { variantId: string; locationId: string; quantity: number; referenceId: string }) {
  // Idempotency check — don't release twice
  const existing = await db.inventoryTransactions.findFirst({
    where: { type: 'release', referenceId, variantId },
  });
  if (existing) return;

  await db.$transaction([
    db.inventoryLevels.update({
      where: { variantId_locationId: { variantId, locationId } },
      data: { reserved: { decrement: quantity } },
    }),
    db.inventoryTransactions.create({
      data: { variantId, locationId, type: 'release', quantity: +quantity, referenceId },
    }),
  ]);
}

// Expire stale cart reservations — run every 5-10 minutes via cron
export async function expireStaleCartReservations() {
  const TTL_MINUTES = 30;
  const cutoff = new Date(Date.now() - TTL_MINUTES * 60 * 1000);

  const staleCarts = await db.carts.findMany({
    where: { status: 'active', updatedAt: { lt: cutoff }, reservedAt: { not: null } },
    include: { items: true },
  });

  for (const cart of staleCarts) {
    for (const item of cart.items) {
      await releaseReservation({ variantId: item.variantId, locationId: item.locationId, quantity: item.quantity, referenceId: cart.id });
    }
  }
}
```

---

### Step 3: Configure backorder behavior

Backorders allow customers to purchase even when stock is at zero, with a clear expectation of a delayed delivery.

**When to allow backorders:**
- Products with reliable supplier lead times (7–14 days)
- Made-to-order products
- Pre-order campaigns for upcoming products

**When to block backorders:**
- Products with unreliable supply
- Third-party fulfilled items where you don't control restock

**Communication best practices:**
- Show "Ships in 7–10 days" on the product page when stock is 0 and backorders are enabled
- Include expected ship date in the order confirmation email
- Notify customers proactively if the expected date changes

---

### Step 4: Set up inventory alerts

Pair inventory tracking with low-stock alerts — see the **@low-stock-alerts** skill for full setup. Quick summary:

- **Shopify**: Go to **Admin → Products** — Shopify shows a low stock indicator; use **Stocky** for email alerts
- **WooCommerce**: Go to **WooCommerce → Settings → Products → Inventory → Low stock threshold** — WooCommerce emails the store admin when stock crosses this threshold
- **BigCommerce**: Go to **Products → [Product] → Inventory → Low stock level** — BigCommerce sends email notifications automatically

## Best Practices

- **Enable inventory tracking on every SKU** — products without tracking can be oversold silently; only disable tracking for digital products or items with unlimited supply
- **Set a reservation window for in-progress checkouts** — WooCommerce's "Hold stock" setting (default 60 min) prevents inventory from being held indefinitely by abandoned carts
- **Test your oversell protection** — during a flash sale setup, manually verify that the last unit cannot be purchased twice by simulating two simultaneous checkouts
- **Log every inventory change** — platforms log this natively; for custom builds, an immutable `inventory_transactions` table is essential for diagnosing discrepancies
- **Use the platform's built-in multi-location inventory** before buying a third-party app — Shopify, WooCommerce, and BigCommerce all handle multiple locations natively

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Overselling during flash sales on Shopify | Shopify's checkout holds inventory during the checkout flow; for very high-concurrency launches, set purchase limits using Shopify Scripts (Plus) or use a waitlist app |
| WooCommerce inventory not decremented after order | Check that stock management is enabled on the product AND globally in WooCommerce settings; both must be on |
| Inventory released immediately when order is cancelled before fulfillment | This is correct behavior for physical goods — released inventory becomes available for other customers; only delay release for backordered items |
| Negative inventory after manual adjustment | Add validation in WooCommerce (ATUM) or set a DB check constraint on custom builds; `reserved >= 0` and `on_hand >= 0` |
| Shopify location not receiving inventory updates from POS | Ensure POS is connected to the correct Shopify location in Settings → Locations → POS channel |

## Related Skills

- @multi-warehouse
- @low-stock-alerts
- @variant-matrix
