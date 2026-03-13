---
name: merchandising-rules
description: "Control which products appear first in collections using automated ranking rules, manual overrides, and performance-based sorting algorithms"
category: business-operations
risk: safe
source: curated
date_added: "2026-03-12"
tags: [merchandising, product-ranking, collections, sorting, curation, search-relevance, boosting]
triggers: ["implement merchandising rules", "build product ranking", "automate collection curation", "product sorting algorithm"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Merchandising Rules

## Overview

Merchandising rules control which products appear first in your collections and search results. The goal is to surface products that are likely to convert — in-stock, popular, high-margin — while giving merchandisers manual control to pin hero products, hide out-of-stock items, and boost seasonal collections. Every major platform has some built-in sorting options; apps like Searchpie, Intelligems, or SearchPie add automated performance-based ranking.

## When to Use This Skill

- When building product ranking logic for collection and category pages
- When creating automated (smart) collections based on product attributes, tags, or performance
- When implementing search result boosting and burying for merchandising control
- When adding pinning (manual placement) and slot-based merchandising to collection pages
- When measuring the revenue impact of different product ranking strategies

## Core Instructions

### Step 1: Determine your platform and choose the right merchandising tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Shopify's built-in collection sorting + Kimonix or SearchPie | Shopify has built-in sort options; Kimonix and SearchPie add performance-based automated sorting with manual override capability |
| **WooCommerce** | WooCommerce's default sort + YITH WooCommerce Catalog Mode or WooCommerce Product Table | WooCommerce supports basic sorting; YITH and similar plugins add advanced catalog control |
| **BigCommerce** | Built-in Collection Sorting + SearchPie or Boost Commerce | BigCommerce has strong built-in category sorting; Boost Commerce adds advanced search merchandising |
| **Custom / Headless** | Algolia or Elasticsearch with a merchandising rules layer | Algolia has a built-in "Rules" and "Pinning" feature in its dashboard; Elasticsearch needs custom scoring rules |

### Step 2: Configure basic collection sorting

#### Shopify

**Built-in sorting options (no app needed):**
1. Go to **Products → Collections → [Collection] → Products**
2. From the "Sort" dropdown, choose:
   - **Best Selling** — sorts by total units sold historically (most popular first)
   - **Newest** — most recently added products first
   - **Price (Low to High / High to Low)** — price-based sorting
   - **Manually** — lets you drag products to specific positions
3. The "Manual" sort lets you pin specific products by dragging them to the top — useful for hero products and new launches

**Smart (automated) collections:**
1. Go to **Products → Collections → Create collection**
2. Set type to **Automated**
3. Add conditions: e.g., "Tag is equal to 'summer'" or "Product price is greater than $50"
4. Shopify automatically adds/removes products that meet the conditions
5. Set the sort order for the smart collection (Best Selling, Newest, etc.)

**Shopify Search & Discovery app (free):**
1. Install the **Shopify Search & Discovery** app from the App Store (free, by Shopify)
2. This app lets you boost specific products in search results and collection pages
3. Go to the app → Collections → [Collection] → Boost products to pin products to the top
4. Go to Bury products to push low-priority items (clearance, out-of-season) to the bottom

#### WooCommerce

**Built-in sorting:**
1. Go to **WooCommerce → Settings → Products → Default product sorting**
2. Options: Default (custom ordering), Popularity, Average Rating, Latest, Price (Low to High)
3. "Custom ordering" lets you drag products to specific positions in WooCommerce → Products
4. Enable multiple sort options for customers in WooCommerce → Settings → Products → Enable sorting

**Category product display (manual control):**
1. Go to **Products → Categories → [Category] → Products tab**
2. Drag products to reorder them within the category page
3. For programmatic control: install **WooCommerce Custom Order / Alphabetical Order** plugin

#### BigCommerce

1. Go to **Products → Product Categories → [Category]**
2. Click the **Sort** tab to set the default sort order for the category
3. Options: Name, Price, Date, Sales (best selling), Featured, Manual
4. "Manual" sort allows dragging products into specific positions
5. "Featured" sort shows products marked as "Featured" first, then falls back to the default

**BigCommerce Search:**
- BigCommerce's search returns results based on relevance by default
- To boost specific products in search: mark them as "Featured" or add keywords in the product SEO fields
- For advanced search merchandising: install **Boost Commerce** from the BigCommerce App Marketplace

### Step 3: Set up performance-based automated ranking

Performance-based ranking automatically promotes products that are selling well and pushes down slow-movers. This typically requires an app.

#### Shopify — Kimonix

1. Install **Kimonix** from the Shopify App Store (paid, starts ~$30/month)
2. Kimonix connects to your Shopify analytics and builds a score for each product based on:
   - Sales velocity (recent units sold)
   - Conversion rate (add-to-cart rate from collection)
   - Inventory level (deprioritize products about to go out of stock)
   - Margin (optional, if you've entered cost data)
3. Configure the weighting in Kimonix → Strategies: e.g., 50% sales velocity, 30% conversion rate, 20% inventory
4. Kimonix re-sorts the collection automatically on a schedule (hourly, daily, or triggered by events)
5. Override: manually pin products to specific positions — Kimonix respects manual pins and sorts the rest by algorithm

**Using Shopify Search & Discovery (free) for simpler boosts:**
1. Open the Search & Discovery app
2. Under Collections, select a collection and click "Add boost"
3. You can boost by product tag (e.g., boost all products tagged "new-arrival"), specific products, or product type
4. "Bury" works the same way for clearance items or out-of-season products

#### WooCommerce

**Using YITH WooCommerce Ajax Product Filter + WooCommerce Visual Products Configurator:**
- For basic automated sorting based on sales: WooCommerce's built-in "Sort by Popularity" uses a `total_sales` meta field that increments with each sale
- For advanced scoring: install **Booster for WooCommerce** which adds weighted product sorting based on custom criteria

#### BigCommerce — Boost Commerce

1. Install **Boost Commerce** from the BigCommerce App Marketplace
2. Boost Commerce adds smart sorting (by revenue, conversion rate, or custom score) to your category pages
3. Create "Merchandising Rules" in Boost Commerce to pin, boost, or bury specific products
4. Set up time-limited rules for seasonal campaigns (e.g., boost "winter" tagged products Dec–Feb)

### Step 4: Set up search result merchandising

#### Shopify

**Shopify Search & Discovery — search boosts:**
1. Open the Search & Discovery app → Search
2. Under "Boosts", click "Add boost" for specific search queries
3. Example: for the query "jacket", boost products tagged "featured-jacket" to the top
4. Under "Synonyms": add common spelling variations (e.g., "t-shirt" = "tshirt" = "tee")
5. Under "Product filters": configure which filters appear on search results (price, color, size, etc.)

#### WooCommerce

- **WooCommerce Product Search** plugin (WooCommerce.com) adds relevance-based search
- Configure search weights: title weight = 5, tag weight = 3, category weight = 2, description weight = 1
- For advanced merchandising: use **SearchWP** with its WooCommerce integration to create custom search rules

#### Custom / Headless — Algolia

1. Sign up at algolia.com and install the Algolia client in your store
2. Push your product catalog to Algolia with a background job
3. In Algolia's dashboard → Rules, create merchandising rules:
   - Pin a product to position 1 for a specific query
   - Boost products with a specific attribute (e.g., `in_stock: true`)
   - Bury products with `clearance: true`
4. Custom ranking: in Algolia → Indices → Ranking → Custom Ranking, add:
   - `desc(sales_30d)` — sort by recent sales descending
   - `desc(conversion_rate)` — secondary sort by conversion rate
5. Algolia updates rankings in real time as you push new product metrics to the index

### Step 5: Custom / Headless — scoring engine

```typescript
// Compute a merchandising score for a set of products
interface ProductMetrics {
  productId: string;
  unitsSold30d: number;
  revenue30d: number;
  conversionRatePct: number;   // (add-to-carts / page views) × 100
  grossMarginPct: number;
  daysInStock: number;         // 0 = out of stock
  daysSinceAdded: number;
}

interface ScoreWeights {
  salesVelocity: number;    // e.g., 0.35
  revenue: number;          // e.g., 0.20
  conversion: number;       // e.g., 0.20
  margin: number;           // e.g., 0.15
  recency: number;          // e.g., 0.10 (newer products get a boost)
}

function scoreProducts(metrics: ProductMetrics[], weights: ScoreWeights): { productId: string; score: number }[] {
  // Normalize each metric to 0–1 range across the set
  const normalize = (values: number[]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return values.map(v => max === min ? 0.5 : (v - min) / (max - min));
  };

  const salesScores = normalize(metrics.map(m => m.unitsSold30d));
  const revenueScores = normalize(metrics.map(m => m.revenue30d));
  const conversionScores = normalize(metrics.map(m => m.conversionRatePct));
  const marginScores = normalize(metrics.map(m => m.grossMarginPct));
  // Recency: newer = higher score (invert daysAdded)
  const recencyScores = normalize(metrics.map(m => -m.daysSinceAdded));

  return metrics.map((m, i) => {
    const score =
      salesScores[i] * weights.salesVelocity +
      revenueScores[i] * weights.revenue +
      conversionScores[i] * weights.conversion +
      marginScores[i] * weights.margin +
      recencyScores[i] * weights.recency;

    // Out-of-stock products get pushed to the bottom
    const adjustedScore = m.daysInStock === 0 ? score - 2 : score;
    return { productId: m.productId, score: Math.round(adjustedScore * 1000) / 1000 };
  }).sort((a, b) => b.score - a.score);
}
```

## Best Practices

- **Bury out-of-stock products, don't exclude them** — out-of-stock products should still appear in search (for SEO and wishlists) but rank lower; only completely remove discontinued products
- **Refresh scores daily, not on every page load** — pre-compute and store product scores; computing scores in real time on every collection request is too slow
- **Pin hero products and new arrivals manually** — automated scoring is good for the long tail; manually pin the 3–5 key products you're actively promoting each season
- **Provide a preview mode before applying new rules** — the Shopify Search & Discovery app and Kimonix both offer preview functionality; use it to verify the collection order before pushing live
- **Cap the number of pinned products** — if you pin too many products, the algorithm never gets to show other products; keep manual pins to ≤ 5 per collection

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Best-selling products dominate every collection indefinitely | Add a recency weight and a "new product boost" for items added in the last 14 days; this gives new products a chance to get exposure |
| Merchandising rule conflicts with another rule | In Shopify Search & Discovery and Kimonix, rules have priority order — define which rules override others and document the priority scheme |
| Smart collection adds products that shouldn't be there | Review your collection conditions carefully; using "any condition" instead of "all conditions" is the most common cause of unintended inclusions |
| Performance scores skewed by a single viral day | Use a rolling 30-day window for sales metrics, not all-time totals; cap extreme outliers at the 95th percentile |

## Related Skills

- @multi-channel-selling
- @demand-forecasting
