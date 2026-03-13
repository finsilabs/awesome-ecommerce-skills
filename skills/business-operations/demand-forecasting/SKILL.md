---
name: demand-forecasting
description: "Predict future inventory needs using historical sales data, seasonal trends, and reorder points to prevent stockouts and overstock"
category: business-operations
risk: safe
source: curated
date_added: "2026-03-12"
tags: [demand-forecasting, inventory-planning, seasonality, sales-history, reorder-points, stockout-prevention]
triggers: ["demand forecasting", "inventory forecasting", "predict demand", "reorder points", "stockout prevention", "inventory planning", "sales prediction"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Demand Forecasting

## Overview

Demand forecasting uses historical sales data, seasonal patterns, and lead times to predict how much inventory you'll need and when to reorder. Chronic stockouts or overstock situations are usually a sign that reorder points are based on intuition rather than data. Purpose-built inventory planning tools handle this for most merchants — custom forecasting code is only necessary for unique operational requirements.

## When to Use This Skill

- When chronic stockouts or overstock situations indicate that current reorder points are set incorrectly
- When building automated replenishment recommendations to reduce manual inventory review
- When planning inventory for seasonal peaks (Black Friday, back-to-school, holiday season)
- When you have 12+ months of sales history and want to extract meaningful demand patterns
- When integrating with supplier lead times and purchase order workflows for end-to-end replenishment

## Core Instructions

### Step 1: Determine your platform and choose the right forecasting tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Inventory Planner (Shopify App Store) or Cogsy | Inventory Planner connects directly to Shopify, analyzes 12+ months of sales history, calculates reorder points, and generates purchase orders |
| **WooCommerce** | ATUM Inventory Management (free/premium) or Inventory Planner | ATUM provides reorder point management natively in WooCommerce; Inventory Planner has a WooCommerce connector for advanced forecasting |
| **BigCommerce** | Inventory Planner or Linnworks | Both have BigCommerce native integrations and handle multi-location inventory forecasting |
| **Multi-channel** | Skubana (now Extensiv) or Linnworks | Handles inventory forecasting across Shopify, WooCommerce, Amazon, and eBay from a single dashboard |
| **Custom / Headless** | Build a time-series analysis layer on top of your order database | Use moving averages, seasonal decomposition, and safety stock formulas against your historical sales data |

### Step 2: Set up sales history data collection

Accurate forecasting requires clean historical data. Before running any forecast:

1. **Ensure cancelled and refunded orders are excluded** from your sales totals — most forecasting tools handle this automatically when connected to your platform
2. **Tag promotional periods** — flash sales, holiday spikes, and influencer-driven demand should be flagged as abnormal; they inflate baseline demand estimates if included uncritically
3. **You need at least 6 months of history** for basic seasonal pattern detection; 12+ months is required to see year-over-year trends

#### Shopify

**Using Inventory Planner:**
1. Install **Inventory Planner** from the Shopify App Store (14-day free trial, then $99+/month)
2. Inventory Planner pulls your full Shopify sales history automatically on connection
3. Connect your suppliers in Inventory Planner → Suppliers with their lead times (e.g., Supplier A = 14 days, Supplier B = 7 days)
4. Set your desired service level (e.g., 95% — meaning you want to have stock for 95% of demand scenarios) in Settings → Forecasting
5. Inventory Planner calculates reorder points and recommended order quantities per SKU, updated daily

**Shopify Analytics (built-in, no app needed for basic trends):**
1. Go to **Analytics → Reports → Inventory**
2. The "Days of inventory remaining" report shows how many days of stock you have at current sell-through rate
3. Go to **Analytics → Reports → Sales over time** → group by product to see monthly sales trends
4. Use these as inputs for manual reorder decisions if you don't want to pay for a forecasting app

#### WooCommerce

**Using ATUM Inventory Management (free tier available):**
1. Install **ATUM Inventory Management for WooCommerce** from WordPress.org (free) or purchase the premium version
2. ATUM adds a master inventory list view with real-time stock levels, daily sales rates, and low-stock alerts
3. In ATUM → Settings → Reorder Points, configure your reorder levels and safety stock per SKU
4. ATUM's premium **Purchase Orders** module generates POs automatically when stock hits the reorder point

**Using Inventory Planner for WooCommerce:**
1. Connect Inventory Planner to WooCommerce via their native API connector
2. Same workflow as Shopify — Inventory Planner analyzes your WooCommerce sales history and generates forecasts

#### BigCommerce

**Using Inventory Planner:**
1. Connect Inventory Planner via the BigCommerce API (Inventory Planner → Settings → Connect Store)
2. Inventory Planner pulls sales history from BigCommerce and generates replenishment recommendations

**BigCommerce built-in low-stock alerts:**
1. Go to **Products → [Product] → Inventory**
2. Set "Low stock level" for each product — BigCommerce emails you when stock drops below this threshold
3. This is a simple alert, not a forecast — use it as a backstop while you set up a proper forecasting tool

### Step 3: Configure reorder points and safety stock

Reorder point = demand during lead time + safety stock buffer.

**In Inventory Planner:**
1. Inventory Planner calculates this automatically based on your sales history and supplier lead times
2. Review the recommendations in Inventory Planner → Replenishment — items are sorted by urgency (days of stock remaining vs. lead time)
3. Adjust recommendations manually before creating purchase orders (e.g., if you know a supplier has extra lead time for a specific product)
4. Export purchase orders directly from Inventory Planner to email to your suppliers

**Manual calculation (if not using a forecasting tool):**
- **Average daily demand** = total units sold in last 30 days / 30
- **Safety stock** = (maximum daily demand – average daily demand) × lead time in days
- **Reorder point** = (average daily demand × lead time in days) + safety stock
- **Example:** Average daily demand = 5 units, lead time = 14 days, max daily demand = 8 units
  - Safety stock = (8–5) × 14 = 42 units
  - Reorder point = (5 × 14) + 42 = 112 units

### Step 4: Plan for seasonal demand

Seasonality is the biggest cause of forecast errors. Plan for it explicitly.

**In Inventory Planner:**
1. Go to Inventory Planner → Settings → Seasonality
2. Inventory Planner detects seasonal patterns automatically from your sales history
3. For first-year merchants (no prior year data): manually set seasonal multipliers — e.g., December = 3x normal demand for holiday products

**Building a seasonal calendar manually:**
1. Export your sales by month for the past 2+ years from Shopify Reports / WooCommerce / BigCommerce
2. Calculate the ratio of each month's sales to the annual average (December / average month = seasonal index)
3. Apply the seasonal index to your daily demand forecast when placing orders for the upcoming peak season

**Promotional calendar:**
- Flag planned promotions (flash sales, influencer campaigns) in your forecasting tool
- Most forecasting tools allow manual demand overrides for specific date ranges
- For Black Friday/Cyber Monday: increase your forecast by your historical BFCM lift percentage (typically 3–8x for e-commerce)

### Step 5: Generate and approve replenishment recommendations

**In Inventory Planner:**
1. Go to Inventory Planner → Replenishment → Review recommendations
2. Filter by "Critical" (stock-out in fewer days than lead time) and "Warning" (stock-out within 2x lead time)
3. Adjust quantities if you have market intelligence the model doesn't know (planned sales, anticipated supply issues)
4. Click "Create Purchase Order" — Inventory Planner generates a PO to send to your supplier
5. Track the PO status in Inventory Planner → Purchase Orders; when received, update actual receipt dates to improve future lead time estimates

### Step 6: Custom / Headless — demand forecasting from sales data

```typescript
// Compute average daily demand from your order database
async function computeAverageDailyDemand(
  productId: string,
  lookbackDays: number = 30
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const result = await db.raw(`
    SELECT COALESCE(SUM(ol.quantity), 0) AS total_units
    FROM order_lines ol
    JOIN orders o ON o.id = ol.order_id
    WHERE ol.product_id = ?
      AND o.status NOT IN ('cancelled', 'refunded')
      AND o.created_at >= ?
  `, [productId, since]);

  return result.rows[0].total_units / lookbackDays;
}

// Calculate reorder point with safety stock
function calculateReorderPoint(params: {
  avgDailyDemand: number;
  maxDailyDemand: number;   // observed peak daily demand
  leadTimeDays: number;
}): number {
  const safetyStock = (params.maxDailyDemand - params.avgDailyDemand) * params.leadTimeDays;
  return Math.ceil(params.avgDailyDemand * params.leadTimeDays + safetyStock);
}

// Generate replenishment recommendations for all active products
async function generateReplenishmentReport(): Promise<{
  productId: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  daysOfSupply: number;
  urgency: 'critical' | 'warning' | 'ok';
}[]> {
  const products = await db.products.findAll({ is_active: true, track_inventory: true });
  const recommendations = [];

  for (const product of products) {
    const inventory = await db.inventory.findByProductId(product.id);
    const avgDemand = await computeAverageDailyDemand(product.id, 30);
    const maxDemand = await computeAverageDailyDemand(product.id, 7); // shorter window = more volatile
    const leadTimeDays = product.supplier_lead_time_days ?? 14;

    const reorderPoint = calculateReorderPoint({ avgDailyDemand: avgDemand, maxDailyDemand: maxDemand, leadTimeDays });
    const daysOfSupply = avgDemand > 0 ? Math.floor(inventory.quantity_on_hand / avgDemand) : 999;
    const urgency = daysOfSupply < leadTimeDays ? 'critical' : daysOfSupply < leadTimeDays * 2 ? 'warning' : 'ok';

    if (urgency !== 'ok') {
      recommendations.push({ productId: product.id, sku: product.sku, currentStock: inventory.quantity_on_hand, reorderPoint, daysOfSupply, urgency });
    }
  }

  return recommendations.sort((a, b) => a.daysOfSupply - b.daysOfSupply);
}
```

## Best Practices

- **Start with a tool like Inventory Planner before building custom forecasting** — $100–$300/month is far cheaper than engineering time, and the models are more accurate than a hand-rolled moving average
- **Set a minimum of 6 months of sales history** before trusting any forecast; for new products, use a category-average demand rate as a proxy
- **Adjust forecasts for known events** — planned promotions, seasonal campaigns, and supply chain disruptions should be entered as manual overrides in your forecasting tool
- **Track forecast accuracy monthly** — compare forecast units to actual units sold; if you're off by more than 25% consistently, recalibrate your assumptions or look for a structural change in demand patterns
- **Account for pending purchase orders** — subtract quantity on order from your recommended replenishment qty before placing a new PO; double-ordering is a common and expensive mistake

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| New products have no history to forecast from | Use category average demand rate for the first 90 days; Inventory Planner has a "new product" mode that adjusts for this |
| Forecast doesn't account for supplier stockouts | Track supplier fill rates in your vendor management system; if a supplier consistently ships 80% of ordered qty, order 25% more to compensate |
| Safety stock too low, stockouts still happen | Increase your service level setting in Inventory Planner from 90% to 95–98% for high-velocity SKUs |
| Replenishment recommendation ignores open POs | Always check "quantity on order" before creating a new PO; Inventory Planner shows this automatically, but manual calculations often miss it |

## Related Skills

- @order-management-system
- @vendor-management
- @multi-channel-selling
