---
name: unit-economics-tracking
description: "Track customer acquisition cost, lifetime value, payback period, and contribution margin by cohort and channel with profitability benchmarks and trend analysis"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [unit-economics, cac, ltv, payback-period]
triggers: ["track unit economics", "customer acquisition cost", "lifetime value", "LTV CAC ratio", "payback period", "cohort profitability", "contribution margin per customer"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Unit Economics Tracking

## Overview

Unit economics describes the financial dynamics of a single unit of your business — in ecommerce, that unit is typically a customer. The key metrics are Customer Acquisition Cost (CAC), Customer Lifetime Value (LTV or CLV), the LTV:CAC ratio, and the payback period. Together, these four metrics tell you whether your business model is economically viable: are you acquiring customers profitably, how much value do they generate over time, and how quickly does that value exceed what you spent to acquire them?

These metrics are among the most scrutinized by investors, boards, and operators because they reveal the underlying health of the business independent of short-term revenue trends. A business with excellent unit economics can scale confidently by investing more in customer acquisition. A business with poor unit economics will destroy more value the faster it grows.

This skill covers the precise definitions and calculation methodologies for each metric, cohort-based analysis that tracks how unit economics evolve over time, channel-level segmentation, benchmark targets, and the data infrastructure to track these metrics continuously.

---

## When to Use

- You are preparing investor materials and need to present unit economics metrics
- You want to understand whether it is profitable to increase marketing spend in a given channel
- You are analyzing why CAC has increased over the past 6 months
- You need to compare the quality of customers acquired through different channels
- You are building a financial model and need to validate LTV assumptions
- You want to set budget guardrails: maximum allowable CAC by channel
- You are evaluating a new acquisition channel and need to project payback period

---

## Core Instructions

### Step 1 — Define Customer Acquisition Cost (CAC)

CAC is the total sales and marketing spend required to acquire one new customer. There are two common definitions:

**Blended CAC:** Total marketing + sales spend / Total new customers acquired
**Paid CAC:** Total paid marketing spend only / New customers from paid channels only

```sql
-- Blended CAC by month
WITH new_customers AS (
    SELECT
        DATE_TRUNC('month', first_order_date) AS acquisition_month,
        acquisition_channel,
        COUNT(DISTINCT customer_id) AS new_customer_count
    FROM (
        SELECT
            customer_id,
            MIN(order_date) AS first_order_date,
            FIRST_VALUE(utm_source) OVER (PARTITION BY customer_id ORDER BY order_date) AS acquisition_channel
        FROM orders
        GROUP BY customer_id
    ) first_orders
    GROUP BY 1, 2
),
marketing_spend AS (
    SELECT
        DATE_TRUNC('month', spend_date) AS spend_month,
        channel,
        SUM(spend_amount) AS total_spend
    FROM marketing_spend_daily
    GROUP BY 1, 2
)
SELECT
    nc.acquisition_month,
    nc.acquisition_channel,
    nc.new_customer_count,
    ms.total_spend,
    ROUND(ms.total_spend / NULLIF(nc.new_customer_count, 0), 2) AS cac
FROM new_customers nc
LEFT JOIN marketing_spend ms
    ON nc.acquisition_month = ms.spend_month
    AND nc.acquisition_channel = ms.channel
ORDER BY nc.acquisition_month DESC, nc.acquisition_channel;
```

**Fully-loaded CAC** includes not just media spend but also agency fees, technology costs, salaries for the marketing and sales team, and the cost of free trials or first-order discounts.

```python
def compute_fully_loaded_cac(
    period: str,
    media_spend: float,
    agency_fees: float,
    marketing_tech_costs: float,  # email platform, analytics tools
    marketing_payroll_allocated: float,
    first_order_discount_cost: float,
    new_customers_acquired: int,
) -> dict:
    total_cost = (
        media_spend
        + agency_fees
        + marketing_tech_costs
        + marketing_payroll_allocated
        + first_order_discount_cost
    )
    return {
        'period': period,
        'total_acquisition_cost': round(total_cost, 2),
        'new_customers': new_customers_acquired,
        'blended_cac': round(total_cost / max(new_customers_acquired, 1), 2),
        'media_only_cac': round(media_spend / max(new_customers_acquired, 1), 2),
    }
```

### Step 2 — Define and Calculate Customer Lifetime Value (LTV)

LTV is the total net revenue (or contribution margin) you expect to receive from a customer over their entire relationship with your business.

**Historical LTV (observed):** Actual cumulative net revenue from a defined cohort.

**Predicted LTV:** Modeled using purchase frequency, average order value, gross margin, and churn rate.

```python
from decimal import Decimal

def predict_ltv(
    avg_order_value: float,
    purchase_frequency_per_year: float,
    gross_margin_rate: float,
    annual_churn_rate: float,
    discount_rate: float = 0.10,  # cost of capital
    forecast_years: int = 5,
) -> dict:
    """
    Predict LTV using a discounted cash flow approach.
    LTV = Sum(t=1 to T) [Margin_t / (1+d)^t]
    where Margin_t = AOV * frequency * gross_margin * (1-churn)^t
    """
    annual_margin = avg_order_value * purchase_frequency_per_year * gross_margin_rate
    total_ltv = 0
    yearly_breakdown = []

    for year in range(1, forecast_years + 1):
        survival_rate = (1 - annual_churn_rate) ** (year - 1)
        expected_margin = annual_margin * survival_rate
        discounted_margin = expected_margin / ((1 + discount_rate) ** year)
        total_ltv += discounted_margin
        yearly_breakdown.append({
            'year': year,
            'survival_rate': round(survival_rate, 3),
            'expected_margin': round(expected_margin, 2),
            'discounted_margin': round(discounted_margin, 2),
            'cumulative_ltv': round(total_ltv, 2),
        })

    return {
        'predicted_ltv': round(total_ltv, 2),
        'annual_margin_year1': round(annual_margin, 2),
        'yearly_breakdown': yearly_breakdown,
    }

# Simple steady-state LTV formula
def ltv_steady_state(avg_order_value, purchases_per_year, gross_margin, churn_rate):
    """LTV = (AOV × Purchases/Year × Gross Margin) / Churn Rate"""
    if churn_rate == 0:
        return float('inf')
    return (avg_order_value * purchases_per_year * gross_margin) / churn_rate
```

### Step 3 — Cohort-Based LTV Analysis

Cohort analysis tracks customers acquired in the same period together, measuring how their cumulative LTV grows over time. This is the gold-standard approach for understanding true LTV.

```sql
-- Cohort LTV analysis (monthly cohorts)
WITH customer_cohorts AS (
    SELECT
        customer_id,
        DATE_TRUNC('month', MIN(order_date)) AS cohort_month
    FROM orders
    GROUP BY customer_id
),
cohort_orders AS (
    SELECT
        cc.customer_id,
        cc.cohort_month,
        DATE_TRUNC('month', o.order_date) AS order_month,
        EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', o.order_date), cc.cohort_month)) AS months_since_acquisition,
        o.net_revenue,
        o.gross_profit
    FROM customer_cohorts cc
    JOIN orders o USING (customer_id)
)
SELECT
    cohort_month,
    months_since_acquisition,
    COUNT(DISTINCT customer_id) AS active_customers,
    SUM(net_revenue) AS cohort_revenue,
    SUM(gross_profit) AS cohort_gross_profit,
    SUM(SUM(net_revenue)) OVER (
        PARTITION BY cohort_month
        ORDER BY months_since_acquisition
        ROWS UNBOUNDED PRECEDING
    ) AS cumulative_revenue,
    SUM(SUM(gross_profit)) OVER (
        PARTITION BY cohort_month
        ORDER BY months_since_acquisition
        ROWS UNBOUNDED PRECEDING
    ) AS cumulative_gross_profit,
    -- Normalize by cohort size
    SUM(SUM(gross_profit)) OVER (
        PARTITION BY cohort_month
        ORDER BY months_since_acquisition
        ROWS UNBOUNDED PRECEDING
    ) / COUNT(DISTINCT customer_id) AS ltv_per_customer_at_month
FROM cohort_orders
GROUP BY cohort_month, months_since_acquisition
ORDER BY cohort_month, months_since_acquisition;
```

### Step 4 — Payback Period Calculation

The payback period is how many months it takes to recover your CAC from a customer's contribution margin. A 12-month payback or less is typically considered healthy for capital-efficient ecommerce.

```python
def compute_payback_period(
    cac: float,
    monthly_revenue_per_customer: float,  # avg monthly revenue from retained customers
    contribution_margin_rate: float,       # net of variable costs
    max_months: int = 60,
) -> dict:
    """
    Compute the number of months until cumulative contribution margin equals CAC.
    Uses a simple constant-payment model; replace with cohort curve for precision.
    """
    monthly_contribution = monthly_revenue_per_customer * contribution_margin_rate
    if monthly_contribution <= 0:
        return {'payback_months': None, 'error': 'Non-positive monthly contribution'}

    # Simple (non-discounted) payback
    payback_months = cac / monthly_contribution

    # Build month-by-month recovery schedule
    schedule = []
    cumulative = 0
    for month in range(1, max_months + 1):
        cumulative += monthly_contribution
        net_position = cumulative - cac
        schedule.append({
            'month': month,
            'cumulative_margin': round(cumulative, 2),
            'net_position': round(net_position, 2),
            'recovered': net_position >= 0,
        })
        if net_position >= 0:
            break

    return {
        'cac': cac,
        'monthly_contribution': round(monthly_contribution, 2),
        'payback_months': round(payback_months, 1),
        'recovery_schedule': schedule,
    }
```

### Step 5 — LTV:CAC Ratio and Benchmarks

```python
def compute_ltv_cac_metrics(cac: float, ltv: float) -> dict:
    ltv_cac_ratio = ltv / max(cac, 0.01)
    return {
        'cac': cac,
        'ltv': ltv,
        'ltv_cac_ratio': round(ltv_cac_ratio, 2),
        'assessment': (
            'excellent' if ltv_cac_ratio >= 5 else
            'healthy' if ltv_cac_ratio >= 3 else
            'marginal' if ltv_cac_ratio >= 2 else
            'unprofitable'
        ),
        'benchmark': {
            'minimum_viable': 2.0,
            'healthy_dtc': 3.0,
            'excellent_dtc': 5.0,
        }
    }
```

**Industry benchmarks:**
| Metric | Minimum Viable | Healthy | Excellent |
|---|---|---|---|
| LTV:CAC | 2:1 | 3:1 | 5:1+ |
| CAC Payback | <24 months | <12 months | <6 months |
| Month-12 Retention | >20% | >40% | >60% |
| Average Order Frequency (annual) | 1.5x | 2.5x | 4x+ |

### Step 6 — Channel-Level Unit Economics

```sql
-- Unit economics by acquisition channel
SELECT
    first_channel AS acquisition_channel,
    COUNT(DISTINCT customer_id) AS cohort_size,
    AVG(cac_at_acquisition) AS avg_cac,
    AVG(CASE WHEN months_since_acquisition >= 12 THEN cumulative_contribution_margin END) AS avg_ltv_12m,
    AVG(CASE WHEN months_since_acquisition >= 12 THEN cumulative_contribution_margin END)
        / NULLIF(AVG(cac_at_acquisition), 0) AS ltv_cac_12m,
    AVG(payback_months) AS avg_payback_months,
    AVG(CASE WHEN months_since_acquisition >= 6 THEN active_flag END) AS retention_rate_6m,
    AVG(CASE WHEN months_since_acquisition >= 12 THEN active_flag END) AS retention_rate_12m
FROM customer_unit_economics
GROUP BY first_channel
ORDER BY ltv_cac_12m DESC;
```

---

## Best Practices

1. **Use contribution margin LTV, not gross revenue LTV** — LTV calculated on gross revenue overstates the actual value. Use contribution margin (after COGS, fulfillment, and variable marketing) to get a realistic picture of economic value per customer.

2. **Segment LTV by acquisition channel from day one** — Customers from organic search, paid social, and influencer partnerships often have dramatically different LTVs. Pooling them into a blended LTV obscures the channel economics that drive budget decisions.

3. **Always pair LTV with a confidence interval** — LTV is a prediction. Show the range of outcomes (e.g., "LTV at month 24 is $85 ± $25 with 80% confidence") to communicate the uncertainty inherent in the forecast.

4. **Track LTV curves, not just point estimates** — Plot cumulative gross profit per customer over 24 months for each cohort. Comparing LTV curves across cohorts reveals whether recent cohorts are better or worse than historical averages.

5. **Set maximum CAC guardrails for each channel** — Derive a maximum allowable CAC: Max CAC = LTV / Target LTV:CAC ratio. Hard-code this as a budget guardrail so marketing teams cannot overpay for customers without executive approval.

6. **Track month-over-month CAC trend** — Rising CAC is often the first warning sign of channel saturation or increased competition. Monitor it weekly and investigate any 15%+ increase immediately.

7. **Distinguish new customer LTV from total customer LTV** — Customers reacquired after a lapse period should be treated differently. A customer who churned and returned with a discount has a different economic profile than a consistently retained customer.

8. **Model LTV separately for subscription vs. transactional customers** — Subscription customers have predictable, contracted revenue. Transactional customers have highly variable purchase frequency. These require different LTV models.

9. **Validate LTV predictions against cohort actuals** — Every 6 months, compare your LTV predictions against the actual cumulative gross profit of cohorts that are now old enough to be measured. Recalibrate your model based on prediction errors.

10. **Present unit economics in the context of growth stage** — A high-growth company may have a 24-month payback period but be perfectly healthy because of strong retention at month 24+. Context matters: present LTV curves alongside payback calculations.

---

## Common Pitfalls

### Pitfall 1: Calculating CAC Using Only Media Spend
True CAC includes agency fees, marketing technology, marketing team salaries, and the cost of promotional discounts on first orders. Using only media spend understates CAC by 20-50% depending on your team size.

### Pitfall 2: Using ARPU Instead of Contribution Margin for LTV
Average Revenue Per User divided by churn rate gives an LTV in revenue terms. You need an LTV in profit terms. Replace ARPU with average contribution margin per user per period.

### Pitfall 3: Ignoring Cohort Degradation
Newer cohorts often have worse retention and lower LTV than older cohorts, especially as you move from early adopters to broader audiences. Always compare cohort LTV curves against each other; do not assume all cohorts are equal.

### Pitfall 4: Confusing Blended CAC with Channel-Level CAC
Blended CAC includes both organic and paid customers. Since organic customers cost nothing to acquire, blending them in flatters the CAC. For budget decisions, use paid CAC by channel.

### Pitfall 5: Using a 36+ Month LTV for a Business with 12 Months of Data
If your business has only 18 months of operating history, a 36-month LTV is a projection with very high uncertainty. Be transparent about how much of your LTV is observed vs. extrapolated.

### Pitfall 6: Not Accounting for Reactivation Costs
Lapsed customers who return are often won back through discounts or win-back campaigns. These reactivation costs should be included in the extended LTV calculation, reducing the apparent value of long-tail customer behavior.
