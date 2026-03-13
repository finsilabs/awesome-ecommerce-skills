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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Profit Margin Analysis

## Overview

Profit margin analysis is the practice of understanding exactly where your business makes and loses money — broken down by the dimensions that matter most to ecommerce operators: individual products, product categories, sales channels, customer segments, and time periods.

Most ecommerce businesses can easily report top-line revenue, but far fewer have a clear picture of which SKUs, channels, or customer segments actually drive profitability. A product that accounts for 40% of revenue might contribute only 10% of gross profit — or actually lose money once all costs are attributed.

This skill covers the full spectrum from gross margin (revenue minus direct product costs) through contribution margin (after variable marketing and fulfillment costs) to net margin (after all allocated overhead). It includes cost attribution methodologies, benchmarking against industry standards, and visualization patterns that make margin findings actionable.

---

## When to Use

- You need to identify which products, categories, or SKUs are most and least profitable
- You want to compare margin performance across sales channels (website vs. Amazon vs. wholesale)
- You are making pricing decisions and need to understand the impact on margin
- You are rationalizing your product catalog and need to eliminate low-margin SKUs
- You want to understand how marketing spend affects channel-level profitability
- You are benchmarking your margins against industry peers or investor expectations
- You are building a product mix strategy to improve overall company profitability

---

## Core Instructions

### Step 1 — Define Your Margin Hierarchy

Establish a consistent margin waterfall before building any queries:

```
Gross Revenue (Selling Price × Units Sold)
  - Discounts & Coupons Applied
  - Returns & Refunds
= Net Revenue

  - Product Cost (COGS — purchase price or manufacturing cost)
  - Inbound Freight & Duties
= Gross Profit
  Gross Margin % = Gross Profit / Net Revenue × 100

  - Outbound Shipping (if not passed to customer)
  - Payment Processing Fees (~2-3% of revenue)
  - Platform/Marketplace Fees
  - Packaging Materials
= Fulfillment-Adjusted Gross Profit
  Fulfillment-Adjusted Margin % = Fulfillment-Adjusted Gross Profit / Net Revenue × 100

  - Direct Marketing Spend (attributable to this channel/SKU)
= Contribution Margin
  Contribution Margin % = Contribution Margin / Net Revenue × 100

  - Allocated Overhead (warehouse fixed costs, G&A allocation)
= Net Operating Profit
  Net Margin % = Net Operating Profit / Net Revenue × 100
```

### Step 2 — Build the Margin Data Model

```sql
-- SKU-level profitability fact table
CREATE TABLE sku_profitability (
    period_id           VARCHAR(7) NOT NULL,  -- '2026-03'
    sku                 VARCHAR(50) NOT NULL,
    product_name        VARCHAR(200),
    category            VARCHAR(50),
    channel             VARCHAR(50),
    units_sold          INTEGER NOT NULL DEFAULT 0,
    gross_revenue       NUMERIC(14,2) NOT NULL DEFAULT 0,
    discounts           NUMERIC(14,2) NOT NULL DEFAULT 0,
    returns             NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_revenue         NUMERIC(14,2) GENERATED ALWAYS AS (gross_revenue - discounts - returns) STORED,
    product_cost        NUMERIC(14,2) NOT NULL DEFAULT 0,
    inbound_freight     NUMERIC(14,2) NOT NULL DEFAULT 0,
    cogs_total          NUMERIC(14,2) GENERATED ALWAYS AS (product_cost + inbound_freight) STORED,
    gross_profit        NUMERIC(14,2) GENERATED ALWAYS AS (gross_revenue - discounts - returns - product_cost - inbound_freight) STORED,
    outbound_shipping   NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_fees        NUMERIC(14,2) NOT NULL DEFAULT 0,
    marketplace_fees    NUMERIC(14,2) NOT NULL DEFAULT 0,
    packaging_cost      NUMERIC(14,2) NOT NULL DEFAULT 0,
    direct_marketing    NUMERIC(14,2) NOT NULL DEFAULT 0,
    overhead_allocation NUMERIC(14,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (period_id, sku, channel)
);

-- Add computed margin percentages as a view
CREATE VIEW sku_margin_analysis AS
SELECT
    period_id,
    sku,
    product_name,
    category,
    channel,
    units_sold,
    net_revenue,
    cogs_total,
    gross_profit,
    ROUND(gross_profit / NULLIF(net_revenue, 0) * 100, 2) AS gross_margin_pct,
    gross_profit - outbound_shipping - payment_fees - marketplace_fees - packaging_cost AS fulfillment_adj_profit,
    ROUND((gross_profit - outbound_shipping - payment_fees - marketplace_fees - packaging_cost) / NULLIF(net_revenue, 0) * 100, 2) AS fulfillment_adj_margin_pct,
    gross_profit - outbound_shipping - payment_fees - marketplace_fees - packaging_cost - direct_marketing AS contribution_margin,
    ROUND((gross_profit - outbound_shipping - payment_fees - marketplace_fees - packaging_cost - direct_marketing) / NULLIF(net_revenue, 0) * 100, 2) AS contribution_margin_pct,
    gross_profit - outbound_shipping - payment_fees - marketplace_fees - packaging_cost - direct_marketing - overhead_allocation AS net_operating_profit,
    ROUND((gross_profit - outbound_shipping - payment_fees - marketplace_fees - packaging_cost - direct_marketing - overhead_allocation) / NULLIF(net_revenue, 0) * 100, 2) AS net_margin_pct
FROM sku_profitability;
```

### Step 3 — Attribute Costs to Products Accurately

The hardest part of margin analysis is accurate cost attribution, especially for shared costs.

**Product cost (COGS):**
- Use weighted average cost or FIFO — document and apply consistently
- Include all costs to get the product to your warehouse: purchase price, freight, duties, inspection fees, prep costs

```sql
-- Weighted average cost calculation
WITH cost_layers AS (
    SELECT
        sku,
        SUM(quantity_received * unit_cost) AS total_cost,
        SUM(quantity_received) AS total_units
    FROM purchase_order_receipts
    WHERE receipt_date <= :as_of_date
    GROUP BY sku
)
SELECT
    sku,
    total_cost / NULLIF(total_units, 0) AS weighted_avg_cost
FROM cost_layers;
```

**Shipping cost attribution:**
For outbound shipping, use the actual carrier cost per shipment. If not tracked at SKU level, use dimensional weight and zone-based estimates.

```python
def estimate_shipping_cost(
    weight_oz: float,
    length_in: float,
    width_in: float,
    height_in: float,
    destination_zone: int,
    carrier_rate_table: dict,
) -> float:
    """Estimate shipping cost using dimensional weight."""
    actual_weight_lbs = weight_oz / 16
    dim_weight_lbs = (length_in * width_in * height_in) / 139  # UPS/FedEx divisor
    billable_weight = max(actual_weight_lbs, dim_weight_lbs)
    rate_key = (round(billable_weight + 0.5), destination_zone)
    return carrier_rate_table.get(rate_key, 0.0)
```

**Payment processing fees:**
Apply a blended rate (e.g., 2.9% + $0.30 for Stripe) or, if you have transaction-level data, use actual fees.

**Marketplace fees:**
Amazon referral fees vary by category (6-45%). Pull fee data from the Settlement Report.

```sql
-- Compute marketplace fees from Amazon settlement data
SELECT
    sku,
    SUM(ABS(amount)) AS total_fees,
    SUM(ABS(CASE WHEN fee_type = 'FBAPerUnitFulfillmentFee' THEN amount ELSE 0 END)) AS fba_fees,
    SUM(ABS(CASE WHEN fee_type = 'Commission' THEN amount ELSE 0 END)) AS referral_fees,
    SUM(ABS(CASE WHEN fee_type = 'VariableClosingFee' THEN amount ELSE 0 END)) AS variable_closing_fees
FROM amazon_settlement_items
WHERE settlement_period = :period
  AND amount < 0  -- fees are negative in Amazon settlements
GROUP BY sku;
```

### Step 4 — Margin Analysis by Dimension

**By product and SKU:**
```sql
SELECT
    sku,
    product_name,
    SUM(units_sold) AS total_units,
    SUM(net_revenue) AS total_revenue,
    SUM(gross_profit) AS total_gross_profit,
    ROUND(SUM(gross_profit) / NULLIF(SUM(net_revenue), 0) * 100, 1) AS gross_margin_pct,
    ROUND(SUM(contribution_margin) / NULLIF(SUM(net_revenue), 0) * 100, 1) AS contribution_margin_pct
FROM sku_margin_analysis
WHERE period_id = :period
GROUP BY sku, product_name
ORDER BY SUM(gross_profit) DESC;
```

**By channel:**
```sql
SELECT
    channel,
    SUM(net_revenue) AS revenue,
    SUM(gross_profit) AS gross_profit,
    ROUND(SUM(gross_profit) / NULLIF(SUM(net_revenue), 0) * 100, 1) AS gross_margin_pct,
    SUM(direct_marketing) AS marketing_spend,
    SUM(contribution_margin) AS contribution_profit,
    ROUND(SUM(contribution_margin) / NULLIF(SUM(net_revenue), 0) * 100, 1) AS contribution_margin_pct
FROM sku_margin_analysis
WHERE period_id = :period
GROUP BY channel
ORDER BY SUM(contribution_margin) DESC;
```

**Trend analysis (12-month rolling):**
```sql
SELECT
    period_id,
    category,
    SUM(net_revenue) AS revenue,
    ROUND(SUM(gross_profit) / NULLIF(SUM(net_revenue), 0) * 100, 1) AS gross_margin_pct,
    ROUND(SUM(contribution_margin) / NULLIF(SUM(net_revenue), 0) * 100, 1) AS contribution_margin_pct,
    LAG(ROUND(SUM(gross_profit) / NULLIF(SUM(net_revenue), 0) * 100, 1), 1)
        OVER (PARTITION BY category ORDER BY period_id) AS prior_month_gm_pct,
    LAG(ROUND(SUM(gross_profit) / NULLIF(SUM(net_revenue), 0) * 100, 1), 12)
        OVER (PARTITION BY category ORDER BY period_id) AS prior_year_gm_pct
FROM sku_margin_analysis
WHERE period_id >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM')
GROUP BY period_id, category
ORDER BY category, period_id;
```

### Step 5 — Margin Benchmarks for Ecommerce

Use these benchmarks to contextualize your analysis:

| Business Type | Gross Margin | Contribution Margin | Net Margin |
|---|---|---|---|
| Branded DTC (consumables) | 55-75% | 30-50% | 5-20% |
| Branded DTC (apparel) | 55-70% | 25-45% | 3-15% |
| Electronics reseller | 10-25% | 5-15% | 1-5% |
| Amazon FBA reseller | 15-35% | 5-20% | 2-8% |
| Subscription box | 40-60% | 20-40% | 5-15% |
| Wholesale / B2B | 20-40% | 15-30% | 3-12% |

### Step 6 — Margin Improvement Analysis

Once you have margin data, prioritize improvement opportunities:

```python
def rank_margin_improvement_opportunities(
    sku_margins: list[dict],
    min_revenue_threshold: float = 10000.0,
) -> list[dict]:
    """
    Identify SKUs with below-average margins and significant revenue impact.
    Returns ranked list of improvement opportunities.
    """
    avg_contribution_margin = sum(s['contribution_margin_pct'] for s in sku_margins) / len(sku_margins)

    opportunities = []
    for sku in sku_margins:
        if sku['net_revenue'] < min_revenue_threshold:
            continue

        margin_gap = avg_contribution_margin - sku['contribution_margin_pct']
        if margin_gap <= 0:
            continue

        # Revenue impact if this SKU reached average margin
        potential_gain = sku['net_revenue'] * (margin_gap / 100)

        opportunities.append({
            'sku': sku['sku'],
            'product_name': sku['product_name'],
            'current_margin_pct': sku['contribution_margin_pct'],
            'target_margin_pct': avg_contribution_margin,
            'margin_gap_pct': round(margin_gap, 1),
            'annual_revenue': sku['net_revenue'],
            'potential_profit_gain': round(potential_gain, 2),
            'priority': 'high' if potential_gain > 50000 else 'medium' if potential_gain > 10000 else 'low',
        })

    return sorted(opportunities, key=lambda x: x['potential_profit_gain'], reverse=True)
```

---

## Best Practices

1. **Start with contribution margin, not gross margin** — Gross margin ignores fulfillment and marketing costs that are often the biggest swing factors in ecommerce profitability. Contribution margin per unit is the number that actually matters for unit economics decisions.

2. **Reconcile your cost data monthly** — Product costs change due to supplier price increases, currency fluctuations, and freight market changes. Update your cost layer at least monthly to avoid stale margin calculations.

3. **Use a 13-month rolling trend view** — Looking at margin over 13 months (current month plus 12 prior months) lets you see seasonality and year-over-year changes simultaneously on a single chart.

4. **Segment products into profitability tiers** — Classify your catalog into tiers (stars: high margin + high volume; workhorses: low margin + high volume; niche: high margin + low volume; dogs: low margin + low volume) and apply different strategies to each tier.

5. **Include a "blended" channel view** — Many customers touch multiple channels before buying. Avoid making channel decisions purely on single-touch margin; complement with multi-touch attribution data.

6. **Track margin per order, not just per unit** — A product with high unit margin may have low order-level margin if it is frequently ordered alone with flat-rate free shipping. Analyze margin per order as well as per unit.

7. **Build margin sensitivity models** — Show how margin changes with a 10% price increase, a 5% COGS reduction, or a $2 shipping cost change. This makes the analysis directly actionable for pricing and procurement decisions.

8. **Flag negative-margin SKUs immediately** — Set automated alerts for any SKU with a negative contribution margin over a rolling 30-day window. These SKUs are destroying value every time they sell.

9. **Normalize for seasonality** — High-margin Q4 holiday products will look artificially bad in Q2 when demand is low and advertising CPCs are amortized over fewer sales. Use trailing-12-month averages for catalog rationalization decisions.

10. **Document cost attribution assumptions** — Every cost allocation involves judgment calls. Document your assumptions (e.g., "outbound shipping allocated based on dimensional weight") so the analysis is reproducible and auditable.

---

## Common Pitfalls

### Pitfall 1: Using Selling Price Instead of Net Revenue
Applying discounts and return rates only in the P&L but leaving them out of the unit-level margin calculation makes individual products look more profitable than they are. Always compute net revenue (after discounts and return reserves) at the product level.

### Pitfall 2: Ignoring Return Rates by Product
A product with a 30% gross margin but a 25% return rate effectively has a much lower realized margin. Build return rate directly into your margin model so high-return SKUs surface in your analysis.

### Pitfall 3: Not Attributing Variable Marketing to Products
If you run SKU-level or category-level ad campaigns, that marketing spend is a direct cost of generating those sales — not an overhead. Exclude it from overhead and attribute it to the relevant SKUs to get accurate contribution margins.

### Pitfall 4: Using Purchase Price as COGS Without Including Landed Cost
Purchase price from the invoice does not capture duties, freight, drayage, or prep costs. Landed cost can be 15-40% higher than purchase price for imported goods. Use landed cost as your COGS basis.

### Pitfall 5: Comparing Margins Across Channels Without Adjusting for Channel Costs
Amazon FBA gross margins look lower than DTC margins, but this comparison is misleading unless you subtract fulfillment costs from DTC as well. Normalize to contribution margin for fair channel comparisons.

### Pitfall 6: Analyzing Margin Without Volume Context
A 60% gross margin product generating $500 per month is less important to optimize than a 35% gross margin product generating $500,000 per month. Always show margin percentage alongside absolute profit contribution to prioritize correctly.
