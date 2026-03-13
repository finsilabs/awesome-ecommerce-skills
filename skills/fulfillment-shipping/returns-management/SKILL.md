---
name: returns-management
description: "Process returns end to end — generate prepaid labels, apply refund or exchange logic, update inventory, and notify customers automatically"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [returns, rma, refunds, exchanges, return-labels, restocking, reverse-logistics]
triggers: ["returns management", "RMA", "return merchandise authorization", "return label", "refund processing", "exchange workflow"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Returns Management

## Overview

Build a return merchandise authorization (RMA) system that lets customers initiate returns, generates prepaid shipping labels, processes refunds or exchanges upon receipt, and handles inventory restocking. The workflow enforces configurable return windows, reason codes, and restocking fee rules while keeping customers informed at every stage.

## When to Use This Skill

- When launching a self-service returns portal to reduce customer service workload
- When you need a structured RMA process with tracking numbers to prevent refund fraud
- When building logic that differentiates between "refund to original payment", "store credit", and "exchange" resolutions
- When integrating return label generation with carrier APIs (UPS, FedEx, USPS)
- When managing restocking — deciding whether returned items go back to sellable inventory or to a quarantine bin

## Core Instructions

1. **Design the RMA schema**

   ```sql
   CREATE TABLE return_requests (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     rma_number     VARCHAR(32) NOT NULL UNIQUE,  -- human-readable, e.g. "RMA-2026-00042"
     order_id       UUID NOT NULL REFERENCES orders(id),
     customer_id    UUID NOT NULL,
     status         VARCHAR(24) NOT NULL DEFAULT 'requested'
                      CHECK (status IN ('requested', 'approved', 'label_issued', 'in_transit',
                                        'received', 'inspecting', 'resolved', 'rejected')),
     resolution     VARCHAR(16)
                      CHECK (resolution IN ('refund', 'exchange', 'store_credit')),
     return_reason  VARCHAR(64) NOT NULL,
     customer_notes TEXT,
     staff_notes    TEXT,
     restocking_fee INTEGER NOT NULL DEFAULT 0,  -- cents
     created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     resolved_at    TIMESTAMPTZ
   );

   CREATE TABLE return_lines (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     return_request_id UUID NOT NULL REFERENCES return_requests(id),
     order_line_id   UUID NOT NULL REFERENCES order_lines(id),
     quantity        INTEGER NOT NULL,
     condition       VARCHAR(16) CHECK (condition IN ('new', 'like_new', 'damaged', 'defective')),
     restock_quantity INTEGER NOT NULL DEFAULT 0,
     quarantine_quantity INTEGER NOT NULL DEFAULT 0
   );

   CREATE TABLE return_shipments (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     return_request_id UUID NOT NULL REFERENCES return_requests(id),
     tracking_number VARCHAR(64),
     carrier         VARCHAR(32),
     label_url       TEXT,
     received_at     TIMESTAMPTZ
   );
   ```

2. **Initiate a return request (customer-facing)**

   ```typescript
   async function createReturnRequest(params: {
     orderId: string;
     customerId: string;
     lines: { orderLineId: string; quantity: number; reason: string }[];
     resolution: 'refund' | 'exchange' | 'store_credit';
     notes?: string;
   }): Promise<ReturnRequest> {
     const order = await db.orders.findById(params.orderId);

     // Validate return window
     const returnWindowDays = await getReturnWindowDays(order);
     const daysSincePurchase = Math.floor((Date.now() - order.created_at.getTime()) / 86400000);
     if (daysSincePurchase > returnWindowDays) {
       throw new Error(`Return window of ${returnWindowDays} days has passed`);
     }

     // Validate customer owns this order
     if (order.customer_id !== params.customerId) throw new Error('Order not found');

     const rmaNumber = await generateRmaNumber();

     return db.transaction(async tx => {
       const rma = await tx.returnRequests.insert({
         rma_number: rmaNumber,
         order_id: params.orderId,
         customer_id: params.customerId,
         status: 'requested',
         resolution: params.resolution,
         return_reason: params.lines[0].reason,
         customer_notes: params.notes,
       });

       await tx.returnLines.insertMany(
         params.lines.map(l => ({
           return_request_id: rma.id,
           order_line_id: l.orderLineId,
           quantity: l.quantity,
         }))
       );

       return rma;
     });
   }

   async function generateRmaNumber(): Promise<string> {
     const year = new Date().getFullYear();
     const seq = await db.raw("SELECT nextval('rma_sequence') AS n").then(r => r.rows[0].n);
     return `RMA-${year}-${String(seq).padStart(5, '0')}`;
   }
   ```

3. **Approve the RMA and generate a prepaid return label**

   ```typescript
   import Shippo from 'shippo';
   const shippo = Shippo(process.env.SHIPPO_API_KEY);

   async function approveReturnAndIssueLabel(
     returnRequestId: string,
     staffId: string
   ): Promise<string> {
     const rma = await db.returnRequests.findById(returnRequestId);
     const order = await db.orders.findById(rma.order_id);

     // Create a return shipment (from customer back to warehouse)
     const shipment = await shippo.shipment.create({
       address_from: {
         name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
         street1: order.shipping_address.line1,
         city: order.shipping_address.city,
         state: order.shipping_address.state,
         zip: order.shipping_address.zip,
         country: order.shipping_address.country,
       },
       address_to: {
         name: process.env.WAREHOUSE_NAME,
         street1: process.env.WAREHOUSE_ADDRESS,
         city: process.env.WAREHOUSE_CITY,
         state: process.env.WAREHOUSE_STATE,
         zip: process.env.WAREHOUSE_ZIP,
         country: 'US',
       },
       parcels: [{ length: 12, width: 10, height: 4, distance_unit: 'in', weight: 2, mass_unit: 'lb' }],
       async: false,
       is_return: true,
     });

     const rate = shipment.rates.find(r => r.servicelevel.token === 'usps_priority') ?? shipment.rates[0];
     const transaction = await shippo.transaction.create({ rate: rate.object_id, label_file_type: 'PDF' });

     await db.transaction(async tx => {
       await tx.returnShipments.insert({
         return_request_id: returnRequestId,
         tracking_number: transaction.tracking_number,
         carrier: rate.provider,
         label_url: transaction.label_url,
       });
       await tx.returnRequests.update(returnRequestId, { status: 'label_issued' });
     });

     // Email label to customer
     await emailService.send({
       to: order.customer_email,
       template: 'return-label',
       data: { rmaNumber: rma.rma_number, labelUrl: transaction.label_url },
     });

     return transaction.label_url;
   }
   ```

4. **Process received return and resolve**

   ```typescript
   async function receiveAndResolveReturn(
     returnRequestId: string,
     inspectionResults: { returnLineId: string; condition: string; restockQty: number; quarantineQty: number }[],
     staffId: string
   ): Promise<void> {
     const rma = await db.returnRequests.findById(returnRequestId);

     await db.transaction(async tx => {
       // Update line conditions and restock inventory
       for (const result of inspectionResults) {
         await tx.returnLines.update(result.returnLineId, {
           condition: result.condition,
           restock_quantity: result.restockQty,
           quarantine_quantity: result.quarantineQty,
         });

         const line = await tx.returnLines.findById(result.returnLineId);
         const orderLine = await tx.orderLines.findById(line.order_line_id);

         // Restock sellable units
         if (result.restockQty > 0) {
           await tx.products.incrementInventory(orderLine.product_id, result.restockQty);
         }
       }

       // Apply restocking fee from policy
       const restockingFee = await calculateRestockingFee(rma);

       await tx.returnRequests.update(returnRequestId, {
         status: 'received',
         restocking_fee: restockingFee,
       });
     });

     // Execute the resolution
     await executeResolution(returnRequestId);
   }

   async function executeResolution(returnRequestId: string): Promise<void> {
     const rma = await db.returnRequests.findById(returnRequestId);
     const refundAmount = await calculateRefundAmount(rma);

     if (rma.resolution === 'refund') {
       await issueRefundToOriginalPayment(rma.order_id, refundAmount);
     } else if (rma.resolution === 'store_credit') {
       await issueStoreCredit(rma.customer_id, rma.order_id, refundAmount);
     } else if (rma.resolution === 'exchange') {
       await createExchangeOrder(rma);
     }

     await db.returnRequests.update(returnRequestId, {
       status: 'resolved',
       resolved_at: new Date(),
     });
   }
   ```

5. **Calculate refund amount with restocking fee**

   ```typescript
   async function calculateRefundAmount(rma: ReturnRequest): Promise<number> {
     const lines = await db.returnLines.findByReturnRequestId(rma.id);
     let totalRefund = 0;

     for (const line of lines) {
       const orderLine = await db.orderLines.findById(line.order_line_id);
       totalRefund += orderLine.unit_price * line.quantity;
     }

     return Math.max(0, totalRefund - rma.restocking_fee);
   }
   ```

## Examples

### Return policy configuration

```typescript
const RETURN_POLICIES = {
  default: { windowDays: 30, restockingFeePct: 0 },
  electronics: { windowDays: 15, restockingFeePct: 15 },
  final_sale: { windowDays: 0, restockingFeePct: 0 },  // no returns
};

async function getReturnWindowDays(order: Order): Promise<number> {
  const categories = await db.orderLines.getProductCategories(order.id);
  if (categories.includes('electronics')) return RETURN_POLICIES.electronics.windowDays;
  if (order.tags?.includes('final_sale')) return RETURN_POLICIES.final_sale.windowDays;
  return RETURN_POLICIES.default.windowDays;
}
```

### Customer-facing return portal API

```typescript
// GET /api/orders/:orderId/return-eligibility
app.get('/api/orders/:orderId/return-eligibility', requireAuth, async (req, res) => {
  const order = await db.orders.findById(req.params.orderId);
  if (order.customer_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  const windowDays = await getReturnWindowDays(order);
  const daysSince = Math.floor((Date.now() - order.created_at.getTime()) / 86400000);
  const eligible = daysSince <= windowDays && order.status === 'delivered';

  res.json({
    eligible,
    daysRemaining: Math.max(0, windowDays - daysSince),
    reason: eligible ? null : (daysSince > windowDays ? 'WINDOW_EXPIRED' : 'ORDER_NOT_DELIVERED'),
  });
});
```

## Best Practices

- **Validate return eligibility server-side** — never trust client-side window calculations; always recompute from `order.created_at` and your policy rules
- **Generate RMA numbers sequentially and human-readable** — "RMA-2026-00042" is easier for customer service to look up than a UUID
- **Require return labels from your system** — prepaid labels let you control carrier choice, negotiate rates, and track packages; customer-supplied labels make tracking impossible
- **Segregate received returns** — create a physical and logical quarantine queue for items that need inspection before restocking; never auto-restock without inspection
- **Issue refunds after receiving the package** — never pre-authorize refunds before the return arrives; verify receipt first
- **Notify customers at every status change** — send emails at `label_issued`, `received`, and `resolved` stages; customers abandoning a return because they got no confirmation is a common issue
- **Track restocking fees separately** — record the fee as a deduction from the refund amount, not as a negative line item, to keep accounting clean

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer returns items from a different order | Validate each `order_line_id` belongs to the specified `order_id` before creating return lines |
| Restocking happens before inspection | Enforce a `inspecting` status gate between `received` and `resolved`; only increment inventory in the resolution step |
| Refund issued but carrier hasn't received package yet | Send refund only after the return shipment's `received_at` is set, not at `label_issued` |
| Exchange order uses stale pricing | Create exchange orders with current prices + apply a zero-cost adjustment line for the return credit, not the original order price |

## Related Skills

- @order-fulfillment-workflow
- @shipment-tracking
- @returns-refund-policy
- @stripe-integration
- @gift-cards
