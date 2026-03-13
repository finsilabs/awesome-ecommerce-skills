---
name: vendor-management
description: "Manage supplier relationships with a portal for purchase orders, dropship routing, delivery tracking, and vendor performance scorecards"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [vendor-management, purchase-orders, supplier-portal, performance-scorecard, dropshipping, procurement]
triggers: ["vendor management", "supplier portal", "purchase orders", "vendor performance", "supplier scorecard", "procurement system"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Vendor Management

## Overview

Build a vendor management system with a self-service supplier portal for order acknowledgment and shipment confirmation, purchase order creation and tracking, dropship order routing, and automated performance scorecards that measure on-time shipment rate, order accuracy, and defect rate. Gives operations teams visibility into supplier performance and enables data-driven vendor negotiations.

## When to Use This Skill

- When managing 5+ suppliers and need a centralized portal instead of email-based coordination
- When your merchandising team manually creates purchase orders in spreadsheets and needs automation
- When onboarding new dropship suppliers and need a structured integration flow
- When preparing quarterly business reviews with suppliers and need performance metrics
- When building a multi-vendor marketplace where each seller needs their own dashboard

## Prerequisites & Platform Notes

**Shopify**: Integrate with Shopify via Admin API for orders, customers, and inventory. Use Shopify Flow for automation. Connect ERP/OMS via apps or custom webhooks.
**WooCommerce**: Use WooCommerce REST API for order/inventory data. Automate with AutomateWoo or custom WordPress cron jobs. Connect external systems via webhooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A running store, API access, relevant third-party accounts (ERP, OMS, etc.)

## Core Instructions

1. **Design the vendor schema**

   ```sql
   CREATE TABLE vendors (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name           VARCHAR(128) NOT NULL,
     contact_name   VARCHAR(128),
     contact_email  VARCHAR(255) NOT NULL UNIQUE,
     payment_terms  VARCHAR(32) DEFAULT 'net30',  -- 'net30', 'net60', 'prepay'
     lead_time_days INTEGER NOT NULL DEFAULT 7,
     currency       VARCHAR(3) NOT NULL DEFAULT 'USD',
     status         VARCHAR(16) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive', 'probation')),
     created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE purchase_orders (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     po_number      VARCHAR(32) NOT NULL UNIQUE,
     vendor_id      UUID NOT NULL REFERENCES vendors(id),
     status         VARCHAR(24) NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'submitted', 'acknowledged', 'partial', 'received', 'cancelled')),
     expected_delivery DATE,
     total_cost     INTEGER NOT NULL DEFAULT 0,  -- cents
     submitted_at   TIMESTAMPTZ,
     acknowledged_at TIMESTAMPTZ,
     created_by     UUID NOT NULL,
     created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE po_lines (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     po_id          UUID NOT NULL REFERENCES purchase_orders(id),
     product_id     UUID NOT NULL REFERENCES products(id),
     vendor_sku     VARCHAR(64),
     quantity_ordered INTEGER NOT NULL,
     quantity_received INTEGER NOT NULL DEFAULT 0,
     unit_cost      INTEGER NOT NULL,  -- cents
     line_total     INTEGER GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED
   );
   ```

2. **Create a purchase order**

   ```typescript
   async function createPurchaseOrder(params: {
     vendorId: string;
     lines: { productId: string; quantity: number; unitCostCents: number }[];
     expectedDelivery: Date;
     createdBy: string;
   }): Promise<PurchaseOrder> {
     const poNumber = await generatePoNumber();
     const totalCost = params.lines.reduce((s, l) => s + l.quantity * l.unitCostCents, 0);

     return db.transaction(async tx => {
       const po = await tx.purchaseOrders.insert({
         po_number: poNumber,
         vendor_id: params.vendorId,
         status: 'draft',
         expected_delivery: params.expectedDelivery.toISOString().slice(0, 10),
         total_cost: totalCost,
         created_by: params.createdBy,
       });

       await tx.poLines.insertMany(
         params.lines.map(l => ({
           po_id: po.id,
           product_id: l.productId,
           quantity_ordered: l.quantity,
           unit_cost: l.unitCostCents,
         }))
       );

       return po;
     });
   }

   async function generatePoNumber(): Promise<string> {
     const year = new Date().getFullYear();
     const month = String(new Date().getMonth() + 1).padStart(2, '0');
     const seq = await db.raw("SELECT nextval('po_sequence') AS n").then(r => r.rows[0].n);
     return `PO-${year}${month}-${String(seq).padStart(4, '0')}`;
   }
   ```

3. **Vendor portal — acknowledge PO**

   ```typescript
   // Vendors authenticate via a token-based portal link sent in the PO email
   app.post('/vendor-portal/purchase-orders/:poId/acknowledge', requireVendorAuth, async (req, res) => {
     const { confirmedDeliveryDate, notes } = req.body;
     const po = await db.purchaseOrders.findById(req.params.poId);

     if (po.vendor_id !== req.vendor.id) return res.status(403).json({ error: 'Forbidden' });
     if (po.status !== 'submitted') return res.status(422).json({ error: 'PO already acknowledged' });

     await db.purchaseOrders.update(po.id, {
       status: 'acknowledged',
       acknowledged_at: new Date(),
       expected_delivery: confirmedDeliveryDate,
     });

     await db.vendorComments.insert({ po_id: po.id, vendor_id: req.vendor.id, comment: notes });

     // Notify buyer
     await emailService.send({
       to: await getBuyerEmail(po.created_by),
       template: 'po-acknowledged',
       data: { poNumber: po.po_number, confirmedDate: confirmedDeliveryDate },
     });

     res.json({ success: true });
   });
   ```

4. **Record goods received and update inventory**

   ```typescript
   async function receiveGoodsAgainstPO(
     poId: string,
     receipts: { poLineId: string; quantityReceived: number; condition: 'good' | 'damaged' }[]
   ): Promise<void> {
     await db.transaction(async tx => {
       let allReceived = true;

       for (const receipt of receipts) {
         const line = await tx.poLines.findById(receipt.poLineId);
         const newQtyReceived = line.quantity_received + receipt.quantityReceived;

         await tx.poLines.update(receipt.poLineId, { quantity_received: newQtyReceived });

         if (newQtyReceived < line.quantity_ordered) allReceived = false;

         // Update inventory
         if (receipt.condition === 'good') {
           await tx.products.incrementInventory(line.product_id, receipt.quantityReceived);
         } else {
           await tx.damagedGoods.insert({
             po_line_id: receipt.poLineId,
             quantity: receipt.quantityReceived,
             received_at: new Date(),
           });
         }
       }

       const newStatus = allReceived ? 'received' : 'partial';
       await tx.purchaseOrders.update(poId, { status: newStatus });
     });
   }
   ```

5. **Calculate vendor performance scorecard**

   ```typescript
   async function generateVendorScorecard(
     vendorId: string,
     periodDays = 90
   ): Promise<{
     onTimeRate: number;
     fillRate: number;
     defectRate: number;
     overallScore: number;
   }> {
     const since = new Date(Date.now() - periodDays * 86400000);

     const pos = await db.purchaseOrders.findAll({
       vendor_id: vendorId,
       status: { in: ['received', 'partial'] },
       created_at: { gte: since },
     });

     if (pos.length === 0) return { onTimeRate: 0, fillRate: 0, defectRate: 0, overallScore: 0 };

     // On-time rate: % of POs where actual receipt <= expected_delivery
     const onTimeCount = pos.filter(po => po.received_at && po.received_at <= new Date(po.expected_delivery + 'T23:59:59Z')).length;

     // Fill rate: total units received / total units ordered
     const allLines = await db.poLines.findByPoIds(pos.map(p => p.id));
     const totalOrdered = allLines.reduce((s, l) => s + l.quantity_ordered, 0);
     const totalReceived = allLines.reduce((s, l) => s + l.quantity_received, 0);

     // Defect rate: damaged units / total received
     const totalDamaged = await db.damagedGoods.sumByVendor(vendorId, since);

     const onTimeRate = onTimeCount / pos.length;
     const fillRate = totalOrdered > 0 ? totalReceived / totalOrdered : 0;
     const defectRate = totalReceived > 0 ? totalDamaged / totalReceived : 0;

     // Weighted overall score (0–100)
     const overallScore = Math.round(
       (onTimeRate * 40 + fillRate * 40 + (1 - defectRate) * 20) * 100
     );

     return { onTimeRate, fillRate, defectRate, overallScore };
   }
   ```

## Examples

### Auto-submit PO via email to vendor

```typescript
async function submitPurchaseOrder(poId: string): Promise<void> {
  const po = await db.purchaseOrders.findById(poId);
  const vendor = await db.vendors.findById(po.vendor_id);
  const lines = await db.poLines.findByPoId(poId);
  const portalToken = await generatePortalToken(vendor.id, poId);

  await emailService.send({
    to: vendor.contact_email,
    template: 'purchase-order',
    data: {
      poNumber: po.po_number,
      lines: lines.map(l => ({ sku: l.vendor_sku, qty: l.quantity_ordered, unitCost: l.unit_cost / 100 })),
      totalCost: (po.total_cost / 100).toFixed(2),
      expectedDelivery: po.expected_delivery,
      acknowledgeUrl: `${process.env.VENDOR_PORTAL_URL}/po/${poId}?token=${portalToken}`,
    },
  });

  await db.purchaseOrders.update(poId, { status: 'submitted', submitted_at: new Date() });
}
```

### Scorecard dashboard query

```sql
SELECT
  v.name AS vendor,
  COUNT(po.id) AS total_pos,
  ROUND(AVG(CASE WHEN po.received_at <= (po.expected_delivery + INTERVAL '1 day') THEN 1.0 ELSE 0.0 END) * 100, 1) AS on_time_pct,
  ROUND(SUM(pl.quantity_received)::numeric / NULLIF(SUM(pl.quantity_ordered), 0) * 100, 1) AS fill_rate_pct
FROM vendors v
JOIN purchase_orders po ON po.vendor_id = v.id
JOIN po_lines pl ON pl.po_id = po.id
WHERE po.created_at >= NOW() - INTERVAL '90 days'
  AND po.status IN ('received', 'partial')
GROUP BY v.id, v.name
ORDER BY on_time_pct DESC;
```

## Best Practices

- **Send PO acknowledgment requests with a deep link** — vendors should be able to confirm a PO in one click from email; requiring them to log into a portal raises the bar too high for low-tech suppliers
- **Set expected delivery dates conservatively** — add the vendor's `lead_time_days` plus a 2-day buffer when calculating `expected_delivery`; this improves on-time rates without changing actual lead times
- **Track partial receipts** — many POs arrive in multiple shipments; `partial` status and per-line `quantity_received` tracking prevents premature inventory reconciliation
- **Record defects at receiving time** — damaged goods should be logged immediately at the dock with photos; don't rely on retrospective recall for scorecard accuracy
- **Share scorecards with vendors quarterly** — vendors who see their metrics improve performance; use the data as leverage in pricing negotiations
- **Rotate portal tokens** — generate short-lived tokens (7-day expiry) for vendor portal access; never use persistent passwords for external access

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| PO total doesn't match invoice amount | Store unit costs at the PO line level and never update them retroactively; any price discrepancy becomes a flag for accounts payable review |
| Vendor acknowledges a PO but ships to the wrong address | Include the ship-to address in the PO email body AND the portal confirmation screen; require the vendor to confirm the address |
| Inventory is incremented before damaged goods are segregated | Only call `incrementInventory` for `condition === 'good'` receipts; damaged goods go to a quarantine table |
| Multiple buyers send duplicate POs to the same vendor | Add a unique constraint on PO number and use a sequence for generation; lock the sequence before inserting |

## Related Skills

- @dropshipping-integration
- @order-management-system
- @multi-channel-selling
- @demand-forecasting
- @b2b-commerce
