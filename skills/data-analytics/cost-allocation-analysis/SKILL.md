---
name: cost-allocation-analysis
description: "Allocate COGS, shipping, marketing, and overhead costs across products, channels, and orders to calculate true per-unit and per-order profitability"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cost-allocation, profitability, cogs, gross-margin, contribution-margin, overhead, unit-economics, analytics, sql]
triggers: ["cost allocation", "true profitability", "allocate costs to products", "product margin analysis", "COGS allocation", "order profitability", "overhead allocation", "cost per order", "fully-loaded cost"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Cost Allocation Analysis

## Overview

Cost allocation analysis goes beyond simple revenue minus COGS to compute the fully-loaded cost of serving each order, product, and channel. This skill covers building the SQL queries and data pipelines to allocate four cost buckets — cost of goods sold (COGS), variable fulfillment costs (shipping, packaging), direct marketing spend, and shared overhead (warehousing, software, headcount) — down to the product and order level so that contribution margins and true profitability are surfaced accurately.

Without proper cost allocation, high-revenue products may appear profitable while actually generating negative margin once fulfillment and allocated overhead are factored in. This skill gives operations and finance teams the data model and queries to detect these hidden losses.

## When to Use This Skill

- When the business needs to identify which products, SKUs, or channels are genuinely profitable after all costs
- When building a P&L view that goes below gross margin to contribution margin and net margin
- When reconciling reported gross margin against actual cash outflows to understand the discrepancy
- When evaluating channel economics — understanding that marketplace orders carry marketplace fees on top of COGS
- When product managers need to make pricing decisions backed by fully-loaded cost data
- When finance is building monthly management accounts and needs automated cost allocation rather than manual spreadsheets
- When the business is scaling and shared overhead (warehouse lease, 3PL minimums) is growing faster than revenue

## Prerequisites & Platform Notes

**Shopify**: Export data via the Shopify Admin API or use Shopify's built-in analytics. For advanced analytics, connect to a data warehouse (BigQuery, Snowflake) via tools like Fivetran, Stitch, or Shopify's bulk data export.
**WooCommerce**: Use WooCommerce Analytics (built-in) or plugins like Metorik. For custom reporting, query the WordPress database directly or export to a warehouse.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: Access to your store's API, a data warehouse (BigQuery, Snowflake, or PostgreSQL) for advanced analytics

## Core Instructions

1. **Design the cost allocation data model**

   Four cost categories need separate tables because their allocation methods differ:

   ```sql
   -- PostgreSQL: cost allocation schema
   CREATE TABLE product_costs (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id    UUID NOT NULL REFERENCES products(id),
     variant_id    UUID REFERENCES product_variants(id),
     effective_from DATE NOT NULL,
     effective_to   DATE,            -- NULL = currently active
     cogs_cents    INTEGER NOT NULL, -- Landed cost per unit (includes freight, duties)
     packaging_cents INTEGER NOT NULL DEFAULT 0,
     created_at    TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE order_fulfillment_costs (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id      UUID NOT NULL REFERENCES orders(id),
     shipping_label_cents INTEGER NOT NULL DEFAULT 0,
     pick_pack_cents      INTEGER NOT NULL DEFAULT 0,
     returns_reserve_cents INTEGER NOT NULL DEFAULT 0, -- Reserve for expected returns
     recorded_at   TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE channel_marketing_costs (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     channel     TEXT NOT NULL,     -- 'google', 'meta', 'email', 'organic'
     spend_date  DATE NOT NULL,
     spend_cents INTEGER NOT NULL,
     orders_attributed INTEGER NOT NULL DEFAULT 0, -- From attribution model
     revenue_attributed_cents INTEGER NOT NULL DEFAULT 0,
     UNIQUE (channel, spend_date)
   );

   CREATE TABLE overhead_allocations (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     period_start  DATE NOT NULL,
     period_end    DATE NOT NULL,
     category      TEXT NOT NULL,  -- 'warehousing', 'software', 'headcount', 'returns_processing'
     total_cents   INTEGER NOT NULL,
     allocation_basis TEXT NOT NULL, -- 'revenue_share', 'order_count', 'unit_count'
     UNIQUE (period_start, category)
   );
   ```

2. **Calculate per-order COGS from product costs**

   Use time-effective product costs to compute the COGS of each order line item:

   ```sql
   -- Per-order COGS using point-in-time product costs
   SELECT
     o.id AS order_id,
     o.created_at,
     o.channel,
     SUM(oi.quantity * COALESCE(pc.cogs_cents, 0)) / 100.0 AS cogs,
     SUM(oi.quantity * COALESCE(pc.packaging_cents, 0)) / 100.0 AS packaging_cost,
     SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS revenue,
     -- Gross margin
     (SUM(oi.unit_price_cents * oi.quantity) -
      SUM(oi.quantity * COALESCE(pc.cogs_cents, 0)) -
      SUM(oi.quantity * COALESCE(pc.packaging_cents, 0))) / 100.0 AS gross_profit,
     ROUND(100.0 *
       (SUM(oi.unit_price_cents * oi.quantity) -
        SUM(oi.quantity * COALESCE(pc.cogs_cents, 0)) -
        SUM(oi.quantity * COALESCE(pc.packaging_cents, 0))) /
       NULLIF(SUM(oi.unit_price_cents * oi.quantity), 0), 2) AS gross_margin_pct
   FROM orders o
   JOIN order_items oi ON oi.order_id = o.id
   LEFT JOIN LATERAL (
     SELECT cogs_cents, packaging_cents
     FROM product_costs pc
     WHERE pc.variant_id = oi.variant_id
       AND pc.effective_from <= o.created_at::date
       AND (pc.effective_to IS NULL OR pc.effective_to > o.created_at::date)
     ORDER BY pc.effective_from DESC
     LIMIT 1
   ) pc ON TRUE
   WHERE o.created_at BETWEEN :start_date AND :end_date
     AND o.status NOT IN ('cancelled')
   GROUP BY o.id, o.created_at, o.channel
   ORDER BY o.created_at DESC;
   ```

3. **Allocate shipping and fulfillment costs per order**

   ```typescript
   // Compute per-order contribution margin after fulfillment costs
   async function getOrderContributionMargin(orderId: string) {
     const [order, fulfillmentCost, cogsRows] = await Promise.all([
       db.orders.findById(orderId, { include: ['items', 'items.variant'] }),
       db.orderFulfillmentCosts.findFirst({ where: { orderId } }),
       db.query(`
         SELECT SUM(oi.quantity * pc.cogs_cents) AS total_cogs_cents
         FROM order_items oi
         JOIN product_costs pc ON pc.variant_id = oi.variant_id
           AND pc.effective_from <= $1::date
           AND (pc.effective_to IS NULL OR pc.effective_to > $1::date)
         WHERE oi.order_id = $2
       `, [order.createdAt, orderId]),
     ]);

     const revenue = order.subtotalCents / 100;
     const discounts = order.discountCents / 100;
     const cogs = (cogsRows[0]?.total_cogs_cents ?? 0) / 100;
     const shipping = (fulfillmentCost?.shippingLabelCents ?? 0) / 100;
     const pickPack = (fulfillmentCost?.pickPackCents ?? 0) / 100;
     const returnsReserve = (fulfillmentCost?.returnsReserveCents ?? 0) / 100;

     const grossProfit = revenue - discounts - cogs;
     const contributionMargin = grossProfit - shipping - pickPack - returnsReserve;

     return {
       orderId,
       revenue,
       discounts,
       netRevenue: revenue - discounts,
       cogs,
       grossProfit,
       grossMarginPct: grossProfit / (revenue - discounts) * 100,
       shippingCost: shipping,
       pickPackCost: pickPack,
       returnsReserve,
       contributionMargin,
       contributionMarginPct: contributionMargin / (revenue - discounts) * 100,
     };
   }
   ```

4. **Allocate marketing spend to orders**

   Use the attribution model output to spread channel marketing spend across the orders each channel drove:

   ```sql
   -- Marketing cost per order via channel attribution
   WITH channel_cpa AS (
     SELECT
       cmc.channel,
       cmc.spend_date,
       cmc.spend_cents,
       cmc.orders_attributed,
       -- Cost per acquired order for this channel on this day
       ROUND(cmc.spend_cents::numeric / NULLIF(cmc.orders_attributed, 0), 0) AS cpa_cents
     FROM channel_marketing_costs cmc
     WHERE cmc.spend_date BETWEEN :start_date AND :end_date
   ),
   order_channel_cpa AS (
     SELECT
       oa.order_id,
       SUM(ccpa.cpa_cents) / 100.0 AS marketing_cost_allocated
     FROM order_attribution oa
     JOIN channel_cpa ccpa ON ccpa.channel = oa.source
       AND ccpa.spend_date = oa.attributed_date
     GROUP BY oa.order_id
   )
   SELECT
     o.id AS order_id,
     o.created_at,
     ocpa.marketing_cost_allocated,
     -- Contribution margin after marketing
     (order_cm.contribution_margin - COALESCE(ocpa.marketing_cost_allocated, 0)) AS post_marketing_margin
   FROM orders o
   LEFT JOIN order_channel_cpa ocpa ON ocpa.order_id = o.id
   -- order_cm would be a CTE or view containing the contribution_margin from step 3
   WHERE o.created_at BETWEEN :start_date AND :end_date
     AND o.status NOT IN ('cancelled');
   ```

5. **Allocate overhead costs by revenue share**

   ```typescript
   // Allocate monthly overhead to orders using revenue-share method
   async function allocateOverheadToOrders(periodStart: Date, periodEnd: Date) {
     // Fetch total overhead for the period
     const overheadRows = await db.query(`
       SELECT SUM(total_cents) AS total_overhead_cents
       FROM overhead_allocations
       WHERE period_start <= $1 AND period_end >= $2
         AND allocation_basis = 'revenue_share'
     `, [periodEnd, periodStart]);

     const totalOverhead = (overheadRows[0]?.total_overhead_cents ?? 0) / 100;

     // Fetch total net revenue for the period
     const revenueRow = await db.query(`
       SELECT SUM(subtotal_cents - discount_cents) / 100.0 AS total_revenue
       FROM orders
       WHERE created_at BETWEEN $1 AND $2
         AND status NOT IN ('cancelled')
     `, [periodStart, periodEnd]);

     const totalRevenue = revenueRow[0]?.total_revenue ?? 0;
     const overheadRate = totalRevenue > 0 ? totalOverhead / totalRevenue : 0;

     // Apply the overhead rate to each order
     await db.query(`
       INSERT INTO order_overhead_allocations (order_id, overhead_amount, period_start, overhead_rate)
       SELECT
         id AS order_id,
         (subtotal_cents - discount_cents) / 100.0 * $1 AS overhead_amount,
         $2 AS period_start,
         $1 AS overhead_rate
       FROM orders
       WHERE created_at BETWEEN $2 AND $3
         AND status NOT IN ('cancelled')
       ON CONFLICT (order_id, period_start) DO UPDATE
         SET overhead_amount = EXCLUDED.overhead_amount,
             overhead_rate = EXCLUDED.overhead_rate
     `, [overheadRate, periodStart, periodEnd]);

     return { totalOverhead, totalRevenue, overheadRate };
   }
   ```

6. **Build the fully-loaded P&L waterfall by channel**

   ```sql
   -- Full P&L waterfall: gross revenue → net profit by channel
   SELECT
     o.channel,
     COUNT(DISTINCT o.id) AS orders,
     SUM(oi_rev.revenue) AS gross_revenue,
     SUM(o.discount_cents) / 100.0 AS discounts,
     SUM(oi_rev.revenue) - SUM(o.discount_cents) / 100.0 AS net_revenue,
     SUM(oi_cogs.cogs) AS cogs,
     SUM(oi_rev.revenue) - SUM(o.discount_cents) / 100.0 - SUM(oi_cogs.cogs) AS gross_profit,
     SUM(ofc.shipping_label_cents + ofc.pick_pack_cents) / 100.0 AS fulfillment_costs,
     SUM(COALESCE(ocpa.marketing_cost_allocated, 0)) AS marketing_costs,
     SUM(COALESCE(ooa.overhead_amount, 0)) AS overhead_costs,
     -- Net contribution margin
     SUM(oi_rev.revenue) - SUM(o.discount_cents) / 100.0
       - SUM(oi_cogs.cogs)
       - SUM(ofc.shipping_label_cents + ofc.pick_pack_cents) / 100.0
       - SUM(COALESCE(ocpa.marketing_cost_allocated, 0))
       - SUM(COALESCE(ooa.overhead_amount, 0)) AS net_margin,
     ROUND(100.0 * (
       SUM(oi_rev.revenue) - SUM(o.discount_cents) / 100.0
         - SUM(oi_cogs.cogs)
         - SUM(ofc.shipping_label_cents + ofc.pick_pack_cents) / 100.0
         - SUM(COALESCE(ocpa.marketing_cost_allocated, 0))
         - SUM(COALESCE(ooa.overhead_amount, 0))
     ) / NULLIF(SUM(oi_rev.revenue) - SUM(o.discount_cents) / 100.0, 0), 2) AS net_margin_pct
   FROM orders o
   LEFT JOIN LATERAL (
     SELECT SUM(unit_price_cents * quantity) / 100.0 AS revenue
     FROM order_items WHERE order_id = o.id
   ) oi_rev ON TRUE
   LEFT JOIN LATERAL (
     SELECT SUM(oi.quantity * COALESCE(pc.cogs_cents, 0)) / 100.0 AS cogs
     FROM order_items oi
     LEFT JOIN product_costs pc ON pc.variant_id = oi.variant_id
       AND pc.effective_from <= o.created_at::date
       AND (pc.effective_to IS NULL OR pc.effective_to > o.created_at::date)
     WHERE oi.order_id = o.id
   ) oi_cogs ON TRUE
   LEFT JOIN order_fulfillment_costs ofc ON ofc.order_id = o.id
   LEFT JOIN order_channel_cpa ocpa ON ocpa.order_id = o.id
   LEFT JOIN order_overhead_allocations ooa ON ooa.order_id = o.id
   WHERE o.created_at BETWEEN :start_date AND :end_date
     AND o.status NOT IN ('cancelled')
   GROUP BY o.channel
   ORDER BY net_margin DESC;
   ```

## Examples

### SKU-level profitability ranking

```sql
-- Rank all SKUs by contribution margin after all variable costs
WITH sku_metrics AS (
  SELECT
    p.sku,
    p.name AS product_name,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS revenue,
    SUM(oi.quantity * COALESCE(pc.cogs_cents, 0)) / 100.0 AS cogs,
    SUM(oi.quantity * COALESCE(pc.packaging_cents, 0)) / 100.0 AS packaging,
    -- Variable shipping allocated proportionally by weight
    SUM(ofc.shipping_label_cents * (oi.quantity * p.weight_grams) /
        NULLIF(total_weight.total_grams, 0)) / 100.0 AS allocated_shipping
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  LEFT JOIN product_costs pc ON pc.product_id = p.id
    AND pc.effective_from <= o.created_at::date
    AND (pc.effective_to IS NULL OR pc.effective_to > o.created_at::date)
  LEFT JOIN order_fulfillment_costs ofc ON ofc.order_id = o.id
  LEFT JOIN LATERAL (
    SELECT SUM(oi2.quantity * p2.weight_grams) AS total_grams
    FROM order_items oi2
    JOIN products p2 ON oi2.product_id = p2.id
    WHERE oi2.order_id = oi.order_id
  ) total_weight ON TRUE
  WHERE o.created_at BETWEEN :start_date AND :end_date
    AND o.status NOT IN ('cancelled')
  GROUP BY p.sku, p.name
)
SELECT
  sku,
  product_name,
  units_sold,
  revenue,
  cogs,
  packaging,
  allocated_shipping,
  revenue - cogs - packaging - allocated_shipping AS contribution_margin,
  ROUND(100.0 * (revenue - cogs - packaging - allocated_shipping) / NULLIF(revenue, 0), 2) AS cm_pct,
  RANK() OVER (ORDER BY (revenue - cogs - packaging - allocated_shipping) / NULLIF(units_sold, 0) DESC) AS rank_by_unit_cm
FROM sku_metrics
ORDER BY cm_pct DESC;
```

### Detect negative-margin orders

```typescript
// Flag orders where contribution margin is negative (losing money on the order)
async function findNegativeMarginOrders(start: Date, end: Date, threshold = 0) {
  const rows = await db.query(`
    SELECT
      o.id,
      o.order_number,
      o.created_at,
      o.channel,
      o.subtotal_cents / 100.0 AS revenue,
      COALESCE(oi_cogs.cogs, 0) AS cogs,
      COALESCE(ofc.shipping_label_cents + ofc.pick_pack_cents, 0) / 100.0 AS fulfillment,
      -- Net contribution
      o.subtotal_cents / 100.0
        - COALESCE(oi_cogs.cogs, 0)
        - COALESCE(ofc.shipping_label_cents + ofc.pick_pack_cents, 0) / 100.0 AS contribution_margin
    FROM orders o
    LEFT JOIN LATERAL (
      SELECT SUM(oi.quantity * COALESCE(pc.cogs_cents, 0)) / 100.0 AS cogs
      FROM order_items oi
      LEFT JOIN product_costs pc ON pc.variant_id = oi.variant_id
        AND pc.effective_from <= o.created_at::date
        AND (pc.effective_to IS NULL OR pc.effective_to > o.created_at::date)
      WHERE oi.order_id = o.id
    ) oi_cogs ON TRUE
    LEFT JOIN order_fulfillment_costs ofc ON ofc.order_id = o.id
    WHERE o.created_at BETWEEN $1 AND $2
      AND o.status NOT IN ('cancelled')
    HAVING o.subtotal_cents / 100.0
      - COALESCE(oi_cogs.cogs, 0)
      - COALESCE(ofc.shipping_label_cents + ofc.pick_pack_cents, 0) / 100.0 < $3
    ORDER BY contribution_margin ASC
    LIMIT 100
  `, [start, end, threshold]);

  return rows;
}
```

## Best Practices

- **Use time-effective product costs** — COGS changes over time as supplier costs fluctuate; always join product costs using the order date as the point-in-time, not the latest cost record
- **Store all costs in smallest currency units (cents)** — avoid floating-point arithmetic for cost calculations; use integer cents throughout and only divide by 100 for display
- **Allocate overhead using the same period as the orders** — monthly overhead should be allocated proportionally to orders within that same calendar month; do not spread annual overhead linearly
- **Separate fixed and variable costs** — shipping and pick/pack are variable (per-order); warehouse rent is fixed overhead; treating fixed costs as variable inflates per-order costs for low-volume periods
- **Include a returns reserve in fulfillment costs** — if your return rate is 15%, allocate 15% of the average return processing cost as a reserve on each order at the time of sale
- **Reconcile allocated costs against actuals monthly** — the sum of all allocated shipping costs should equal your actual shipping invoice; any gap indicates misconfigured weights or rates
- **Build a cost update audit trail** — any change to `product_costs` should be an insert with a new `effective_from` date, never an update; this preserves historical margin calculations
- **Handle marketplace fees as a cost layer** — Amazon, eBay, and Etsy fees should be modeled as a channel-specific surcharge in the contribution margin calculation, not as a discount on revenue

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Gross margin is positive but cash flow is negative | Overhead and fulfillment costs are not in the gross margin calculation; build the full waterfall to contribution margin before concluding a product is profitable |
| Historical margin changes when COGS is updated | Always use `effective_from` / `effective_to` date ranges on product costs; never overwrite historical cost records |
| Marketing costs not allocated to orders | Implement a channel attribution model (see @attribution-modeling) as a prerequisite; without it, marketing costs can only be allocated at the channel aggregate level |
| Overhead allocation rate fluctuates wildly month-to-month | Use a rolling 3-month average revenue to compute the overhead rate rather than a single month to smooth out seasonality effects |
| Negative-margin orders are hidden by channel averages | Always analyze at the individual order level, not just channel averages; a high-volume channel can average a positive margin while hiding a tail of deeply unprofitable orders |
| SKU margins differ between product variants | Ensure `product_costs` rows exist at the variant level (`variant_id`) not just the product level; a product with multiple sizes may have different per-unit costs |

## Testing and Validation

1. **Reconciliation test — COGS**: Sum all `product_costs.cogs_cents * quantity` for a month's `order_items`. The result should match within 2% of the COGS figure in your accounting system (QuickBooks, Xero). Differences larger than 2% indicate missing cost records or incorrect effective dates.

2. **Reconciliation test — shipping**: Sum all `order_fulfillment_costs.shipping_label_cents` for a month. Cross-check against the shipping carrier invoice (FedEx, UPS, USPS). Any gap indicates orders where fulfillment cost records were not created.

3. **Margin sanity check**: No channel's net margin should exceed gross margin. If net margin > gross margin for any row, a cost allocation is missing or negative (data entry error in cost tables).

4. **Unit test — time-effective costs**:
   ```typescript
   // Verify that orders placed before a cost change use the old cost
   it('uses cost effective at order date, not latest cost', async () => {
     const product = await createProduct();
     await createCost(product.id, { cogsCents: 1000, effectiveFrom: '2026-01-01', effectiveTo: '2026-02-01' });
     await createCost(product.id, { cogsCents: 1500, effectiveFrom: '2026-02-01', effectiveTo: null });

     const janOrder = await createOrder({ productId: product.id, createdAt: '2026-01-15' });
     const margin = await getOrderContributionMargin(janOrder.id);
     expect(margin.cogs).toBe(10.00); // uses $10 cost, not $15

     const febOrder = await createOrder({ productId: product.id, createdAt: '2026-02-15' });
     const febMargin = await getOrderContributionMargin(febOrder.id);
     expect(febMargin.cogs).toBe(15.00); // uses $15 cost
   });
   ```

5. **Overhead allocation validation**: Verify that the sum of `order_overhead_allocations.overhead_amount` for a period equals `overhead_allocations.total_cents / 100` for that same period. A discrepancy indicates orders that were not included in the allocation run.

## Related Skills

- @profit-margin-analysis
- @unit-economics-tracking
- @financial-analytics-dashboard
- @marketing-spend-analysis
- @attribution-modeling
- @sales-reporting-dashboard
