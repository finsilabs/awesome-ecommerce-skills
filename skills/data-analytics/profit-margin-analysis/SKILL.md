---
name: profit-margin-analysis
description: "Analyze gross and net profit margins by product, category, channel, and customer segment with cost attribution, benchmarking, and trend visualization"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [profit-margin, profitability, cost-analysis]
triggers: ["analyze profit margins", "gross margin by product", "profitability by channel", "margin analysis", "cost attribution", "margin benchmarking", "contribution margin"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Profit Margin Analysis

## Overview

Profit margin analysis identifies exactly where your business makes and loses money — broken down by products, categories, channels, and customer segments. A product that accounts for 40% of revenue might contribute only 10% of gross profit — or actually lose money once fulfillment, marketing, and overhead are factored in.

This skill guides you through building a clear margin hierarchy using your existing platform tools and profit analytics apps, without requiring a data warehouse.

## When to Use This Skill

- When needing to identify which products, categories, or SKUs are most and least profitable
- When comparing margin performance across sales channels (website vs. Amazon vs. wholesale)
- When making pricing decisions and needing to understand the impact on margin
- When rationalizing the product catalog to eliminate low-margin SKUs
- When understanding how marketing spend affects channel-level profitability
- When benchmarking margins against industry peers or investor expectations

## Core Instructions

### Step 1: Establish your margin hierarchy

Before pulling any data, define the margin levels you will track. Use this waterfall consistently across all analyses:

```
Gross Revenue (selling price × units sold)
  - Discounts & coupons applied
  - Returns & refunds
= Net Revenue

  - Product COGS (landed cost: purchase price + freight + duties)
= Gross Profit
  Gross Margin % = Gross Profit / Net Revenue × 100

  - Outbound shipping (actual label cost or estimate)
  - Payment processing fees (~2.9% + $0.30 for Stripe/Shopify Payments)
  - Marketplace fees (Amazon referral + FBA fees; eBay final value fees)
  - Packaging materials
= Fulfillment-Adjusted Gross Profit
  Fulfillment-Adjusted Margin %

  - Direct marketing spend (attributed to this channel/product)
= Contribution Margin
  Contribution Margin % = Contribution Margin / Net Revenue × 100

  - Allocated overhead (warehouse, software, headcount allocation)
= Net Operating Profit
  Net Margin %
```

**Why contribution margin matters most for ecommerce decisions:** Gross margin ignores fulfillment and marketing costs that are often the biggest swing factors. Contribution margin per unit is the number that actually governs whether it makes sense to sell more of a product or scale a channel.

### Step 2: Enter cost data into your platform

Accurate margin analysis starts with accurate cost data. Enter landed cost (not just purchase price) for every product.

---

#### Shopify

1. Go to **Products → [Product] → Variants**
2. For each variant, enter the **Cost per item** — this should be your fully landed cost:
   - Supplier invoice price per unit
   - + Inbound freight per unit (divide total freight by total units in the shipment)
   - + Customs duties per unit
   - + Inspection/prep fees per unit (if applicable)
3. Once costs are entered, go to **Analytics → Reports → Profit by product** — Shopify calculates gross profit per product automatically
4. Go to **Analytics → Reports → Profit by channel** — see gross margin by sales channel

**Limitations of Shopify's built-in profit reports:**
- Shows gross profit only (revenue minus COGS)
- Does not include fulfillment costs, payment fees, or marketing spend
- For full contribution margin analysis, use a profit analytics app

**Recommended Shopify apps for complete margin analysis:**
- **BeProfit:** Adds shipping cost tracking (connects to ShipStation, EasyPost), ad spend integration (Meta, Google, TikTok), and per-order contribution margin
- **Lifetimely:** Focuses on CLV and cohort profitability alongside contribution margin by channel
- **TrueProfit:** Real-time profit dashboard with all cost layers; connects to 20+ ad platforms and shipping carriers

**BeProfit setup for contribution margin:**
1. Install BeProfit from the Shopify App Store
2. Go to **BeProfit → Settings → Costs** — verify product costs are imported from Shopify
3. Go to **BeProfit → Integrations → Shipping** — connect ShipStation or Shippo to pull actual label costs per order
4. Go to **BeProfit → Integrations → Marketing** — connect Meta, Google, TikTok for ad spend allocation
5. Go to **BeProfit → Reports → Products** — view gross margin, fulfillment-adjusted margin, and contribution margin per product

---

#### WooCommerce

1. Install the **Cost of Goods** plugin (WooCommerce extension, $79/yr) to add a cost field to each product
2. Enter landed cost per product/variant (same methodology as Shopify above)
3. **Metorik** pulls this cost data and shows gross profit per product at **Metorik → Products → Profitability**
4. For fulfillment cost tracking: export ShipStation or Shippo costs monthly as CSV; match to WooCommerce orders by order ID in Google Sheets or with Metorik's CSV import

---

#### BigCommerce

1. Go to **Products → [Product] → Pricing → Cost price** — enter landed cost per product
2. Go to **Analytics → Merchandising → Products** — view gross margin % per product with cost entered
3. Install **Glew.io** (App Marketplace) for contribution margin analysis that includes ad spend and fulfillment costs

---

### Step 3: Run margin analysis by dimension

**By product and SKU:**

In your platform analytics or profit app, sort products by contribution margin % ascending to find your least profitable SKUs:

- **Shopify:** BeProfit → Reports → Products → sort by Net Profit % ascending
- **WooCommerce:** Metorik → Products → sort by Gross Profit ascending
- **BigCommerce:** Glew.io → Products → sort by Margin % ascending

**By channel:**

Compare the same product sold on different channels:

| Metric | Your Website | Amazon FBA | Wholesale |
|--------|-------------|-----------|---------|
| Gross Revenue per unit | $39.99 | $39.99 | $20.00 (your price to retailer) |
| Payment/marketplace fees | 3.2% | 15% referral + $4.50 FBA | 0% (invoice-based) |
| Outbound shipping | $5.00 | Included in FBA fee | Bulk freight (lower per unit) |
| Gross Margin % | 62% | 38% | 35% |
| Contribution Margin % | 48% | 25% | 28% |

This shows that despite Amazon's lower margin %, the channel may still be valuable for volume and brand visibility — but you need the numbers to decide.

**By category:**

Group your products into categories and compare average contribution margin % across them:
- Which categories contribute the most gross profit in absolute dollars?
- Which categories have the highest margin % (most efficient products)?
- Which categories have high revenue but low margin (volume products that may be diluting overall profitability)?

### Step 4: Use industry benchmarks to contextualize your analysis

| Business Type | Gross Margin | Contribution Margin | Net Margin |
|---------------|-------------|--------------------|-----------|
| Branded DTC (consumables) | 55–75% | 30–50% | 5–20% |
| Branded DTC (apparel) | 55–70% | 25–45% | 3–15% |
| Electronics reseller | 10–25% | 5–15% | 1–5% |
| Amazon FBA reseller | 15–35% | 5–20% | 2–8% |
| Subscription box | 40–60% | 20–40% | 5–15% |
| Wholesale / B2B | 20–40% | 15–30% | 3–12% |

If your gross margin is significantly below these ranges, investigate:
1. Are COGS entered correctly (including all landed cost components)?
2. Are you selling with excessive discounts?
3. Is your product pricing too low for your cost structure?

### Step 5: Identify and act on margin improvement opportunities

Once you have margin data by SKU, prioritize improvements:

**SKU profitability tiering:**
- **Stars:** High margin + high volume → protect and grow; prioritize in ad spend and inventory
- **Workhorses:** Lower margin + high volume → margin improvement projects (negotiate supplier cost, reduce returns, optimize shipping)
- **Niche:** High margin + low volume → grow with targeted marketing; can sustain higher CAC
- **Dogs:** Low margin + low volume → candidates for discontinuation or price increase

**Quick wins for margin improvement:**
1. **Raise prices on low-margin, low-elasticity SKUs** — test a 10–15% price increase on products where demand is not highly price-sensitive
2. **Reduce free shipping threshold** — move from free shipping on all orders to free shipping above $75 or $100; saves 3–6% of revenue on small orders
3. **Negotiate COGS with suppliers** — a 5% COGS reduction improves gross margin by 5 percentage points on any product with 50%+ margins
4. **Address high-return SKUs** — a product with 20% return rate has ~20% of its revenue consumed by reverse logistics; improve descriptions, sizing guides, or photos

## Best Practices

- **Start with contribution margin, not gross margin** — gross margin ignores fulfillment and marketing costs that are often the biggest swing factors in ecommerce profitability
- **Reconcile cost data monthly** — COGS changes due to supplier price changes, freight market fluctuations, and currency movements; update costs at least monthly
- **Use a 13-month rolling trend view** — looking at margin over 13 months shows seasonality and year-over-year changes simultaneously
- **Track margin per order, not just per unit** — a product with high unit margin may have low order-level margin if it is frequently ordered alone with flat-rate free shipping
- **Build margin sensitivity models** — show how margin changes with a 10% price increase, a 5% COGS reduction, or a $2 shipping cost change to make analysis directly actionable
- **Flag negative-margin SKUs immediately** — any product with negative contribution margin should be investigated within the week it is identified; every sale destroys value

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Using purchase price instead of landed cost as COGS | Purchase price alone understates COGS by 15–40% for imported goods; always include freight, duties, and prep costs in the cost per item field |
| Not attributing variable marketing to products | If you run SKU-level ad campaigns, that marketing spend is a direct cost of those sales; exclude it from overhead and attribute it to the relevant SKUs |
| Comparing Amazon vs. website margins without normalizing fulfillment | Amazon FBA gross margins look lower than DTC margins because FBA fees are large; normalize to contribution margin (net of fulfillment) for fair comparisons |
| Analyzing margin without volume context | A 60% gross margin product doing $500/month is less important than a 35% margin product doing $500,000/month; always show margin % alongside absolute profit contribution |
| Historical margin changes when COGS is updated | Use point-in-time cost records in your profit analytics app; BeProfit and Lifetimely track cost history so historical margins are not retroactively recalculated |

## Related Skills

- @cost-allocation-analysis
- @unit-economics-tracking
- @financial-analytics-dashboard
- @marketing-spend-analysis
- @sales-reporting-dashboard
