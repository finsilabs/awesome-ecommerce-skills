---
name: sales-reporting-dashboard
description: "Build executive dashboards showing revenue, average order value, conversion rates, and cohort analysis with drill-down by date and channel"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [analytics, dashboard, revenue, aov, conversion, cohort, reporting, sql, data-visualization]
triggers: ["sales dashboard", "revenue reporting", "sales reporting", "AOV dashboard", "conversion dashboard", "cohort analysis dashboard", "ecommerce analytics dashboard"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Sales Reporting Dashboard

## Overview

A sales reporting dashboard surfaces the metrics that matter most to an e-commerce operation: revenue, orders, average order value (AOV), conversion rate, and trend comparisons. This skill covers building the SQL queries for each core metric, implementing drill-down capabilities (by channel, category, geography), cohort revenue analysis, and structuring a REST API that a frontend charting library (Recharts, Chart.js, Metabase) can consume.

## When to Use This Skill

- When the business needs a single source of truth for daily/weekly revenue reporting
- When building an internal analytics dashboard to replace manual spreadsheet reports
- When implementing time-comparison metrics (week-over-week, month-over-month, year-over-year)
- When product managers need category and channel drill-down beyond top-level revenue
- When building an executive dashboard that surfaces GMV, conversion rate, and AOV trends
- When integrating with a BI tool (Metabase, Looker, Redash) via an API or direct database views

## Prerequisites & Platform Notes

**Shopify**: Export data via the Shopify Admin API or use Shopify's built-in analytics. For advanced analytics, connect to a data warehouse (BigQuery, Snowflake) via tools like Fivetran, Stitch, or Shopify's bulk data export.
**WooCommerce**: Use WooCommerce Analytics (built-in) or plugins like Metorik. For custom reporting, query the WordPress database directly or export to a warehouse.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: Access to your store's API, a data warehouse (BigQuery, Snowflake, or PostgreSQL) for advanced analytics

## Core Instructions

1. **Build the core revenue metrics query**

   ```sql
   -- PostgreSQL: daily revenue summary for a date range
   SELECT
     DATE_TRUNC('day', o.created_at) AS day,
     COUNT(DISTINCT o.id) AS orders,
     COUNT(DISTINCT o.customer_id) AS unique_customers,
     SUM(o.subtotal_cents) / 100.0 AS revenue,
     SUM(o.subtotal_cents) / 100.0 / NULLIF(COUNT(DISTINCT o.id), 0) AS aov,
     SUM(o.discount_cents) / 100.0 AS discounts_given,
     (SUM(o.subtotal_cents) - SUM(o.discount_cents)) / 100.0 AS net_revenue,
     SUM(o.refund_cents) / 100.0 AS refunds,
     (SUM(o.subtotal_cents) - SUM(o.discount_cents) - SUM(o.refund_cents)) / 100.0 AS net_net_revenue
   FROM orders o
   WHERE o.status NOT IN ('cancelled')
     AND o.created_at BETWEEN :start_date AND :end_date
   GROUP BY 1
   ORDER BY 1 DESC;
   ```

   TypeScript API endpoint:

   ```typescript
   // GET /api/analytics/revenue?start=2026-01-01&end=2026-03-12&granularity=day
   export async function getRevenueSummary(req: Request, res: Response) {
     const { start, end, granularity = 'day' } = req.query;

     const validGranularities = ['hour', 'day', 'week', 'month'];
     if (!validGranularities.includes(granularity as string)) {
       return res.status(400).json({ error: 'Invalid granularity' });
     }

     const cacheKey = `revenue:${start}:${end}:${granularity}`;
     const cached = await redis.get(cacheKey);
     if (cached) return res.json(JSON.parse(cached));

     const rows = await db.query(`
       SELECT
         DATE_TRUNC($1, created_at) AS period,
         COUNT(DISTINCT id) AS orders,
         SUM(subtotal_cents) / 100.0 AS revenue,
         SUM(subtotal_cents) / NULLIF(COUNT(DISTINCT id), 0) / 100.0 AS aov,
         COUNT(DISTINCT customer_id) AS unique_customers
       FROM orders
       WHERE status NOT IN ('cancelled')
         AND created_at BETWEEN $2 AND $3
       GROUP BY 1
       ORDER BY 1 ASC
     `, [granularity, start, end]);

     await redis.setex(cacheKey, 300, JSON.stringify(rows));
     res.json(rows);
   }
   ```

2. **Build conversion rate metrics**

   Conversion rate requires session data alongside order data:

   ```sql
   -- Conversion rate by day (requires a sessions table)
   SELECT
     DATE_TRUNC('day', s.started_at) AS day,
     COUNT(DISTINCT s.id) AS sessions,
     COUNT(DISTINCT o.id) AS orders,
     ROUND(100.0 * COUNT(DISTINCT o.id) / NULLIF(COUNT(DISTINCT s.id), 0), 2) AS cvr_pct,
     -- Segment by new vs. returning
     COUNT(DISTINCT CASE WHEN s.is_new_visitor THEN s.id END) AS new_visitor_sessions,
     COUNT(DISTINCT CASE WHEN NOT s.is_new_visitor THEN s.id END) AS returning_visitor_sessions
   FROM sessions s
   LEFT JOIN orders o ON o.session_id = s.id AND o.status NOT IN ('cancelled')
   WHERE s.started_at BETWEEN :start_date AND :end_date
   GROUP BY 1
   ORDER BY 1 DESC;
   ```

3. **Build channel drill-down**

   ```sql
   -- Revenue by acquisition channel for a period
   SELECT
     COALESCE(oa.source, 'direct') AS channel,
     COALESCE(oa.medium, 'none') AS medium,
     COUNT(DISTINCT o.id) AS orders,
     SUM(o.subtotal_cents) / 100.0 AS revenue,
     SUM(o.subtotal_cents) / NULLIF(COUNT(DISTINCT o.id), 0) / 100.0 AS aov,
     COUNT(DISTINCT o.customer_id) AS customers,
     -- New vs. returning customer ratio
     COUNT(DISTINCT CASE WHEN o.is_first_order THEN o.id END) AS new_customer_orders
   FROM orders o
   LEFT JOIN order_attribution oa ON oa.order_id = o.id
   WHERE o.created_at BETWEEN :start_date AND :end_date
     AND o.status NOT IN ('cancelled')
   GROUP BY 1, 2
   ORDER BY revenue DESC;
   ```

4. **Build category performance drill-down**

   ```sql
   -- Revenue and sell-through by product category
   SELECT
     c.name AS category,
     COUNT(DISTINCT oi.order_id) AS orders_with_category,
     SUM(oi.quantity) AS units_sold,
     SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS category_revenue,
     SUM(oi.unit_price_cents * oi.quantity) / NULLIF(SUM(SUM(oi.unit_price_cents * oi.quantity)) OVER (), 0) * 100 AS revenue_share_pct
   FROM order_items oi
   JOIN products p ON oi.product_id = p.id
   JOIN product_categories pc ON p.id = pc.product_id
   JOIN categories c ON pc.category_id = c.id
   JOIN orders o ON oi.order_id = o.id
   WHERE o.created_at BETWEEN :start_date AND :end_date
     AND o.status NOT IN ('cancelled')
   GROUP BY c.name
   ORDER BY category_revenue DESC;
   ```

5. **Compute period-over-period comparison**

   ```typescript
   async function getPeriodComparison(currentStart: Date, currentEnd: Date) {
     const periodLengthMs = currentEnd.getTime() - currentStart.getTime();
     const priorStart = new Date(currentStart.getTime() - periodLengthMs);
     const priorEnd = new Date(currentStart);

     const [current, prior] = await Promise.all([
       db.query(revenueSummarySQL, [currentStart, currentEnd]),
       db.query(revenueSummarySQL, [priorStart, priorEnd]),
     ]);

     const currRevenue = current.reduce((sum: number, r: any) => sum + r.revenue, 0);
     const priorRevenue = prior.reduce((sum: number, r: any) => sum + r.revenue, 0);
     const currOrders = current.reduce((sum: number, r: any) => sum + r.orders, 0);
     const priorOrders = prior.reduce((sum: number, r: any) => sum + r.orders, 0);

     return {
       current: { revenue: currRevenue, orders: currOrders, aov: currOrders ? currRevenue / currOrders : 0 },
       prior: { revenue: priorRevenue, orders: priorOrders, aov: priorOrders ? priorRevenue / priorOrders : 0 },
       changes: {
         revenueChange: priorRevenue ? ((currRevenue - priorRevenue) / priorRevenue) * 100 : null,
         ordersChange: priorOrders ? ((currOrders - priorOrders) / priorOrders) * 100 : null,
       },
     };
   }
   ```

## Examples

### Top products report

```sql
-- Top 20 products by revenue for a date range, with rank change vs. prior period
WITH current_period AS (
  SELECT
    p.id,
    p.name,
    SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS revenue,
    SUM(oi.quantity) AS units_sold,
    RANK() OVER (ORDER BY SUM(oi.unit_price_cents * oi.quantity) DESC) AS rank
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at BETWEEN :current_start AND :current_end AND o.status != 'cancelled'
  GROUP BY p.id, p.name
),
prior_period AS (
  SELECT
    p.id,
    RANK() OVER (ORDER BY SUM(oi.unit_price_cents * oi.quantity) DESC) AS rank
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at BETWEEN :prior_start AND :prior_end AND o.status != 'cancelled'
  GROUP BY p.id
)
SELECT cp.*, pp.rank AS prior_rank, pp.rank - cp.rank AS rank_improvement
FROM current_period cp
LEFT JOIN prior_period pp ON cp.id = pp.id
ORDER BY cp.rank
LIMIT 20;
```

### Revenue waterfall: from gross to net

```typescript
async function getRevenueWaterfall(start: Date, end: Date) {
  const [gross, discounts, refunds, shipping] = await Promise.all([
    db.orders.sumField('subtotal_cents', { between: [start, end] }),
    db.orders.sumField('discount_cents', { between: [start, end] }),
    db.orders.sumField('refund_cents', { between: [start, end] }),
    db.orders.sumField('shipping_cents', { between: [start, end] }),
  ]);

  return [
    { label: 'Gross Revenue', value: gross / 100, type: 'positive' },
    { label: 'Discounts', value: -(discounts / 100), type: 'negative' },
    { label: 'Refunds', value: -(refunds / 100), type: 'negative' },
    { label: 'Shipping Revenue', value: shipping / 100, type: 'positive' },
    { label: 'Net Revenue', value: (gross - discounts - refunds + shipping) / 100, type: 'total' },
  ];
}
```

## Best Practices

- **Cache all dashboard queries** with a 5–15 minute TTL — revenue queries on large datasets can take 5+ seconds; serving cached responses keeps the dashboard snappy
- **Use `DATE_TRUNC` instead of `DATE()` for aggregations** in PostgreSQL — it preserves timezone information and is more consistent across all granularities
- **Always filter cancelled orders** — including them in revenue metrics inflates GMV and skews AOV
- **Use views or materialized views for complex joins** — wrap your revenue + attribution join into a database view so the query layer stays clean
- **Add indexes on `(status, created_at)` for the orders table** — this is the filter pattern used in every dashboard query
- **Separate GMV from net revenue** — GMV (gross merchandise value) includes discounts; net revenue does not; report both explicitly
- **Provide period-over-period context for every KPI** — a $50k revenue day is meaningless without knowing whether it is up or down vs. last week

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Dashboard shows different revenue than payment processor | Reconcile by comparing order `subtotal_cents` against Stripe payment intents; differences usually come from multi-currency or refund timing |
| Conversion rate looks artificially low | Ensure sessions table includes all visits, not just logged-in users; anonymous sessions are often missed |
| AOV inflated by bulk/wholesale orders | Add a `WHERE subtotal_cents < 100000` filter (configurable) to exclude outliers from AOV calculation |
| Revenue appears in wrong timezone | Store all timestamps in UTC in the database; apply timezone conversion only in the API response using `AT TIME ZONE` |
| Dashboard query timeout on large date ranges | Add a materialized view or daily aggregate rollup table (`orders_daily`) for date ranges > 90 days |

## Related Skills

- @product-analytics
- @customer-analytics
- @attribution-modeling
- @ab-testing-ecommerce
- @customer-segmentation
