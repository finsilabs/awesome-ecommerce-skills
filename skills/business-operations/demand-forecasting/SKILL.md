---
name: demand-forecasting
description: "Inventory demand prediction using sales history, seasonality, and trends"
category: business-operations
risk: safe
source: curated
date_added: "2026-03-12"
tags: [demand-forecasting, inventory-planning, seasonality, sales-history, reorder-points, stockout-prevention]
triggers: ["demand forecasting", "inventory forecasting", "predict demand", "reorder points", "stockout prevention", "inventory planning", "sales prediction"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Demand Forecasting

## Overview

Build an inventory demand forecasting system that uses historical sales data, seasonal patterns, and trend decomposition to predict future demand and automatically compute reorder points and order quantities. Generates replenishment recommendations that purchasing teams can approve, reducing stockouts and excess inventory simultaneously.

## When to Use This Skill

- When chronic stockouts or overstock situations indicate that current reorder points are wrong or based on gut feeling
- When building automated replenishment recommendations to reduce the time buyers spend manually reviewing inventory
- When planning inventory for seasonal peaks (Black Friday, back-to-school, holiday season)
- When you have 12+ months of sales history and want to extract meaningful demand patterns
- When integrating with supplier lead times and purchase order workflows for end-to-end replenishment automation

## Core Instructions

1. **Aggregate sales history into a daily demand time series**

   ```sql
   -- Materialized view: daily units sold per product
   CREATE MATERIALIZED VIEW daily_sales AS
   SELECT
     ol.product_id,
     DATE(o.created_at) AS sale_date,
     SUM(ol.quantity) AS units_sold
   FROM order_lines ol
   JOIN orders o ON o.id = ol.order_id
   WHERE o.status NOT IN ('cancelled', 'refunded')
   GROUP BY ol.product_id, DATE(o.created_at);

   CREATE INDEX idx_daily_sales_product_date ON daily_sales(product_id, sale_date);

   -- Refresh nightly
   -- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
   ```

2. **Calculate a 7-day moving average to smooth demand**

   ```typescript
   interface DailySaleRow {
     sale_date: string;
     units_sold: number;
   }

   function computeMovingAverage(sales: DailySaleRow[], windowDays = 7): Map<string, number> {
     const ma = new Map<string, number>();
     for (let i = 0; i < sales.length; i++) {
       const window = sales.slice(Math.max(0, i - windowDays + 1), i + 1);
       const avg = window.reduce((s, r) => s + r.units_sold, 0) / window.length;
       ma.set(sales[i].sale_date, avg);
     }
     return ma;
   }
   ```

3. **Decompose demand into trend + seasonality + residual**

   ```typescript
   interface ForecastComponents {
     trend: number;        // units/day long-term trend
     seasonality: number[]; // 52-element array of weekly seasonal indices (1.0 = average week)
     residualStdDev: number; // noise standard deviation for safety stock calculation
   }

   async function decomposeProductDemand(productId: string): Promise<ForecastComponents> {
     // Fetch last 52 weeks of daily sales
     const sales = await db.raw(`
       SELECT sale_date, COALESCE(units_sold, 0) AS units_sold
       FROM generate_series(NOW()::date - 364, NOW()::date, '1 day'::interval) AS gs(sale_date)
       LEFT JOIN daily_sales ds ON ds.sale_date = gs.sale_date AND ds.product_id = ?
       ORDER BY gs.sale_date
     `, [productId]).then(r => r.rows);

     // Long-term trend: simple linear regression on 7-day moving averages
     const ma = Array.from(computeMovingAverage(sales).values());
     const n = ma.length;
     const x = Array.from({ length: n }, (_, i) => i);
     const xMean = x.reduce((s, v) => s + v, 0) / n;
     const yMean = ma.reduce((s, v) => s + v, 0) / n;
     const slope = x.reduce((s, xi, i) => s + (xi - xMean) * (ma[i] - yMean), 0)
       / x.reduce((s, xi) => s + (xi - xMean) ** 2, 0);

     // Seasonal indices: average units per day-of-week normalized to overall mean
     const byDow: number[][] = Array.from({ length: 7 }, () => []);
     sales.forEach((row, i) => byDow[i % 7].push(row.units_sold));
     const dowAverages = byDow.map(vals => vals.reduce((s, v) => s + v, 0) / vals.length);
     const overallMean = dowAverages.reduce((s, v) => s + v, 0) / 7;
     const weeklySeasonality = dowAverages.map(avg => overallMean > 0 ? avg / overallMean : 1);

     // Residual standard deviation
     const residuals = sales.map((row, i) => {
       const trendVal = yMean + slope * (i - n / 2);
       const seasIdx = weeklySeasonality[i % 7];
       const fitted = trendVal * seasIdx;
       return row.units_sold - fitted;
     });
     const residualStdDev = Math.sqrt(
       residuals.reduce((s, r) => s + r ** 2, 0) / residuals.length
     );

     return { trend: slope, seasonality: weeklySeasonality, residualStdDev };
   }
   ```

4. **Generate a demand forecast for the next N days**

   ```typescript
   async function forecastDemand(productId: string, forecastDays = 30): Promise<number[]> {
     const components = await decomposeProductDemand(productId);
     const baselineSales = await db.raw(`
       SELECT AVG(units_sold) AS avg
       FROM daily_sales
       WHERE product_id = ? AND sale_date >= NOW()::date - 30
     `, [productId]).then(r => parseFloat(r.rows[0].avg) || 0);

     const forecast: number[] = [];
     const today = new Date();

     for (let d = 1; d <= forecastDays; d++) {
       const futureDate = new Date(today);
       futureDate.setDate(today.getDate() + d);
       const dow = futureDate.getDay();

       const trendAdjustment = components.trend * d;
       const seasonalIndex = components.seasonality[dow];
       const predicted = Math.max(0, (baselineSales + trendAdjustment) * seasonalIndex);
       forecast.push(Math.round(predicted * 10) / 10);
     }

     return forecast;
   }
   ```

5. **Calculate reorder point and recommended order quantity**

   ```typescript
   interface ReplenishmentRecommendation {
     productId: string;
     currentStock: number;
     reorderPoint: number;
     recommendedOrderQty: number;
     daysOfSupply: number;
     urgency: 'critical' | 'warning' | 'ok';
   }

   const Z_95 = 1.645; // z-score for 95% service level

   async function computeReplenishment(
     productId: string
   ): Promise<ReplenishmentRecommendation> {
     const product = await db.products.findById(productId);
     const inventory = await db.inventory.findByProductId(productId);
     const components = await decomposeProductDemand(productId);
     const leadTimeDays = product.supplier_lead_time_days ?? 7;

     // Average daily demand over the next 30 days
     const forecast30 = await forecastDemand(productId, 30);
     const avgDailyDemand = forecast30.reduce((s, v) => s + v, 0) / 30;

     // Safety stock = Z * σ * √(lead time)
     const safetyStock = Math.ceil(Z_95 * components.residualStdDev * Math.sqrt(leadTimeDays));

     // Reorder point = demand during lead time + safety stock
     const reorderPoint = Math.ceil(avgDailyDemand * leadTimeDays + safetyStock);

     // Economic order quantity: order enough for 30 days + safety stock
     const recommendedOrderQty = Math.max(
       Math.ceil(avgDailyDemand * 30),
       product.min_order_quantity ?? 1
     );

     const daysOfSupply = avgDailyDemand > 0
       ? Math.floor(inventory.quantity_on_hand / avgDailyDemand)
       : 999;

     const urgency = daysOfSupply < leadTimeDays
       ? 'critical'
       : daysOfSupply < leadTimeDays * 2
         ? 'warning'
         : 'ok';

     return {
       productId,
       currentStock: inventory.quantity_on_hand,
       reorderPoint,
       recommendedOrderQty,
       daysOfSupply,
       urgency,
     };
   }
   ```

## Examples

### Daily replenishment recommendations report

```typescript
async function generateReplenishmentReport(): Promise<ReplenishmentRecommendation[]> {
  const products = await db.products.findAll({ is_active: true, track_inventory: true });

  const recommendations = await Promise.all(
    products.map(p => computeReplenishment(p.id).catch(err => {
      console.error(`Forecast failed for ${p.id}:`, err);
      return null;
    }))
  );

  return recommendations
    .filter((r): r is ReplenishmentRecommendation => r !== null)
    .filter(r => r.urgency !== 'ok')
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, ok: 2 };
      return order[a.urgency] - order[b.urgency];
    });
}
```

### Seasonal demand query: compare this week vs the same week last year

```sql
WITH this_year AS (
  SELECT product_id, SUM(units_sold) AS units
  FROM daily_sales
  WHERE sale_date BETWEEN DATE_TRUNC('week', NOW()) AND DATE_TRUNC('week', NOW()) + 6
  GROUP BY product_id
),
last_year AS (
  SELECT product_id, SUM(units_sold) AS units
  FROM daily_sales
  WHERE sale_date BETWEEN DATE_TRUNC('week', NOW()) - 364 AND DATE_TRUNC('week', NOW()) - 358
  GROUP BY product_id
)
SELECT
  p.name,
  COALESCE(ty.units, 0) AS this_week,
  COALESCE(ly.units, 0) AS last_year_same_week,
  ROUND((COALESCE(ty.units, 0) - COALESCE(ly.units, 0))::numeric / NULLIF(ly.units, 0) * 100, 1) AS yoy_pct
FROM products p
LEFT JOIN this_year ty ON ty.product_id = p.id
LEFT JOIN last_year ly ON ly.product_id = p.id
ORDER BY yoy_pct DESC NULLS LAST;
```

## Best Practices

- **Exclude cancelled and refunded orders** from the sales history time series; including them inflates demand and causes over-ordering
- **Refresh the materialized view nightly** — run `REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales` after order midnight cutoff so recommendations are based on yesterday's data
- **Use a higher service level (Z=2.05 for 98%) for high-velocity, high-margin SKUs** and a lower level (Z=1.28 for 90%) for slow movers to balance service and holding costs
- **Incorporate promotional calendar** — planned flash sales, seasonal peaks, and marketing campaigns will spike demand beyond the statistical model; allow buyers to manually adjust forecasts
- **Set a minimum of 26 weeks of history** before running the decomposition model; fewer weeks mean unreliable seasonal indices
- **Alert on abnormal demand spikes immediately** — if actual daily sales exceed the 95th percentile of the forecast, send an alert so buyers can expedite replenishment
- **Track forecast accuracy (MAPE)** — compute Mean Absolute Percentage Error monthly; a MAPE above 30% signals the model needs recalibration or that demand patterns have structurally changed

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| New products have no history for forecasting | For products under 90 days old, use a category-average demand rate as a proxy until enough data accumulates |
| Seasonal index is wrong for a product that didn't exist last year | Detect insufficient history and fall back to a category-level seasonal index |
| Safety stock computed too low causes stockouts | Increase the service level Z-score or capture outlier demand events (flash sales) in the residual calculation |
| Replenishment recommendation doesn't account for pending POs | Subtract `quantity_on_order` (from open POs) from the recommended order quantity before presenting to the buyer |

## Related Skills

- @order-management-system
- @vendor-management
- @multi-channel-selling
- @ab-testing-pricing
- @dynamic-pricing
