---
name: cogs-tracking-allocation
description: "Track cost of goods sold with FIFO/LIFO/weighted average inventory valuation, landed cost allocation for imports, and variance analysis against standard costs"
category: catalog-inventory
risk: critical
source: curated
date_added: "2026-03-12"
tags: [cogs, inventory-valuation, cost-accounting]
triggers: ["track cost of goods", "inventory costing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# COGS Tracking and Allocation

## Overview

Implement cost of goods sold (COGS) tracking that maintains a perpetual inventory cost ledger, supports FIFO, LIFO, and weighted average costing methods, allocates landed costs (freight, customs, duties) across imported inventory, and produces variance reports comparing actual costs to standard costs. When a customer order ships, the system automatically computes the cost of each unit sold using the configured valuation method, posts the COGS entry, and reduces the inventory asset balance. Finance teams get an accurate gross margin per order, per SKU, and per period without manual spreadsheet work.

## When to Use This Skill

- When your income statement shows revenue but you cannot reliably compute gross margin because unit costs are not tracked per sale
- When importing goods internationally and needing to allocate freight, insurance, customs, and duties into the landed cost of each SKU
- When your accounting team wants to switch from periodic (year-end inventory count) to perpetual (real-time) cost tracking
- When building variance analysis reports to identify SKUs where actual purchase costs are drifting away from standard costs used in pricing decisions
- When an ERP integration (QuickBooks, NetSuite, Xero) requires COGS journal entries at the time of sale, not end of month

## Prerequisites & Platform Notes

**Shopify**: Shopify has built-in inventory management, product variants, and metafields. Use the Shopify Admin API for bulk operations. For advanced needs, apps like Stocky or custom Shopify Functions.
**WooCommerce**: WooCommerce has built-in stock management. Extend with plugins (ATUM, WP All Import for bulk catalog). Use WooCommerce REST API for integrations.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with product catalog access, API credentials

## Core Instructions

1. **Design the cost ledger data model**

   ```sql
   -- Inventory cost layers — each purchase order receipt creates one or more layers
   CREATE TABLE inventory_cost_layers (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     variant_id       UUID NOT NULL REFERENCES product_variants(id),
     location_id      UUID NOT NULL REFERENCES warehouse_locations(id),
     po_line_id       UUID REFERENCES po_lines(id),             -- Source PO line (null for manual)
     receipt_date     DATE NOT NULL,
     quantity_received INTEGER NOT NULL,
     quantity_remaining INTEGER NOT NULL,                       -- Decreases as units are sold
     unit_cost_cents  BIGINT NOT NULL,                          -- Purchase price per unit
     landed_cost_cents BIGINT NOT NULL DEFAULT 0,              -- Allocated freight/duties per unit
     total_unit_cost_cents BIGINT GENERATED ALWAYS AS (unit_cost_cents + landed_cost_cents) STORED,
     costing_method   VARCHAR(16) NOT NULL DEFAULT 'fifo'
                        CHECK (costing_method IN ('fifo', 'lifo', 'weighted_avg')),
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- COGS entries — one row per unit of sale (or per line item for efficiency)
   CREATE TABLE cogs_entries (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id         UUID NOT NULL REFERENCES orders(id),
     order_line_id    UUID NOT NULL REFERENCES order_lines(id),
     variant_id       UUID NOT NULL REFERENCES product_variants(id),
     location_id      UUID NOT NULL REFERENCES warehouse_locations(id),
     cost_layer_id    UUID REFERENCES inventory_cost_layers(id), -- For FIFO/LIFO traceability
     quantity         INTEGER NOT NULL,
     unit_cost_cents  BIGINT NOT NULL,
     total_cost_cents BIGINT GENERATED ALWAYS AS (quantity * unit_cost_cents) STORED,
     costing_method   VARCHAR(16) NOT NULL,
     fulfilled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Standard costs — the budgeted/target cost per variant used for variance analysis
   CREATE TABLE standard_costs (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     variant_id       UUID NOT NULL REFERENCES product_variants(id),
     effective_from   DATE NOT NULL,
     effective_to     DATE,                                      -- null = currently active
     standard_cost_cents BIGINT NOT NULL,
     set_by           UUID NOT NULL,
     notes            TEXT,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (variant_id, effective_from)
   );

   -- Landed cost shipments — one per inbound shipment
   CREATE TABLE landed_cost_shipments (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     reference        VARCHAR(64) NOT NULL,                     -- Freight invoice / shipment number
     shipped_date     DATE,
     received_date    DATE,
     freight_cents    BIGINT NOT NULL DEFAULT 0,
     insurance_cents  BIGINT NOT NULL DEFAULT 0,
     customs_cents    BIGINT NOT NULL DEFAULT 0,
     duties_cents     BIGINT NOT NULL DEFAULT 0,
     other_cents      BIGINT NOT NULL DEFAULT 0,
     total_cents      BIGINT GENERATED ALWAYS AS (
                        freight_cents + insurance_cents + customs_cents + duties_cents + other_cents
                      ) STORED,
     allocation_method VARCHAR(16) NOT NULL DEFAULT 'value'
                        CHECK (allocation_method IN ('value', 'weight', 'quantity', 'volume')),
     status           VARCHAR(16) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'allocated', 'posted')),
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE landed_cost_allocations (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     shipment_id      UUID NOT NULL REFERENCES landed_cost_shipments(id),
     cost_layer_id    UUID NOT NULL REFERENCES inventory_cost_layers(id),
     allocated_cents  BIGINT NOT NULL,                          -- Share of total landed cost
     allocation_basis BIGINT NOT NULL,                          -- The value/weight/qty used for proration
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. **Implement FIFO cost assignment when goods are sold**

   ```typescript
   async function assignCogsFifo(params: {
     orderId: string;
     orderLineId: string;
     variantId: string;
     locationId: string;
     quantity: number;
     fulfilledAt: Date;
   }): Promise<{ totalCostCents: number }> {
     let remainingToAssign = params.quantity;
     let totalCostCents = 0;

     return db.transaction(async tx => {
       // FIFO: consume oldest layers first
       const layers = await tx.inventoryCostLayers.findAll({
         where: {
           variant_id: params.variantId,
           location_id: params.locationId,
           quantity_remaining: { gt: 0 },
           costing_method: 'fifo',
         },
         orderBy: { receipt_date: 'asc', created_at: 'asc' }, // Oldest first
       });

       for (const layer of layers) {
         if (remainingToAssign <= 0) break;

         const unitsFromLayer = Math.min(remainingToAssign, layer.quantity_remaining);
         const lineCostCents = unitsFromLayer * layer.total_unit_cost_cents;

         // Consume units from this layer
         await tx.inventoryCostLayers.update(layer.id, {
           quantity_remaining: layer.quantity_remaining - unitsFromLayer,
         });

         // Record the COGS entry
         await tx.cogsEntries.create({
           data: {
             order_id: params.orderId,
             order_line_id: params.orderLineId,
             variant_id: params.variantId,
             location_id: params.locationId,
             cost_layer_id: layer.id,
             quantity: unitsFromLayer,
             unit_cost_cents: layer.total_unit_cost_cents,
             costing_method: 'fifo',
             fulfilled_at: params.fulfilledAt,
           },
         });

         totalCostCents += lineCostCents;
         remainingToAssign -= unitsFromLayer;
       }

       if (remainingToAssign > 0) {
         throw new Error(
           `Insufficient cost layers for variant ${params.variantId}: ${remainingToAssign} units uncosted`
         );
       }

       return { totalCostCents };
     });
   }
   ```

3. **Implement weighted average cost assignment**

   ```typescript
   async function assignCogsWeightedAverage(params: {
     orderId: string;
     orderLineId: string;
     variantId: string;
     locationId: string;
     quantity: number;
     fulfilledAt: Date;
   }): Promise<{ totalCostCents: number; unitCostCents: number }> {
     // Compute current weighted average cost across all layers
     const avgCost = await db.raw<{ avg_unit_cost: number }>(`
       SELECT
         COALESCE(
           SUM(quantity_remaining * total_unit_cost_cents)::numeric /
           NULLIF(SUM(quantity_remaining), 0),
           0
         ) AS avg_unit_cost
       FROM inventory_cost_layers
       WHERE variant_id   = $1
         AND location_id  = $2
         AND quantity_remaining > 0
     `, [params.variantId, params.locationId]);

     const unitCostCents = Math.round(avgCost.rows[0].avg_unit_cost);
     const totalCostCents = unitCostCents * params.quantity;

     await db.cogsEntries.create({
       data: {
         order_id: params.orderId,
         order_line_id: params.orderLineId,
         variant_id: params.variantId,
         location_id: params.locationId,
         cost_layer_id: null, // No single layer for weighted avg
         quantity: params.quantity,
         unit_cost_cents: unitCostCents,
         costing_method: 'weighted_avg',
         fulfilled_at: params.fulfilledAt,
       },
     });

     // Decrement the oldest layer(s) for inventory balance tracking
     // (We don't care which layer for cost purposes, just need to reduce quantity_remaining)
     await consumeInventoryLayersForQuantity(params.variantId, params.locationId, params.quantity);

     return { totalCostCents, unitCostCents };
   }
   ```

4. **Allocate landed costs across received inventory**

   ```typescript
   async function allocateLandedCosts(
     shipmentId: string,
     po_receipt_ids: string[] // Array of goods receipt IDs included in this shipment
   ): Promise<void> {
     const shipment = await db.landedCostShipments.findById(shipmentId);
     if (shipment.status !== 'pending') throw new Error('Shipment costs already allocated');

     // Fetch all cost layers created from these receipts
     const layers = await db.inventoryCostLayers.findAll({
       where: { po_line_id: { in: po_receipt_ids } },
     });

     if (layers.length === 0) throw new Error('No cost layers found for receipts');

     // Compute the allocation basis per layer based on the configured method
     const basisValues = await Promise.all(
       layers.map(async layer => {
         let basis: number;

         if (shipment.allocation_method === 'value') {
           basis = layer.unit_cost_cents * layer.quantity_received;
         } else if (shipment.allocation_method === 'quantity') {
           basis = layer.quantity_received;
         } else if (shipment.allocation_method === 'weight') {
           const variant = await db.productVariants.findById(layer.variant_id);
           basis = (variant.weight_grams ?? 100) * layer.quantity_received;
         } else if (shipment.allocation_method === 'volume') {
           const variant = await db.productVariants.findById(layer.variant_id);
           const vol = (variant.length_cm ?? 10) * (variant.width_cm ?? 10) * (variant.height_cm ?? 10);
           basis = vol * layer.quantity_received;
         } else {
           basis = layer.quantity_received;
         }

         return { layerId: layer.id, basis };
       })
     );

     const totalBasis = basisValues.reduce((s, b) => s + b.basis, 0);

     await db.transaction(async tx => {
       for (const { layerId, basis } of basisValues) {
         const layer = layers.find(l => l.id === layerId)!;
         const allocatedCents = Math.round((basis / totalBasis) * shipment.total_cents);
         const landedCostPerUnit = Math.round(allocatedCents / layer.quantity_received);

         // Update the cost layer with the landed cost component
         await tx.inventoryCostLayers.update(layerId, {
           landed_cost_cents: landedCostPerUnit,
         });

         await tx.landedCostAllocations.create({
           data: {
             shipment_id: shipmentId,
             cost_layer_id: layerId,
             allocated_cents: allocatedCents,
             allocation_basis: basis,
           },
         });
       }

       await tx.landedCostShipments.update(shipmentId, { status: 'allocated' });
     });
   }
   ```

5. **Compute standard cost variance analysis**

   ```typescript
   interface VarianceReport {
     variantId: string;
     sku: string;
     name: string;
     periodStart: Date;
     periodEnd: Date;
     unitsSold: number;
     actualCogsCents: number;
     standardCogsCents: number;
     varianceCents: number;
     variancePct: number;
     favorableUnfavorable: 'favorable' | 'unfavorable' | 'neutral';
   }

   async function computeStandardCostVariance(
     from: Date,
     to: Date,
     variantIds?: string[]
   ): Promise<VarianceReport[]> {
     const query = `
       SELECT
         pv.id               AS variant_id,
         pv.sku,
         pv.name,
         SUM(ce.quantity)    AS units_sold,
         SUM(ce.total_cost_cents) AS actual_cogs_cents,
         SUM(ce.quantity * sc.standard_cost_cents) AS standard_cogs_cents
       FROM cogs_entries ce
       JOIN product_variants pv   ON pv.id = ce.variant_id
       JOIN standard_costs   sc   ON sc.variant_id = ce.variant_id
                                  AND ce.fulfilled_at::date BETWEEN sc.effective_from
                                      AND COALESCE(sc.effective_to, '9999-12-31')
       WHERE ce.fulfilled_at BETWEEN $1 AND $2
         ${variantIds?.length ? 'AND ce.variant_id = ANY($3)' : ''}
       GROUP BY pv.id, pv.sku, pv.name
       HAVING SUM(ce.quantity) > 0
       ORDER BY ABS(SUM(ce.total_cost_cents) - SUM(ce.quantity * sc.standard_cost_cents)) DESC
     `;

     const params: unknown[] = [from, to];
     if (variantIds?.length) params.push(variantIds);

     const rows = await db.raw(query, params);

     return rows.map(row => {
       const varianceCents = row.actual_cogs_cents - row.standard_cogs_cents;
       const variancePct = row.standard_cogs_cents > 0
         ? (varianceCents / row.standard_cogs_cents) * 100
         : 0;

       return {
         variantId: row.variant_id,
         sku: row.sku,
         name: row.name,
         periodStart: from,
         periodEnd: to,
         unitsSold: row.units_sold,
         actualCogsCents: row.actual_cogs_cents,
         standardCogsCents: row.standard_cogs_cents,
         varianceCents,
         variancePct: Math.round(variancePct * 10) / 10,
         favorableUnfavorable:
           varianceCents < 0 ? 'favorable'   // Actual < Standard = cost savings
           : varianceCents > 0 ? 'unfavorable' // Actual > Standard = cost overrun
           : 'neutral',
       };
     });
   }
   ```

6. **Generate gross margin report per order**

   ```typescript
   async function computeOrderGrossMargin(orderId: string): Promise<{
     revenueCents: number;
     cogsCents: number;
     grossMarginCents: number;
     grossMarginPct: number;
   }> {
     const [order, cogsEntries] = await Promise.all([
       db.orders.findById(orderId, { include: ['lines'] }),
       db.cogsEntries.findAll({ where: { order_id: orderId } }),
     ]);

     const revenueCents = order.lines.reduce((s, l) => s + l.quantity * l.unit_price_cents, 0);
     const cogsCents = cogsEntries.reduce((s, e) => s + e.total_cost_cents, 0);
     const grossMarginCents = revenueCents - cogsCents;
     const grossMarginPct = revenueCents > 0
       ? Math.round((grossMarginCents / revenueCents) * 1000) / 10
       : 0;

     return { revenueCents, cogsCents, grossMarginCents, grossMarginPct };
   }
   ```

## Examples

### Gross margin by SKU — last 30 days

```sql
SELECT
  pv.sku,
  pv.name,
  SUM(ol.quantity * ol.unit_price_cents)   AS revenue_cents,
  SUM(ce.total_cost_cents)                 AS cogs_cents,
  SUM(ol.quantity * ol.unit_price_cents) -
  SUM(ce.total_cost_cents)                 AS gross_margin_cents,
  ROUND(
    (SUM(ol.quantity * ol.unit_price_cents) - SUM(ce.total_cost_cents))::numeric /
    NULLIF(SUM(ol.quantity * ol.unit_price_cents), 0) * 100, 1
  )                                        AS gross_margin_pct
FROM cogs_entries ce
JOIN order_lines       ol ON ol.id = ce.order_line_id
JOIN product_variants  pv ON pv.id = ce.variant_id
WHERE ce.fulfilled_at >= NOW() - INTERVAL '30 days'
GROUP BY pv.id, pv.sku, pv.name
ORDER BY gross_margin_pct ASC;   -- Worst margins first
```

### Inventory valuation — balance at end of period

```sql
SELECT
  pv.sku,
  pv.name,
  SUM(icl.quantity_remaining)                       AS units_on_hand,
  SUM(icl.quantity_remaining * icl.total_unit_cost_cents) AS inventory_value_cents
FROM inventory_cost_layers icl
JOIN product_variants pv ON pv.id = icl.variant_id
WHERE icl.quantity_remaining > 0
GROUP BY pv.id, pv.sku, pv.name
ORDER BY inventory_value_cents DESC;
```

### FIFO vs. weighted average cost comparison

```typescript
async function compareCostingMethods(variantId: string, quantity: number): Promise<void> {
  // Simulate what FIFO would cost
  const fifoLayers = await db.inventoryCostLayers.findAll({
    where: { variant_id: variantId, quantity_remaining: { gt: 0 }, costing_method: 'fifo' },
    orderBy: { receipt_date: 'asc' },
  });

  let fifoRemainder = quantity;
  let fifoCostCents = 0;
  for (const layer of fifoLayers) {
    if (fifoRemainder <= 0) break;
    const units = Math.min(fifoRemainder, layer.quantity_remaining);
    fifoCostCents += units * layer.total_unit_cost_cents;
    fifoRemainder -= units;
  }

  // Weighted average cost
  const avgResult = await db.raw<{ avg_cost: number }>(`
    SELECT SUM(quantity_remaining * total_unit_cost_cents)::numeric /
           NULLIF(SUM(quantity_remaining), 0) AS avg_cost
    FROM inventory_cost_layers
    WHERE variant_id = $1 AND quantity_remaining > 0
  `, [variantId]);

  const weightedAvgCostCents = Math.round((avgResult.rows[0].avg_cost ?? 0) * quantity);

  console.log(`FIFO cost for ${quantity} units: ${formatCents(fifoCostCents)}`);
  console.log(`Weighted avg cost for ${quantity} units: ${formatCents(weightedAvgCostCents)}`);
  console.log(`Difference: ${formatCents(Math.abs(fifoCostCents - weightedAvgCostCents))}`);
}
```

### Landed cost allocation example

```
Shipment: 500 units of SKU-A ($10 each) + 200 units of SKU-B ($25 each)
Total merchandise value: $5,000 + $5,000 = $10,000
Total landed costs: $800 (freight) + $200 (duties) = $1,000

Allocation by value:
  SKU-A share: $5,000 / $10,000 = 50% → $500 landed cost → $1.00/unit
  SKU-B share: $5,000 / $10,000 = 50% → $500 landed cost → $2.50/unit

Result:
  SKU-A total unit cost: $10.00 + $1.00 = $11.00
  SKU-B total unit cost: $25.00 + $2.50 = $27.50
```

## Best Practices

- **Choose one costing method per SKU and do not change it mid-period** — switching from FIFO to weighted average mid-year requires a full inventory revaluation and a journal entry to adjust retained earnings; document the method per product category in your accounting policy
- **Create cost layers at the time of goods receipt, not at PO creation** — the actual cost is only known when goods arrive and the invoice is matched; never use the PO price as the definitive cost layer unit cost
- **Allocate landed costs before the first sale of each lot** — if you sell units before allocating freight and duties, the COGS entries will use the purchase price only; you will need a retroactive adjustment, which complicates the GL
- **Store unit costs in the invoice currency, then convert to home currency for reporting** — this preserves the audit trail for customs clearance documents which are always in the shipment currency
- **Set a standard cost for every active SKU before the fiscal year begins** — variance analysis is only possible if there is a standard to compare against; missing standard costs silently produce zero variance rows
- **Track COGS at the order line level, not the order level** — aggregating to the order level loses the per-SKU margin visibility you need for product mix analysis
- **Run a daily reconciliation between COGS entries and fulfilled order lines** — any fulfilled order line that has no corresponding COGS entry represents uncosted revenue; this will overstate gross margin

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| FIFO layers go negative because returns are not added back correctly | When an order is returned, create a new cost layer with the returned units using the same unit cost as the original sale; do not restore the original layer's `quantity_remaining` |
| Landed costs are not allocated because the freight invoice arrives weeks after goods receipt | Mark cost layers as `landed_cost_pending` until the shipment is allocated; flag them in the variance report so finance knows to hold the GL posting |
| Weighted average unit cost is stale because it is cached and not recomputed after each receipt | Always compute weighted average dynamically from `quantity_remaining` and `total_unit_cost_cents` in the cost layers table; never store it as a pre-computed value |
| COGS entries are missing for orders fulfilled from a warehouse with no cost layers | The `assignCogsFifo` function should throw an explicit error rather than silently skip; add a nightly job that checks for fulfilled order lines with no COGS entry |
| Standard costs are set once and never updated, causing variance reports to be meaningless after 18 months | Review and update standard costs at the start of each fiscal year or whenever a major supplier reprices; use the `effective_from` / `effective_to` columns to version them |
| Total COGS on the income statement does not match the sum of `cogs_entries.total_cost_cents` | The GL posting must use the sum from `cogs_entries`, not an independent calculation; reconcile both numbers daily and alert if they differ by more than $1 |

## Related Skills

- @inventory-tracking
- @multi-warehouse
- @accounts-payable-management
- @financial-audit-trail
- @erp-integration
