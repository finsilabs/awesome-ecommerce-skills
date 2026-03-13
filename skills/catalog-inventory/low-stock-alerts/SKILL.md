---
name: low-stock-alerts
description: "Set up automated alerts when products fall below custom thresholds so you can reorder before running out of stock"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [low-stock, alerts, reorder, notifications, demand-forecasting, replenishment, procurement]
triggers: ["low stock alert", "reorder point", "out of stock notification", "inventory replenishment", "stock level alert", "demand forecasting"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Low Stock Alerts

## Overview

Low stock alerts notify you when inventory drops below a threshold so you can reorder before running out. Every major platform has this built in — Shopify, WooCommerce, and BigCommerce all send email notifications when stock falls below a configured level. For more advanced needs like demand-based thresholds, supplier PO automation, or team notifications in Slack, dedicated apps add those capabilities without custom code.

## When to Use This Skill

- When products are unexpectedly running out of stock and missing sales
- When the current inventory workflow relies on manual checks rather than automated alerts
- When you want demand-based reorder points rather than fixed thresholds
- When the store has supplier lead times that need to be factored into when to reorder

## Core Instructions

### Step 1: Determine platform and choose the right tool

| Platform | Built-in Alerts | Recommended Extension |
|----------|-----------------|-----------------------|
| **Shopify** | Shopify sends an email notification when stock hits zero; very limited threshold control | Stocky (free, by Shopify) for configurable thresholds and PO automation; Back in Stock for customer notifications |
| **WooCommerce** | WooCommerce emails the store admin when stock drops below the configured low-stock threshold | ATUM Inventory Management for per-product thresholds, supplier emails, and reorder suggestions |
| **BigCommerce** | Built-in low stock notifications per product with configurable threshold | Multi-Location Inventory app for location-specific alerts |
| **Custom / Headless** | Build a background job that checks levels against reorder points | Required when platform has no native alerting or you need supplier email automation |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Built-in low stock notification:**

Shopify sends an email to the store admin when inventory hits zero, but doesn't support configurable thresholds natively.

1. Go to **Settings → Notifications → Scroll to Staff order notifications**
2. Ensure the admin email is set — Shopify will notify this address when stock reaches 0

**Setting per-variant thresholds with Stocky:**

1. Install **Stocky** from the Shopify App Store (free)
2. Open Stocky and go to **Products**
3. For each product, set the **Reorder point** (the stock level that triggers an alert)
4. Set the **Reorder quantity** (how many units to order when the alert fires)
5. Stocky will flag products below their reorder point in the dashboard and can generate draft purchase orders automatically

**Customer "back in stock" notifications:**
- Install **Back In Stock** (paid) or **Klaviyo** from the App Store
- These apps show a "Notify me when available" button on out-of-stock products
- Automatically email opted-in customers when stock is replenished

---

#### WooCommerce

**Configure global low-stock threshold:**

1. Go to **WooCommerce → Settings → Products → Inventory**
2. Enter a value in **Low stock threshold** (e.g., `10`)
3. Enter your notification email in **Notification recipient(s)** — comma-separate multiple emails
4. WooCommerce sends an email when any product drops to or below this threshold

**Set per-product thresholds:**

1. Go to **WooCommerce → Products → [Product] → Inventory tab**
2. Enable **Manage stock?**
3. Enter a **Low stock threshold** specific to this product (overrides the global setting)

**Advanced alerting with ATUM:**

1. Install **ATUM Inventory Management for WooCommerce** (free)
2. ATUM's dashboard shows all products at or below their reorder point in one view
3. Per-product reorder point configuration under **ATUM → Product Settings**
4. ATUM can also email your supplier directly when a product needs reordering (paid feature)

**Demand-based thresholds:**
- Install **Inventory Planner** (Shopify/WooCommerce) for sales velocity-based reorder suggestions
- Inventory Planner analyzes your sales history and suggests reorder points based on lead time × daily velocity + safety stock

---

#### BigCommerce

**Set per-product low stock threshold:**

1. Go to **Products → [Product] → Inventory tab**
2. Set the **Low stock level** field
3. BigCommerce sends an automatic email notification to the store admin when stock crosses this threshold

**Configure who receives alerts:**
1. Go to **Store Setup → Store Settings → Miscellaneous**
2. Set **Low stock email address** to your purchasing team's email

**For location-specific alerts:**
- Install the **Multi-Location Inventory** app
- Set thresholds per location — useful when you stock the same SKU at multiple warehouses

---

#### Custom / Headless

For custom platforms, implement a background job that checks inventory levels against configured reorder points:

```typescript
// jobs/checkStockLevels.ts — run every 15-30 minutes via cron
export async function checkStockLevels() {
  const levels = await db.inventoryLevels.findMany({
    include: { reorderConfig: true, variant: { include: { product: true } }, location: true },
    where: { reorderConfig: { isNot: null } },
  });

  const newAlerts = [];

  for (const level of levels) {
    const config = level.reorderConfig!;
    const available = level.onHand - level.reserved;

    // Dynamic reorder point based on sales velocity and lead time
    let reorderPoint = config.reorderPoint;
    if (config.useDynamicReorderPoint) {
      const velocity = await calculateDailySalesVelocity(level.variantId, 30); // 30-day rolling average
      reorderPoint = Math.ceil(velocity * config.leadTimeDays * 1.2); // 20% safety stock buffer
    }

    const alertType = available === 0 ? 'out_of_stock' : available <= reorderPoint ? 'low_stock' : null;
    if (!alertType) continue;

    // Only create a new alert if the previous one is resolved
    const existingAlert = await db.stockAlerts.findFirst({
      where: { variantId: level.variantId, locationId: level.locationId, alertType, resolvedAt: null },
    });

    if (!existingAlert) {
      newAlerts.push({ level, config, available, reorderPoint, alertType });
      await db.stockAlerts.create({ data: {
        variantId: level.variantId, locationId: level.locationId,
        alertType, triggeredAt: new Date(), availableAtTrigger: available,
      }});
    }
  }

  if (newAlerts.length > 0) await sendAlertNotifications(newAlerts);
}

// Calculate daily sales velocity from order history
async function calculateDailySalesVelocity(variantId: string, windowDays: number) {
  const since = new Date(Date.now() - windowDays * 86400000);
  const result = await db.orderLineItems.aggregate({
    where: { variantId, order: { createdAt: { gte: since }, status: { in: ['completed', 'shipped'] } } },
    _sum: { quantity: true },
  });
  return (result._sum.quantity ?? 0) / windowDays;
}

// Send consolidated alerts — group by supplier to avoid email spam
async function sendAlertNotifications(alerts: Alert[]) {
  const bySupplier: Record<string, Alert[]> = {};
  for (const alert of alerts) {
    const key = alert.config.supplierId ?? 'merchant';
    if (!bySupplier[key]) bySupplier[key] = [];
    bySupplier[key].push(alert);
  }

  for (const [supplierId, supplierAlerts] of Object.entries(bySupplier)) {
    const to = supplierId === 'merchant' ? process.env.MERCHANT_ALERT_EMAIL : (await db.suppliers.findById(supplierId))?.email;
    if (!to) continue;
    await emailService.send({ to, template: 'low-stock-alert', data: { alerts: supplierAlerts } });
  }
}
```

---

### Step 3: Calculate dynamic reorder points (optional)

Fixed thresholds (e.g., "alert at 10 units") are simple but can be wrong — a product that sells 50 units per day needs a much higher threshold than one that sells 2 per week.

**Formula:**
```
Reorder Point = (Daily Sales Velocity × Lead Time Days) × 1.2 (20% safety buffer)
```

Example: Product sells 5 units/day, supplier lead time is 7 days
- Demand during lead time: 5 × 7 = 35 units
- Reorder point with safety buffer: 35 × 1.2 = 42 units

**For Shopify:** Use **Inventory Planner** app — it computes velocity-based reorder points automatically from your sales history.

**For WooCommerce:** ATUM Inventory Management can be configured with supplier lead times and suggests reorder points based on sales velocity.

---

### Step 4: Automate reorder notifications to suppliers

Once an alert fires, you want to notify your purchasing team or supplier automatically.

**Shopify + Stocky:** Stocky generates draft purchase orders when stock falls below the reorder point. Your team reviews and sends the PO to the supplier from within Stocky.

**WooCommerce + ATUM (paid):** ATUM can email the configured supplier directly when a product needs reordering, including the suggested quantity.

**Email workflow (any platform):** Set the low-stock notification email directly to your supplier's ordering inbox — include the SKU, product name, and suggested reorder quantity in the notification template.

## Best Practices

- **Set reorder points based on lead time and sales velocity** — a fixed threshold of 10 units may be fine for slow movers but dangerously low for fast sellers; use the formula above as a starting point
- **De-duplicate alerts** — platforms and custom solutions should only send one alert per SKU per incident, not an alert on every inventory decrement; resolve old alerts when stock is replenished
- **Consolidate supplier emails** — one email with 5 low-stock SKUs from the same supplier is far less noisy than 5 separate emails
- **Set thresholds at the variant level**, not just the product level — a shirt with 3 remaining in XL and 50 in M should alert only for XL
- **Review and update thresholds seasonally** — a product that sells 2/day normally may sell 20/day during peak season; adjust thresholds before high-demand periods

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Alert fires repeatedly for the same SKU | Ensure the platform only sends one alert per incident until stock is replenished; Shopify and WooCommerce do this correctly by default; custom builds need a `resolvedAt` guard |
| Dynamic reorder point too high during off-season | Use a rolling 30-day window for velocity calculations; consider separate seasonal configurations for products with strong seasonality |
| Supplier emails go to spam | Use an authenticated sending domain (SPF, DKIM, DMARC) for your alert emails; transactional email providers (SendGrid, Postmark) improve deliverability |
| Alert threshold too low — too many false alarms | Start with a threshold at 2× your typical order quantity from the supplier, then tune based on how often you're actually running out before the reorder arrives |

## Related Skills

- @inventory-tracking
- @multi-warehouse
- @catalog-import-export
