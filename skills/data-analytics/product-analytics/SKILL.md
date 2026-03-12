---
name: product-analytics
description: "Product performance metrics, sell-through rates, and dead stock identification"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [product-analytics, sell-through, dead-stock, inventory, performance, pdp, merchandising, catalog]
triggers: ["product analytics", "product performance", "sell-through rate", "dead stock", "inventory analytics", "product metrics", "merchandising analytics"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Analytics

## Overview

Product analytics reveals which products drive revenue, which are overstocked, and which product pages are losing shoppers before they add to cart. This skill covers calculating sell-through rates, identifying dead stock that ties up capital, measuring product page conversion funnels (views → ATC → purchase), and generating a merchandising health score that combines multiple signals into a single actionable metric per product.

## When to Use This Skill

- When the buying team needs a weekly sell-through report to decide on reorders and markdowns
- When building a product performance dashboard for merchandisers
- When identifying dead stock to inform promotional pricing or clearance strategies
- When measuring which products have high views but low add-to-cart rates (PDP conversion issues)
- When ranking products for collection page sorting based on performance data
- When generating a catalog health report before a seasonal reset

## Core Instructions

1. **Calculate sell-through rate per product**

   Sell-through rate measures how much of received inventory has been sold, expressed as a percentage:

   ```sql
   -- Sell-through rate: units sold / (units on hand + units sold)
   SELECT
     p.id AS product_id,
     p.name,
     p.sku,
     SUM(pv.inventory_received) AS units_received,
     SUM(oi.quantity) AS units_sold,
     SUM(pv.inventory_on_hand) AS units_on_hand,
     ROUND(100.0 * SUM(oi.quantity) / NULLIF(SUM(pv.inventory_received), 0), 1) AS sell_through_pct,
     -- Days of supply: at current sell rate, how many days until OOS
     NULLIF(SUM(pv.inventory_on_hand), 0) /
       NULLIF(SUM(oi.quantity) / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - p.first_available_at)) / 86400), 0)
       AS days_of_supply
   FROM products p
   JOIN product_variants pv ON pv.product_id = p.id
   LEFT JOIN order_items oi ON oi.variant_id = pv.id
   LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('cancelled', 'refunded')
   GROUP BY p.id, p.name, p.sku
   ORDER BY sell_through_pct DESC;
   ```

2. **Identify dead stock**

   Dead stock is inventory that has been on hand for a long time with minimal or no sales:

   ```typescript
   async function identifyDeadStock(params: {
     minDaysOnHand: number;    // e.g., 90 — items on shelf for 90+ days
     maxSellThroughPct: number; // e.g., 0.15 — less than 15% sold
     minInventoryValue: number; // e.g., 100 — only flag if > $100 in inventory
   }): Promise<DeadStockItem[]> {
     const products = await db.query(`
       SELECT
         p.id,
         p.name,
         p.sku,
         SUM(pv.inventory_on_hand) AS units_on_hand,
         SUM(pv.inventory_on_hand) * p.cost_cents / 100.0 AS inventory_value,
         MAX(p.first_available_at) AS first_available_at,
         COALESCE(SUM(oi.quantity), 0) AS units_sold_lifetime,
         EXTRACT(EPOCH FROM (NOW() - MAX(p.first_available_at))) / 86400 AS days_on_hand
       FROM products p
       JOIN product_variants pv ON pv.product_id = p.id
       LEFT JOIN order_items oi ON oi.variant_id = pv.id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('cancelled', 'refunded')
       WHERE p.status = 'active'
       GROUP BY p.id, p.name, p.sku
       HAVING
         EXTRACT(EPOCH FROM (NOW() - MAX(p.first_available_at))) / 86400 >= $1
         AND COALESCE(SUM(oi.quantity), 0) / NULLIF(SUM(pv.inventory_received), 0) <= $2
         AND SUM(pv.inventory_on_hand) * p.cost_cents / 100.0 >= $3
     `, [params.minDaysOnHand, params.maxSellThroughPct, params.minInventoryValue]);

     return products.map((p: any) => ({
       ...p,
       recommendedAction:
         p.days_on_hand > 180 ? 'liquidate' :
         p.days_on_hand > 120 ? 'markdown_20pct' : 'markdown_10pct',
     }));
   }
   ```

3. **Measure PDP funnel conversion (views → ATC → purchase)**

   ```sql
   -- Product page conversion funnel for a date range
   WITH views AS (
     SELECT product_id, COUNT(DISTINCT session_id) AS pdp_views
     FROM page_view_events
     WHERE page_type = 'product' AND created_at BETWEEN :start AND :end
     GROUP BY product_id
   ),
   atc AS (
     SELECT product_id, COUNT(DISTINCT session_id) AS atc_sessions
     FROM cart_events
     WHERE event = 'add_to_cart' AND created_at BETWEEN :start AND :end
     GROUP BY product_id
   ),
   purchases AS (
     SELECT oi.product_id, COUNT(DISTINCT oi.order_id) AS purchase_count
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.created_at BETWEEN :start AND :end AND o.status NOT IN ('cancelled')
     GROUP BY oi.product_id
   )
   SELECT
     p.id AS product_id,
     p.name,
     COALESCE(v.pdp_views, 0) AS pdp_views,
     COALESCE(a.atc_sessions, 0) AS atc_sessions,
     COALESCE(pu.purchase_count, 0) AS purchases,
     ROUND(100.0 * COALESCE(a.atc_sessions, 0) / NULLIF(v.pdp_views, 0), 1) AS pdp_to_atc_pct,
     ROUND(100.0 * COALESCE(pu.purchase_count, 0) / NULLIF(v.pdp_views, 0), 2) AS pdp_conversion_pct
   FROM products p
   LEFT JOIN views v ON p.id = v.product_id
   LEFT JOIN atc a ON p.id = a.product_id
   LEFT JOIN purchases pu ON p.id = pu.product_id
   WHERE COALESCE(v.pdp_views, 0) > 50 -- minimum views threshold
   ORDER BY pdp_conversion_pct DESC;
   ```

4. **Build a merchandising health score**

   Combine multiple signals into a single score (0–100) to rank products for collection sorting:

   ```typescript
   interface ProductHealthInputs {
     sellThroughPct: number;      // 0–100
     pdpConversionPct: number;    // 0–100
     revenueRank: number;         // 1 = top, higher = lower
     reviewScore: number;         // 1–5
     daysOnHand: number;          // positive = has stock, negative = OOS
     returnsRate: number;         // 0–100
   }

   function calculateMerchandisingScore(inputs: ProductHealthInputs): number {
     const weights = {
       sellThrough: 0.25,
       pdpConversion: 0.25,
       revenueRank: 0.20,
       reviews: 0.15,
       stockHealth: 0.10,
       returns: 0.05,
     };

     // Normalize each dimension to 0–100
     const scores = {
       sellThrough: Math.min(inputs.sellThroughPct, 100),
       pdpConversion: Math.min(inputs.pdpConversionPct * 20, 100), // 5% CVR = 100
       revenueRank: Math.max(0, 100 - (inputs.revenueRank - 1) * 2),
       reviews: ((inputs.reviewScore - 1) / 4) * 100,
       stockHealth: inputs.daysOnHand > 0 ? Math.min(inputs.daysOnHand, 100) : 0,
       returns: Math.max(0, 100 - inputs.returnsRate * 5),
     };

     return Object.entries(weights).reduce(
       (total, [key, weight]) => total + scores[key as keyof typeof scores] * weight,
       0
     );
   }
   ```

5. **Generate a weekly catalog health report**

   ```typescript
   async function generateWeeklyCatalogReport() {
     const [sellThrough, deadStock, pdpFunnel, topProducts] = await Promise.all([
       db.query(sellThroughSQL),
       identifyDeadStock({ minDaysOnHand: 90, maxSellThroughPct: 0.15, minInventoryValue: 100 }),
       db.query(pdpFunnelSQL, [subDays(new Date(), 7), new Date()]),
       db.query(topProductsSQL, [subDays(new Date(), 7), new Date(), 20]),
     ]);

     return {
       generatedAt: new Date().toISOString(),
       summary: {
         totalActiveProducts: sellThrough.length,
         deadStockCount: deadStock.length,
         deadStockValue: deadStock.reduce((sum: number, p: any) => sum + p.inventory_value, 0),
         avgSellThroughPct: sellThrough.reduce((sum: number, p: any) => sum + p.sell_through_pct, 0) / sellThrough.length,
       },
       alerts: {
         lowStock: sellThrough.filter((p: any) => p.days_of_supply < 14 && p.sell_through_pct > 50),
         overstock: sellThrough.filter((p: any) => p.days_of_supply > 180),
         deadStock,
       },
       topProducts,
       lowConversionProducts: pdpFunnel.filter((p: any) => p.pdp_views > 100 && p.pdp_to_atc_pct < 2),
     };
   }
   ```

## Examples

### Variant-level sell-through to find slow-moving sizes

```sql
-- Which sizes/colors are selling slowest within a product?
SELECT
  p.name AS product_name,
  pv.color,
  pv.size,
  pv.inventory_on_hand,
  COALESCE(oi_stats.units_sold, 0) AS units_sold,
  ROUND(100.0 * COALESCE(oi_stats.units_sold, 0) / NULLIF(pv.inventory_received, 0), 1) AS sell_through_pct
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
LEFT JOIN (
  SELECT variant_id, SUM(quantity) AS units_sold
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status NOT IN ('cancelled', 'refunded')
  GROUP BY variant_id
) oi_stats ON pv.id = oi_stats.variant_id
WHERE p.id = :product_id
ORDER BY sell_through_pct ASC;
```

### Auto-generate markdown recommendations

```typescript
async function generateMarkdownRecommendations() {
  const deadStockItems = await identifyDeadStock({ minDaysOnHand: 90, maxSellThroughPct: 0.15, minInventoryValue: 100 });

  return deadStockItems.map((item) => {
    const currentPriceCents = item.price_cents;
    const markdownPct = item.recommended_action === 'liquidate' ? 40 : item.recommended_action === 'markdown_20pct' ? 20 : 10;
    const newPriceCents = Math.round(currentPriceCents * (1 - markdownPct / 100));

    return {
      productId: item.id,
      productName: item.name,
      currentPrice: currentPriceCents / 100,
      suggestedPrice: newPriceCents / 100,
      markdownPct,
      inventoryValue: item.inventory_value,
      daysOnHand: Math.round(item.days_on_hand),
      reason: `${Math.round(item.sell_through_pct)}% sell-through after ${Math.round(item.days_on_hand)} days`,
    };
  });
}
```

## Best Practices

- **Report sell-through weekly, not monthly** — a weekly cadence lets buyers intervene before products age into dead stock
- **Always include inventory value** (units × cost) in dead stock reports — a merchant cares more about $5,000 tied up in slow movers than 100 units of a $3 product
- **Set different dead-stock thresholds by category** — fashion items become dead stock faster (60 days) than perennial basics (180 days)
- **Pair low-ATC-rate alerts with heatmap data** — a product with many views but few ATC events is often a pricing, description, or image quality issue
- **Use days of supply, not just inventory count** — 500 units of a product selling 5/day (100 days of supply) is very different from 500 units selling 1/day (500 days)
- **Include returns rate in product health scoring** — high-return products look good on revenue but erode margins; they need investigation before reorder
- **Export markdown recommendations to the pricing system automatically** — reduce the friction of acting on dead-stock insights by pushing them directly to price update workflows

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Sell-through rate over 100% | Inventory received was understated — check if `inventory_received` captures all purchase orders including transfers |
| Dead stock report includes recently launched products | Add `WHERE first_available_at < NOW() - INTERVAL '30 days'` to exclude new arrivals from the dead stock filter |
| PDP conversion query counts same session multiple times for multi-variant views | Deduplicate on `(session_id, product_id)` in the views CTE, not raw page view events |
| Days of supply calculation breaks when average daily sales is 0 | Use `NULLIF` on the denominator and handle NULL in the application layer as "effectively infinite stock" |
| Product analytics slow on catalogs with 50k+ products | Materialize the sell-through and funnel metrics into a `product_analytics_daily` rollup table refreshed overnight |

## Related Skills

- @sales-reporting-dashboard
- @customer-analytics
- @ab-testing-ecommerce
- @personalization-engine
- @google-shopping-feed
