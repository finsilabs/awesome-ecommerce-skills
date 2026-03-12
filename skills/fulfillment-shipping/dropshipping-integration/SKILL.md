---
name: dropshipping-integration
description: "Supplier order routing, inventory sync, and margin calculation for dropship"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [dropshipping, supplier-integration, order-routing, inventory-sync, margin-calculation, dropship]
triggers: ["dropshipping", "dropship integration", "supplier order routing", "dropship inventory sync", "dropship margin", "supplier API"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Dropshipping Integration

## Overview

Build a dropshipping integration layer that routes customer orders to the correct supplier, syncs inventory levels from supplier feeds, calculates and tracks margins per order, and handles supplier fulfillment confirmations and tracking numbers. Supports multiple concurrent suppliers with per-SKU routing rules and fallback logic.

## When to Use This Skill

- When launching a store without physical inventory by routing orders directly to supplier warehouses
- When adding a dropship-fulfilled product category alongside your own inventory
- When building a multi-supplier routing engine that picks the best supplier per order based on price, stock, or location
- When you need to keep your storefront inventory in sync with supplier availability feeds (CSV, EDI, API)
- When tracking dropship margins for accounting and vendor performance reporting

## Core Instructions

1. **Define the supplier and product mapping schema**

   ```sql
   CREATE TABLE suppliers (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name           VARCHAR(128) NOT NULL,
     api_endpoint   TEXT,
     api_key        TEXT,                         -- encrypted at rest
     order_method   VARCHAR(16) NOT NULL
                      CHECK (order_method IN ('api', 'email', 'edi', 'csv_ftp')),
     lead_time_days INTEGER NOT NULL DEFAULT 2,
     is_active      BOOLEAN NOT NULL DEFAULT true
   );

   CREATE TABLE supplier_products (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     supplier_id    UUID NOT NULL REFERENCES suppliers(id),
     product_id     UUID NOT NULL REFERENCES products(id),
     supplier_sku   VARCHAR(64) NOT NULL,          -- supplier's own SKU
     cost_price     INTEGER NOT NULL,              -- cents — supplier's price to us
     stock_qty      INTEGER NOT NULL DEFAULT 0,
     last_synced_at TIMESTAMPTZ,
     PRIMARY KEY (supplier_id, product_id)
   );

   CREATE TABLE dropship_orders (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id        UUID NOT NULL REFERENCES orders(id),
     supplier_id     UUID NOT NULL REFERENCES suppliers(id),
     supplier_order_ref VARCHAR(64),               -- supplier's order number
     status          VARCHAR(24) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'submitted', 'confirmed', 'shipped', 'failed')),
     total_cost      INTEGER NOT NULL,             -- cents, what we pay the supplier
     tracking_number VARCHAR(64),
     carrier         VARCHAR(32),
     submitted_at    TIMESTAMPTZ,
     confirmed_at    TIMESTAMPTZ,
     shipped_at      TIMESTAMPTZ,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. **Route an order to the correct supplier**

   ```typescript
   async function routeOrderToSupplier(orderId: string): Promise<DropshipOrder[]> {
     const orderLines = await db.orderLines.findByOrderId(orderId);
     const dropshipOrders: DropshipOrder[] = [];

     // Group lines by supplier
     const linesBySupplier = new Map<string, typeof orderLines>();

     for (const line of orderLines) {
       const supplierProduct = await selectBestSupplier(line.product_id, line.quantity);
       if (!supplierProduct) throw new Error(`No supplier available for product ${line.product_id}`);

       const key = supplierProduct.supplier_id;
       if (!linesBySupplier.has(key)) linesBySupplier.set(key, []);
       linesBySupplier.get(key)!.push({ ...line, supplierSku: supplierProduct.supplier_sku, costPrice: supplierProduct.cost_price });
     }

     // Create a dropship order per supplier
     for (const [supplierId, lines] of linesBySupplier) {
       const totalCost = lines.reduce((sum, l) => sum + l.costPrice * l.quantity, 0);
       const dropshipOrder = await db.dropshipOrders.insert({
         order_id: orderId,
         supplier_id: supplierId,
         total_cost: totalCost,
         status: 'pending',
       });
       dropshipOrders.push(dropshipOrder);
     }

     return dropshipOrders;
   }

   async function selectBestSupplier(productId: string, requiredQty: number) {
     // Pick the cheapest in-stock supplier with enough quantity
     return db.supplierProducts.findOne({
       product_id: productId,
       stock_qty: { gte: requiredQty },
       is_active: true,
     }, { orderBy: ['cost_price', 'asc'] });
   }
   ```

3. **Submit a dropship order to a supplier API**

   ```typescript
   async function submitDropshipOrder(dropshipOrderId: string): Promise<void> {
     const dropshipOrder = await db.dropshipOrders.findById(dropshipOrderId);
     const supplier = await db.suppliers.findById(dropshipOrder.supplier_id);
     const order = await db.orders.findById(dropshipOrder.order_id);

     if (supplier.order_method !== 'api') {
       // Handle email/EDI/CSV separately
       await submitViaEmail(dropshipOrder, supplier, order);
       return;
     }

     const payload = {
       reference: dropshipOrder.id,
       ship_to: {
         name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
         address1: order.shipping_address.line1,
         city: order.shipping_address.city,
         state: order.shipping_address.state,
         zip: order.shipping_address.zip,
         country: order.shipping_address.country,
       },
       items: (await db.orderLines.findByOrderId(order.id)).map(line => ({
         sku: line.supplier_sku,
         qty: line.quantity,
       })),
     };

     const response = await fetch(supplier.api_endpoint + '/orders', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${decryptApiKey(supplier.api_key)}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(payload),
     });

     if (!response.ok) {
       await db.dropshipOrders.update(dropshipOrderId, { status: 'failed' });
       throw new Error(`Supplier API error: ${response.status} ${await response.text()}`);
     }

     const result = await response.json();

     await db.dropshipOrders.update(dropshipOrderId, {
       status: 'submitted',
       supplier_order_ref: result.order_id,
       submitted_at: new Date(),
     });
   }
   ```

4. **Sync supplier inventory via CSV/API feed**

   ```typescript
   import { parse } from 'csv-parse/sync';

   async function syncSupplierInventory(supplierId: string): Promise<void> {
     const supplier = await db.suppliers.findById(supplierId);
     let rows: Array<{ sku: string; qty: number; price: number }> = [];

     if (supplier.order_method === 'csv_ftp') {
       const csvBuffer = await downloadFtpFile(supplier.ftp_config, supplier.inventory_filename);
       rows = parse(csvBuffer, { columns: true, skip_empty_lines: true }).map((r: any) => ({
         sku: r['SKU'],
         qty: parseInt(r['QUANTITY'], 10),
         price: Math.round(parseFloat(r['COST']) * 100),
       }));
     } else {
       const resp = await fetch(supplier.api_endpoint + '/inventory', {
         headers: { Authorization: `Bearer ${decryptApiKey(supplier.api_key)}` },
       });
       rows = (await resp.json()).items;
     }

     // Bulk upsert supplier inventory
     for (const row of rows) {
       await db.raw(`
         UPDATE supplier_products
         SET stock_qty = ?, cost_price = ?, last_synced_at = NOW()
         WHERE supplier_id = ? AND supplier_sku = ?
       `, [row.qty, row.price, supplierId, row.sku]);
     }

     // Zero out any SKUs not in the feed (discontinued items)
     const activeSKUs = new Set(rows.map(r => r.sku));
     const allSupplierProducts = await db.supplierProducts.findBySupplierId(supplierId);
     for (const sp of allSupplierProducts) {
       if (!activeSKUs.has(sp.supplier_sku)) {
         await db.supplierProducts.update({ supplier_id: supplierId, supplier_sku: sp.supplier_sku }, { stock_qty: 0 });
       }
     }
   }
   ```

5. **Calculate and report dropship margin per order**

   ```typescript
   async function calculateDropshipMargin(orderId: string): Promise<{
     revenue: number;
     cost: number;
     grossMarginCents: number;
     grossMarginPct: number;
   }> {
     const order = await db.orders.findById(orderId);
     const dropshipOrders = await db.dropshipOrders.findByOrderId(orderId);

     const revenue = order.subtotal_cents;
     const cost = dropshipOrders.reduce((sum, ds) => sum + ds.total_cost, 0);
     const grossMarginCents = revenue - cost;
     const grossMarginPct = revenue > 0 ? (grossMarginCents / revenue) * 100 : 0;

     return { revenue, cost, grossMarginCents, grossMarginPct };
   }
   ```

## Examples

### Inventory sync scheduled job

```typescript
import { CronJob } from 'cron';

// Sync all active suppliers every 4 hours
new CronJob('0 */4 * * *', async () => {
  const suppliers = await db.suppliers.findAll({ is_active: true });
  await Promise.allSettled(
    suppliers.map(s => syncSupplierInventory(s.id)
      .catch(err => console.error(`Sync failed for supplier ${s.name}:`, err))
    )
  );
}, null, true);
```

### Margin report by supplier

```sql
SELECT
  s.name AS supplier,
  COUNT(DISTINCT ds.order_id) AS orders,
  SUM(o.subtotal_cents) / 100.0 AS revenue,
  SUM(ds.total_cost) / 100.0 AS cost,
  (SUM(o.subtotal_cents) - SUM(ds.total_cost)) / 100.0 AS gross_margin,
  ROUND((1.0 - SUM(ds.total_cost)::numeric / NULLIF(SUM(o.subtotal_cents), 0)) * 100, 1) AS margin_pct
FROM dropship_orders ds
JOIN suppliers s ON s.id = ds.supplier_id
JOIN orders o ON o.id = ds.order_id
WHERE ds.status IN ('confirmed', 'shipped')
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.name
ORDER BY gross_margin DESC;
```

## Best Practices

- **Encrypt supplier API keys at rest** — use AES-256 or a secrets manager (AWS Secrets Manager, HashiCorp Vault); never store plaintext credentials in the database
- **Design for partial failures** — if a multi-supplier order has one supplier fail, retry only that supplier's sub-order rather than the entire order
- **Maintain a 24-hour inventory buffer** — don't sell items where `stock_qty <= 0` in your supplier feed; also avoid selling the last few units unless the supplier feed is near-real-time
- **Store supplier order references** — always save the supplier's order confirmation number in `supplier_order_ref` so customer service can look up shipments directly with the supplier
- **Track lead times per supplier** — use the `lead_time_days` column to compute accurate estimated delivery dates for dropship items, separate from your own warehouse lead times
- **Send tracking to customers immediately when supplier confirms shipment** — suppliers often provide tracking 24–48 hours after order submission; watch for webhooks or poll their API
- **Reconcile supplier invoices against dropship orders monthly** — compare `total_cost` recorded at order time against the supplier's actual invoice to catch pricing discrepancies

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer orders an item that supplier marks out of stock 1 hour later | Sync inventory every 4 hours and add a buffer (don't sell last 5 units); for high-velocity SKUs, sync more frequently |
| Supplier ships order with incorrect items | Add an order confirmation webhook handler that validates the supplier's confirmed line items match your submitted order |
| Dropship order is duplicated when the submission times out | Use idempotency keys in supplier API calls; check for existing `supplier_order_ref` before re-submitting |
| Margin calculation ignores shipping costs absorbed by store | Subtract the shipping cost passed to the customer from the revenue, and add the supplier's shipping charge to the cost, for accurate net margin |

## Related Skills

- @order-fulfillment-workflow
- @vendor-management
- @shipment-tracking
- @multi-channel-selling
- @order-management-system
