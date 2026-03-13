---
name: low-stock-alerts
description: "Automatically alert your team and trigger reorders when products fall below custom thresholds, using sales velocity and demand forecasting"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [low-stock, alerts, reorder, notifications, demand-forecasting, replenishment, procurement]
triggers: ["low stock alert", "reorder point", "out of stock notification", "inventory replenishment", "stock level alert", "demand forecasting"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Low Stock Alerts

## Overview

Implement automated monitoring of inventory levels against configurable reorder points, trigger supplier notification emails when stock falls below thresholds, and apply simple demand forecasting (rolling average of daily sales velocity) to dynamically calculate reorder points based on lead time. Covers the alert data model, background job scheduling, escalation logic, and a merchant-facing alert dashboard.

## When to Use This Skill

- When merchants are running out of stock unexpectedly and missing sales
- When the inventory management workflow relies on manual checks rather than automated alerts
- When implementing demand-based reorder points rather than fixed thresholds
- When the store has supplier lead times that need to be factored into when to reorder

## Prerequisites & Platform Notes

**Shopify**: Shopify has built-in inventory management, product variants, and metafields. Use the Shopify Admin API for bulk operations. For advanced needs, apps like Stocky or custom Shopify Functions.
**WooCommerce**: WooCommerce has built-in stock management. Extend with plugins (ATUM, WP All Import for bulk catalog). Use WooCommerce REST API for integrations.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with product catalog access, API credentials

## Core Instructions

1. **Design the reorder configuration and alert data models**

   ```javascript
   // reorder_configs table — per variant, per location
   {
     id,
     variant_id: 'var_shirt_red_M',
     location_id: 'wh_east',
     reorder_point: 20,              // Alert when available drops to or below this
     reorder_quantity: 100,          // Suggested PO quantity
     supplier_id: 'sup_acme',
     lead_time_days: 7,              // Days from PO to receipt
     use_dynamic_reorder_point: true, // Compute from demand velocity if true
     created_at: Date,
   }

   // stock_alerts table
   {
     id,
     variant_id,
     location_id,
     alert_type: 'low_stock'|'out_of_stock'|'overstock',
     triggered_at: Date,
     available_at_trigger: 5,
     reorder_point_at_trigger: 20,
     resolved_at: null,             // Set when stock rises above reorder point
     notification_sent: false,
     acknowledged_by: null,
   }
   ```

2. **Background job: check all inventory levels against reorder points**

   ```javascript
   // jobs/checkStockLevels.js
   export async function checkStockLevels() {
     // Fetch all inventory levels with their reorder configs
     const levels = await db.inventoryLevels.findMany({
       include: {
         reorderConfig: true,
         variant: { include: { product: true } },
         location: true,
       },
       where: {
         reorderConfig: { isNot: null },
       },
     });

     const now = new Date();
     const alerts = [];

     for (const level of levels) {
       const config = level.reorderConfig;
       const available = level.onHand - level.reserved;

       let reorderPoint = config.reorderPoint;

       // Override with dynamic reorder point if configured
       if (config.useDynamicReorderPoint) {
         const velocity = await calculateDailySalesVelocity(level.variantId, level.locationId, 30);
         reorderPoint = Math.ceil(velocity * config.leadTimeDays * 1.2); // 20% safety stock buffer
       }

       const alertType = available === 0 ? 'out_of_stock'
         : available <= reorderPoint ? 'low_stock'
         : null;

       if (!alertType) continue;

       // Check if an unresolved alert already exists
       const existingAlert = await db.stockAlerts.findFirst({
         where: {
           variantId: level.variantId,
           locationId: level.locationId,
           alertType,
           resolvedAt: null,
         },
       });

       if (!existingAlert) {
         const alert = await db.stockAlerts.create({
           data: {
             variantId: level.variantId,
             locationId: level.locationId,
             alertType,
             triggeredAt: now,
             availableAtTrigger: available,
             reorderPointAtTrigger: reorderPoint,
           },
         });
         alerts.push({ ...alert, level, config });
       }
     }

     // Send notifications for new alerts
     if (alerts.length > 0) {
       await sendAlertNotifications(alerts);
     }

     return alerts.length;
   }

   // Resolve alerts when stock is replenished
   async function resolveStockAlerts(variantId, locationId) {
     await db.stockAlerts.updateMany({
       where: { variantId, locationId, resolvedAt: null },
       data: { resolvedAt: new Date() },
     });
   }
   ```

3. **Calculate sales velocity from order history**

   ```javascript
   // lib/demandForecasting.js
   export async function calculateDailySalesVelocity(variantId, locationId, windowDays = 30) {
     const since = new Date(Date.now() - windowDays * 86400000);

     const result = await db.orderLineItems.aggregate({
       where: {
         variantId,
         order: {
           createdAt: { gte: since },
           status: { in: ['completed', 'shipped', 'delivered'] },
           fulfillments: {
             some: { locationId },
           },
         },
       },
       _sum: { quantity: true },
     });

     const totalSold = result._sum.quantity ?? 0;
     return totalSold / windowDays;
   }

   export function calculateDynamicReorderPoint(dailyVelocity, leadTimeDays, safetyStockMultiplier = 1.5) {
     // Safety stock = velocity * lead_time * safety_multiplier
     // Reorder when: on_hand <= lead_time_demand + safety_stock
     const leadTimeDemand = dailyVelocity * leadTimeDays;
     const safetyStock = leadTimeDemand * (safetyStockMultiplier - 1);
     return Math.ceil(leadTimeDemand + safetyStock);
   }
   ```

4. **Send alert notifications to merchants and suppliers**

   ```javascript
   // lib/alertNotifications.js
   export async function sendAlertNotifications(alerts) {
     // Group alerts by supplier for consolidated emails
     const bySupplier = {};
     for (const alert of alerts) {
       const supplierId = alert.config?.supplierId ?? 'merchant';
       if (!bySupplier[supplierId]) bySupplier[supplierId] = [];
       bySupplier[supplierId].push(alert);
     }

     for (const [supplierId, supplierAlerts] of Object.entries(bySupplier)) {
       if (supplierId === 'merchant') {
         // Notify merchant
         await emailService.send({
           to: process.env.MERCHANT_ALERT_EMAIL,
           template: 'low-stock-merchant',
           data: { alerts: supplierAlerts },
         });
         continue;
       }

       const supplier = await db.suppliers.findUnique({ where: { id: supplierId } });
       if (!supplier?.email) continue;

       const reorderLines = supplierAlerts.map(a => ({
         sku: a.level.variant.sku,
         productName: a.level.variant.product.name,
         currentStock: a.availableAtTrigger,
         reorderQuantity: a.config.reorderQuantity,
         location: a.level.location.name,
       }));

       await emailService.send({
         to: supplier.email,
         template: 'low-stock-supplier-reorder',
         data: {
           supplierName: supplier.name,
           reorderLines,
           storeUrl: process.env.STORE_URL,
         },
       });

       // Mark notifications as sent
       await db.stockAlerts.updateMany({
         where: { id: { in: supplierAlerts.map(a => a.id) } },
         data: { notificationSent: true },
       });
     }
   }
   ```

5. **Expose an alert management API**

   ```javascript
   // api/admin/stock-alerts.js

   // GET /api/admin/stock-alerts — fetch all unresolved alerts
   export async function getStockAlerts(req, res) {
     const { type, locationId, supplierId } = req.query;

     const alerts = await db.stockAlerts.findMany({
       where: {
         resolvedAt: null,
         ...(type ? { alertType: type } : {}),
         ...(locationId ? { locationId } : {}),
       },
       include: {
         variant: { include: { product: true } },
         location: true,
       },
       orderBy: { triggeredAt: 'desc' },
     });

     res.json({ alerts, count: alerts.length });
   }

   // POST /api/admin/stock-alerts/:id/acknowledge
   export async function acknowledgeAlert(req, res) {
     await db.stockAlerts.update({
       where: { id: req.params.id },
       data: { acknowledgedBy: req.session.userId },
     });
     res.json({ acknowledged: true });
   }
   ```

## Examples

### Reorder point dashboard metrics

```sql
-- Variants that are at or below their reorder point right now
SELECT
  p.name,
  pv.sku,
  l.name AS location,
  il.on_hand - il.reserved AS available,
  rc.reorder_point,
  rc.reorder_quantity,
  rc.lead_time_days
FROM inventory_levels il
JOIN reorder_configs rc ON rc.variant_id = il.variant_id AND rc.location_id = il.location_id
JOIN product_variants pv ON pv.id = il.variant_id
JOIN products p ON p.id = pv.product_id
JOIN locations l ON l.id = il.location_id
WHERE il.on_hand - il.reserved <= rc.reorder_point
ORDER BY (il.on_hand - il.reserved) ASC;
```

### Webhook trigger when inventory crosses threshold

```javascript
// In your inventory update function, after decrementing on_hand:
export async function onInventoryUpdated(variantId, locationId) {
  const level = await db.inventoryLevels.findUnique({
    where: { variantId_locationId: { variantId, locationId } },
    include: { reorderConfig: true },
  });

  if (!level?.reorderConfig) return;

  const available = level.onHand - level.reserved;
  if (available <= level.reorderConfig.reorderPoint) {
    // Trigger async — do not block the inventory update
    checkStockLevels().catch(console.error);
  }
}
```

## Best Practices

- **Set reorder points based on lead time and velocity** — a fixed reorder point of 10 units may be fine for fast-moving items but insufficient for seasonal products; use the dynamic formula
- **De-duplicate alerts** — only create a new alert when the previous one has been resolved; do not spam merchants with repeated alerts for the same SKU
- **Consolidate supplier emails** — batch multiple low-stock items for the same supplier into a single email; one email with 5 SKUs is far less noisy than 5 separate emails
- **Resolve alerts automatically on stock receipt** — when a warehouse receipt is processed, call `resolveStockAlerts` so the dashboard stays clean
- **Track acknowledgements** — require merchants to acknowledge alerts so you can report on response time and identify ignored alerts
- **Monitor for consistently understocked variants** — if the same SKU triggers low-stock alerts every 2 weeks, the reorder quantity is too low

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Alert fires repeatedly for the same SKU without resolution | Add a `resolvedAt` guard — only trigger a new alert when the previous one is resolved or when stock has first risen above the threshold and then dropped again |
| Dynamic reorder point too high during seasonally low periods | Use a rolling 30-day window; consider separate high-season and off-season configurations for seasonal products |
| Supplier emails go to spam | Configure SPF, DKIM, and DMARC for your sending domain; use a reputable transactional email provider (SendGrid, Postmark) |
| Alert job runs too frequently and causes database load | Run the check job every 15-30 minutes, not continuously; also trigger on-demand when inventory is decremented below the reorder point |

## Related Skills

- @inventory-tracking
- @multi-warehouse
- @order-processing-pipeline
- @product-content-enrichment
