---
name: order-fulfillment-workflow
description: "Streamline your warehouse with digital pick-pack-ship workflows, barcode scanning for accuracy, and automatic packing slip generation"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [fulfillment, pick-pack-ship, warehouse, barcode-scanning, packing-slip, wms]
triggers: ["order fulfillment", "pick pack ship", "warehouse workflow", "packing slip", "barcode scanning fulfillment", "warehouse management"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Order Fulfillment Workflow

## Overview

Implement a pick-pack-ship fulfillment pipeline that takes a paid order from "awaiting fulfillment" through picking, packing, and shipping stages. Includes barcode-scan verification to prevent pick errors, PDF packing slip generation, and carrier label creation. Designed to integrate with a warehouse management system (WMS) or run as the WMS itself for smaller operations.

## When to Use This Skill

- When building internal warehouse tooling to replace manual spreadsheet-based picking processes
- When setting up a new fulfillment operation and need a structured workflow from day one
- When integrating with a third-party logistics (3PL) provider that requires a standardized order feed
- When adding pick verification to reduce mis-ships and customer complaints
- When you need to support both single-order picking and batch picking for efficiency

## Prerequisites & Platform Notes

**Shopify**: Use Shopify Shipping (carrier-calculated rates), Shopify Fulfillment Network, or apps like ShipStation. The Fulfillment API handles custom fulfillment workflows.
**WooCommerce**: Use WooCommerce Shipping or plugins (ShipStation, WooCommerce Table Rate Shipping). Extend with woocommerce_shipping_methods filter.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with shipping configured, carrier API accounts if using custom rates

## Core Instructions

1. **Design the fulfillment state machine**

   ```typescript
   type FulfillmentStatus =
     | 'awaiting_fulfillment'
     | 'pick_pending'
     | 'picking'
     | 'picked'
     | 'packing'
     | 'packed'
     | 'label_created'
     | 'shipped'
     | 'delivered';

   const VALID_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
     awaiting_fulfillment: ['pick_pending'],
     pick_pending:         ['picking'],
     picking:              ['picked', 'pick_pending'],  // can return to pending on error
     picked:               ['packing'],
     packing:              ['packed'],
     packed:               ['label_created'],
     label_created:        ['shipped'],
     shipped:              ['delivered'],
     delivered:            [],
   };

   async function transitionFulfillment(
     fulfillmentId: string,
     newStatus: FulfillmentStatus,
     actorId: string
   ): Promise<void> {
     const fulfillment = await db.fulfillments.findById(fulfillmentId);
     const allowed = VALID_TRANSITIONS[fulfillment.status];

     if (!allowed.includes(newStatus)) {
       throw new Error(`Invalid transition: ${fulfillment.status} → ${newStatus}`);
     }

     await db.transaction(async tx => {
       await tx.fulfillments.update(fulfillmentId, {
         status: newStatus,
         updated_at: new Date(),
       });
       await tx.fulfillmentEvents.insert({
         fulfillment_id: fulfillmentId,
         from_status: fulfillment.status,
         to_status: newStatus,
         actor_id: actorId,
         timestamp: new Date(),
       });
     });
   }
   ```

2. **Generate a pick list for warehouse staff**

   ```typescript
   interface PickListItem {
     orderLineId: string;
     orderId: string;
     sku: string;
     productName: string;
     quantity: number;
     binLocation: string;   // warehouse shelf location, e.g. "A3-04-2"
     barcode: string;
   }

   async function generatePickList(orderIds: string[]): Promise<PickListItem[]> {
     const lines = await db.raw(`
       SELECT
         ol.id AS order_line_id,
         ol.order_id,
         p.sku,
         p.name AS product_name,
         ol.quantity,
         w.bin_location,
         p.barcode
       FROM order_lines ol
       JOIN products p ON p.id = ol.product_id
       LEFT JOIN warehouse_locations w ON w.product_id = p.id
       WHERE ol.order_id = ANY(?)
       ORDER BY w.bin_location  -- sort by warehouse location for efficient picking path
     `, [orderIds]);

     return lines.rows;
   }
   ```

3. **Barcode scan verification during picking**

   ```typescript
   async function verifyPickScan(
     fulfillmentId: string,
     orderLineId: string,
     scannedBarcode: string,
     pickedQuantity: number
   ): Promise<{ verified: boolean; errorMessage?: string }> {
     const line = await db.orderLines.findById(orderLineId);
     const product = await db.products.findById(line.product_id);

     if (product.barcode !== scannedBarcode && product.sku !== scannedBarcode) {
       return {
         verified: false,
         errorMessage: `Wrong item scanned. Expected: ${product.sku}, got: ${scannedBarcode}`,
       };
     }

     if (pickedQuantity !== line.quantity) {
       return {
         verified: false,
         errorMessage: `Quantity mismatch. Expected: ${line.quantity}, picked: ${pickedQuantity}`,
       };
     }

     // Record the pick verification
     await db.pickVerifications.insert({
       fulfillment_id: fulfillmentId,
       order_line_id: orderLineId,
       scanned_barcode: scannedBarcode,
       picked_quantity: pickedQuantity,
       verified_at: new Date(),
     });

     return { verified: true };
   }

   async function markOrderFullyPicked(fulfillmentId: string, actorId: string): Promise<void> {
     const fulfillment = await db.fulfillments.findById(fulfillmentId);
     const allLines = await db.orderLines.findByOrderId(fulfillment.order_id);
     const verifiedLines = await db.pickVerifications.findByFulfillmentId(fulfillmentId);

     if (verifiedLines.length < allLines.length) {
       throw new Error(`Not all lines verified: ${verifiedLines.length}/${allLines.length}`);
     }

     await transitionFulfillment(fulfillmentId, 'picked', actorId);
   }
   ```

4. **Generate a PDF packing slip**

   ```typescript
   import PDFDocument from 'pdfkit';
   import { Writable } from 'stream';

   async function generatePackingSlip(orderId: string): Promise<Buffer> {
     const order = await db.orders.findById(orderId);
     const lines = await db.orderLines.findByOrderId(orderId);
     const customer = await db.customers.findById(order.customer_id);

     return new Promise((resolve, reject) => {
       const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, left: 50, right: 50, bottom: 50 } });
       const chunks: Buffer[] = [];

       doc.on('data', chunk => chunks.push(chunk));
       doc.on('end', () => resolve(Buffer.concat(chunks)));
       doc.on('error', reject);

       // Header
       doc.fontSize(20).text('PACKING SLIP', { align: 'center' });
       doc.moveDown();
       doc.fontSize(12).text(`Order #${order.order_number}`, { align: 'right' });
       doc.text(`Date: ${order.created_at.toLocaleDateString()}`, { align: 'right' });

       // Ship-to address
       doc.moveDown().fontSize(14).text('Ship To:');
       doc.fontSize(12)
         .text(`${customer.name}`)
         .text(order.shipping_address.line1)
         .text(`${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}`)
         .text(order.shipping_address.country);

       // Line items table
       doc.moveDown().fontSize(14).text('Items:');
       for (const line of lines) {
         doc.fontSize(12).text(`${line.product_name}  ×${line.quantity}`, { continued: true });
         doc.text(`  SKU: ${line.sku}`, { align: 'right' });
       }

       doc.end();
     });
   }
   ```

5. **Create a shipping label via carrier API and mark as shipped**

   ```typescript
   import Shippo from 'shippo';
   const shippo = Shippo(process.env.SHIPPO_API_KEY);

   async function createShippingLabel(fulfillmentId: string): Promise<string> {
     const fulfillment = await db.fulfillments.findById(fulfillmentId);
     const order = await db.orders.findById(fulfillment.order_id);

     const shipment = await shippo.shipment.create({
       address_from: {
         name: process.env.WAREHOUSE_NAME,
         street1: process.env.WAREHOUSE_ADDRESS,
         city: process.env.WAREHOUSE_CITY,
         state: process.env.WAREHOUSE_STATE,
         zip: process.env.WAREHOUSE_ZIP,
         country: 'US',
       },
       address_to: {
         name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
         street1: order.shipping_address.line1,
         city: order.shipping_address.city,
         state: order.shipping_address.state,
         zip: order.shipping_address.zip,
         country: order.shipping_address.country,
         email: order.customer_email,
       },
       parcels: [{
         length: fulfillment.package_length_in,
         width: fulfillment.package_width_in,
         height: fulfillment.package_height_in,
         distance_unit: 'in',
         weight: fulfillment.package_weight_oz,
         mass_unit: 'oz',
       }],
       async: false,
     });

     const rate = shipment.rates.find(r => r.servicelevel.token === order.shipping_service) ?? shipment.rates[0];
     const transaction = await shippo.transaction.create({ rate: rate.object_id, label_file_type: 'PDF' });

     await db.fulfillments.update(fulfillmentId, {
       tracking_number: transaction.tracking_number,
       carrier: rate.provider,
       label_url: transaction.label_url,
     });

     await transitionFulfillment(fulfillmentId, 'label_created', 'system');
     return transaction.label_url;
   }
   ```

## Examples

### Batch pick list for 20 orders — consolidated by SKU

```sql
SELECT
  p.sku,
  p.name,
  SUM(ol.quantity) AS total_to_pick,
  w.bin_location,
  STRING_AGG(o.order_number, ', ' ORDER BY o.order_number) AS order_numbers
FROM order_lines ol
JOIN orders o ON o.id = ol.order_id
JOIN products p ON p.id = ol.product_id
LEFT JOIN warehouse_locations w ON w.product_id = p.id
WHERE o.id = ANY($1)
GROUP BY p.sku, p.name, w.bin_location
ORDER BY w.bin_location;
```

### Mobile scanner API endpoint

```typescript
// POST /api/fulfillment/:fulfillmentId/scan
app.post('/api/fulfillment/:fulfillmentId/scan', requireWarehouseRole, async (req, res) => {
  const { orderLineId, barcode, quantity } = req.body;
  const result = await verifyPickScan(req.params.fulfillmentId, orderLineId, barcode, quantity);

  if (!result.verified) {
    return res.status(422).json({ error: result.errorMessage });
  }

  res.json({ success: true, message: 'Item verified' });
});
```

## Best Practices

- **Enforce barcode verification at pick time** — scanning prevents the most common fulfillment error (wrong item or quantity); never allow workers to manually override scan verification
- **Sort pick lists by bin location** — route pickers through the warehouse in an optimal path (by aisle, then shelf) to minimize travel time; a 20% reduction in walk time is common
- **Generate packing slips server-side** — avoid client-side PDF generation for documents that go into boxes; server-generated PDFs are reproducible and archivable
- **Store label URLs rather than the label binary** — carrier API labels are available via URL for up to 90 days; storing the URL keeps your database lean
- **Send tracking numbers to customers immediately** — trigger a tracking email as soon as `label_created` status is reached, not when the carrier scans the package
- **Record every scan in a verification log** — the pick verification table serves as an audit trail if a customer claims they received the wrong item
- **Support batch picking for small items** — for orders containing many small items, let a single picker collect all SKUs for multiple orders in one pass, then sort at the packing station

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Order ships with missing items | Enforce `markOrderFullyPicked` check that verifies every order line has a pick verification before advancing to `picked` |
| Carrier label created but not printed | Store `label_url` immediately; implement a print queue that retries printing until confirmed |
| Fulfillment status drifts out of sync with carrier tracking | Use carrier webhooks (via @shipment-tracking) to update `shipped` and `delivered` statuses automatically |
| Multiple warehouse staff pick the same order concurrently | Assign fulfillments to specific pickers and lock the record (`SELECT FOR UPDATE`) when transitioning to `picking` |

## Related Skills

- @shipment-tracking
- @returns-management
- @order-management-system
- @international-shipping
- @dropshipping-integration
