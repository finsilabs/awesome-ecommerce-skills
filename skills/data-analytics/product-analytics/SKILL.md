---
name: product-analytics
description: "Track product performance with sell-through rates, views-to-purchase conversion, dead stock identification, and category-level reporting"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [product-analytics, sell-through, dead-stock, inventory, performance, pdp, merchandising, catalog]
triggers: ["product analytics", "product performance", "sell-through rate", "dead stock", "inventory analytics", "product metrics", "merchandising analytics"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Analytics

## Overview

Product analytics reveals which products drive revenue, which are overstocked, and which product pages are losing shoppers before they add to cart. The core analyses — sell-through rate, dead stock identification, PDP conversion funnel, and category performance — give your buying and merchandising team the data they need to make confident reorder, markdown, and catalog decisions.

This skill guides you through running these analyses using your platform's built-in tools and dedicated apps, without building custom data pipelines.

## When to Use This Skill

- When the buying team needs a weekly sell-through report to decide on reorders and markdowns
- When building a product performance dashboard for merchandisers
- When identifying dead stock that ties up capital
- When measuring which products have high views but low add-to-cart rates
- When ranking products for collection page sorting based on performance data
- When generating a catalog health report before a seasonal reset

## Core Instructions

### Step 1: Choose your product analytics tool by platform

| Platform | Tool | What It Provides |
|----------|------|-----------------|
| **Shopify** | **Shopify Analytics** (built-in) | Product-level revenue, units sold, sell-through (if cost entered); free |
| **Shopify** | **Inventory Planner** (App Store) | Sell-through rates, days of supply, reorder recommendations, dead stock alerts |
| **Shopify** | **Google Analytics 4** (via Shopify's GA4 integration) | PDP views, add-to-cart rate, checkout funnel by product |
| **WooCommerce** | **WooCommerce Analytics** (built-in) | Product revenue, units sold, orders by product; free |
| **WooCommerce** | **Metorik** | Advanced product analytics including sell-through, cohort analysis by product, and dead stock reports |
| **BigCommerce** | **BigCommerce Analytics → Merchandising** (built-in) | Product revenue, units sold, and conversion rate by product |
| **BigCommerce** | **Glew.io** (App Marketplace) | Advanced sell-through, dead stock, and product lifecycle analytics |
| **All platforms** | **Google Analytics 4 + enhanced ecommerce** | Views-to-cart-to-purchase funnel by product; requires GA4 setup with ecommerce tracking |

### Step 2: Analyze sell-through rate

Sell-through rate measures how much of received inventory has been sold:
```
Sell-through % = Units Sold / (Units Sold + Units On Hand) × 100
```

A product at 80%+ sell-through is performing well. Below 30% after 60+ days suggests slow movement.

---

#### Shopify

**Using Shopify Analytics:**
1. Go to **Analytics → Reports → Inventory sold and remaining** (this is the sell-through report)
2. Set the date range to the product's launch date or the beginning of the season
3. The report shows: Units received, Units sold, Units remaining, and % sold for each variant
4. Export to CSV for detailed analysis

**Using Inventory Planner:**
1. Install **Inventory Planner** from the Shopify App Store
2. Go to **Inventory Planner → Reports → Sell-Through** — shows sell-through rate by product and variant
3. Go to **Inventory Planner → Reports → Days of Supply** — shows how many days of stock remain at current sales velocity
4. Go to **Inventory Planner → Replenishment** — automatically recommends reorder quantities and timing

**Key sell-through benchmarks by category:**
- Fashion/seasonal items: Target 70%+ sell-through by end of season; anything below 40% at season end needs markdown
- Evergreen/perennial basics: 50–70% sell-through is normal (higher in-stock availability is intentional)
- Perishables/consumables: 85%+ (low days of supply is the goal)

---

#### WooCommerce

**Using WooCommerce Analytics:**
1. Go to **WooCommerce → Analytics → Products**
2. Set date range to the period you want to analyze
3. View: Revenue, Quantity, Average price, Orders by product
4. Export to CSV; calculate sell-through manually by dividing quantity sold by (quantity sold + current stock)

**Using Metorik:**
1. Go to **Metorik → Products** — view all products with revenue, units sold, and refund data
2. Apply the **Slow Moving** filter to identify products with low recent sales relative to their stock levels
3. Create a **Segment** in Metorik for "products with 0 sales in the last 60 days" and monitor regularly

---

#### BigCommerce

1. Go to **Analytics → Merchandising → Products** — shows revenue, units sold, and conversion rate per product
2. Go to **Analytics → Merchandising → Inventory** — shows current stock levels alongside recent sales velocity
3. Install **Glew.io** for sell-through rate calculations and dead stock alerts with automated weekly digest emails

---

### Step 3: Identify dead stock

Dead stock is inventory that has been on hand for a long time with minimal or no sales. It ties up working capital, occupies warehouse space, and often requires markdowns to liquidate.

**Dead stock criteria (adjust by category):**
- Fashion/seasonal: On hand 60+ days + sell-through < 20%
- Evergreen basics: On hand 120+ days + sell-through < 15%
- High-value items: On hand 90+ days + inventory value > $500

**Finding dead stock by platform:**

**Shopify:**
1. Go to **Analytics → Reports → Inventory sold and remaining** — filter for products with > 90 days since first available AND sell-through < 20%
2. Alternatively, install **Inventory Planner** → go to **Reports → Excess Inventory** for automated dead stock identification with capital-at-risk calculation

**WooCommerce:**
1. Go to **WooCommerce → Analytics → Products** — sort by "units sold ascending" to find products with minimal recent sales
2. Cross-reference with **WooCommerce → Products → Inventory** for current stock levels
3. Metorik makes this easier: go to **Metorik → Products → Filter by: 0 sales in last 90 days AND stock > 0**

**Dead stock action guide:**

| Days on Hand | Sell-Through | Recommended Action |
|-------------|-------------|-------------------|
| 60–90 days | < 20% | 10–15% markdown; add to promotional emails |
| 91–120 days | < 15% | 20–25% markdown; feature in collections and homepage |
| 120–180 days | < 10% | 30–40% markdown; run dedicated clearance campaign |
| 180+ days | < 5% | 40–50% markdown or bundle with fast-movers; consider liquidation if markup still negative |

### Step 4: Measure product page conversion (Views → ATC → Purchase)

A product with high traffic but low add-to-cart rate signals a page problem: pricing, description, images, or reviews.

**Setting up product-level funnel tracking:**

All platforms require Google Analytics 4 with Enhanced Ecommerce for PDP conversion tracking.

**Shopify:**
1. Go to **Shopify → Online Store → Preferences → Google Analytics** and add your GA4 Measurement ID
2. Or install **Google & YouTube** from the Shopify App Store (recommended — includes server-side events)
3. In GA4, go to **Reports → Monetization → Ecommerce purchases** → filter by item to see views, add-to-carts, and purchases per product
4. For a funnel view: go to **GA4 → Explore → Funnel exploration** and build a funnel: `view_item` → `add_to_cart` → `begin_checkout` → `purchase`; dimension by `item_name`

**WooCommerce:**
1. Install **Google Analytics for WooCommerce by MonsterInsights** or **Site Kit by Google** — both send WooCommerce product events to GA4 automatically
2. View product funnel the same way as Shopify in GA4

**BigCommerce:**
1. Go to **BigCommerce → Analytics → Marketing → Connected Channels → Google Analytics** and enable Enhanced Ecommerce
2. View product funnel in GA4

**Key PDP conversion benchmarks:**
- PDP view → Add to cart: 5–15% is typical; below 3% warrants investigation
- Add to cart → Purchase: 40–60% is typical

**What low add-to-cart rate usually means:**
- Price is too high relative to perceived value → A/B test price or add value (bundle, guarantee)
- Product images are poor quality or show the product unclearly → Improve photography
- Description does not address customer objections → Add FAQ section, size guide, or material details
- Reviews are low or absent → Activate review request automation

### Step 5: Build a weekly catalog health report

Combine sell-through, dead stock, and conversion data into a weekly report for the buying team.

**Report structure (can be a recurring Metorik digest, Inventory Planner export, or manual Shopify CSV export):**

```
WEEKLY CATALOG HEALTH REPORT — Week of [Date]

HEADLINE METRICS
  Active SKUs: 284
  Dead stock count (>90 days, <15% ST): 23 SKUs ($41,200 at cost)
  Low stock / reorder needed (<14 days supply): 12 SKUs
  New arrivals launched this week: 8 SKUs

TOP PERFORMERS (Revenue, last 7 days)
  [Product A] — $12,400 — 78% sell-through — 14 days supply remaining
  [Product B] — $9,800 — 65% sell-through — 32 days supply remaining

PRODUCTS NEEDING ATTENTION
  Slow movers (on hand >90 days, <20% ST):
    [SKU X] — 180 days on hand — 8% ST — $4,200 inventory value — ACTION: 30% markdown
    [SKU Y] — 120 days on hand — 12% ST — $2,800 inventory value — ACTION: 20% markdown

  High views, low ATC (>200 views last 7 days, <3% ATC):
    [Product Z] — 340 views — 1.8% ATC — Review product description and pricing
```

## Best Practices

- **Report sell-through weekly, not monthly** — a weekly cadence lets buyers intervene before products age into dead stock
- **Always include inventory value** (units × cost) in dead stock reports — a merchant cares more about $5,000 tied up in slow movers than 100 units of a $3 product
- **Set different dead-stock thresholds by category** — fashion items become dead stock faster (60 days) than perennial basics (180 days); configure category-specific thresholds in Inventory Planner or your reporting tool
- **Use days of supply, not just inventory count** — 500 units of a product selling 5/day (100 days of supply) is very different from 500 units selling 1/day (500 days); days of supply is the actionable metric
- **Pair low-ATC-rate alerts with session recording** — tools like **Hotjar** or **Lucky Orange** (Shopify App Store) let you watch real visitor sessions on high-traffic/low-converting product pages; often reveals issues invisible in metrics alone
- **Include return rate in product health scoring** — high-return products look good on revenue but erode margin; investigate and possibly discontinue before reordering

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Dead stock report includes recently launched products | Exclude products launched in the last 30 days from dead stock analysis; they need time to ramp up before being flagged |
| Sell-through over 100% | Inventory received was understated — check if inventory received captures all purchase orders including transfers and returns |
| Days of supply calculation shows zero for products that are not selling | Handle zero-sales denominator as "effectively infinite stock" rather than division by zero; display as "No recent sales" in reports |
| PDP conversion data does not match expectations | Verify GA4 Enhanced Ecommerce events are firing correctly on product pages; use GA4's DebugView to confirm `view_item` and `add_to_cart` events |
| Product analytics slow on large catalogs | Materialize a weekly product performance summary table in your data warehouse or use Inventory Planner's pre-computed metrics instead of querying raw order data |

## Related Skills

- @sales-reporting-dashboard
- @customer-analytics
- @ab-testing-ecommerce
- @profit-margin-analysis
