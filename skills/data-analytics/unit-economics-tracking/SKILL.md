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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Unit Economics Tracking

## Overview

Unit economics describes the financial dynamics of a single customer. The four key metrics — Customer Acquisition Cost (CAC), Customer Lifetime Value (LTV), the LTV:CAC ratio, and payback period — tell you whether your business model is economically viable. These metrics are among the most scrutinized by investors and boards because they reveal the underlying health of the business independent of short-term revenue trends.

This skill guides you through calculating and tracking these metrics using your platform's analytics tools and dedicated customer analytics apps.

## When to Use This Skill

- When preparing investor materials and needing to present unit economics metrics
- When understanding whether it is profitable to increase marketing spend in a given channel
- When analyzing why CAC has increased over the past 6 months
- When comparing the quality of customers acquired through different channels
- When building a financial model and needing to validate LTV assumptions
- When setting budget guardrails: maximum allowable CAC by channel
- When evaluating a new acquisition channel and projecting its payback period

## Core Instructions

### Step 1: Choose your unit economics tracking tool by platform

| Platform | Tool | What It Provides |
|----------|------|-----------------|
| **Shopify** | **Lifetimely** (App Store) | CAC by channel, cohort LTV curves, payback period, predicted CLV per customer |
| **Shopify** | **Triple Whale** (App Store) | New customer CAC by channel, blended CAC, LTV vs. CAC ratio |
| **Shopify** | **Polar Analytics** (App Store) | CAC tracking with channel breakdown, MER, and LTV trending |
| **WooCommerce** | **Metorik** | Customer cohort analysis, repeat purchase rate, LTV by acquisition channel |
| **BigCommerce** | **Glew.io** (App Marketplace) | Customer cohort retention, CLV by segment, repeat purchase analysis |
| **All platforms** | **Google Analytics 4** | Acquisition channel reporting; pair with cost data from ad platforms for CAC calculation |

### Step 2: Calculate Customer Acquisition Cost (CAC)

CAC is the total marketing and sales spend required to acquire one new customer.

**Types of CAC:**

| CAC Type | Formula | When to Use |
|----------|---------|------------|
| **Blended CAC** | Total marketing spend / Total new customers acquired | Overall efficiency trend; monthly reporting |
| **Paid CAC** | Total paid media spend / New customers from paid channels only | Channel budget decisions |
| **Fully-loaded CAC** | Total marketing spend + agency fees + marketing tech + team salaries / New customers | Investor presentations; true economic cost |

**Getting CAC data by platform:**

**Shopify with Lifetimely:**
1. Install **Lifetimely** from the Shopify App Store
2. Connect ad accounts (Meta, Google, TikTok) under **Integrations**
3. Go to **Lifetimely → Channels** — view CAC by acquisition channel with trend over time
4. Lifetimely tracks "new customers" based on first Shopify order date and attributes them to their first-touch UTM source

**Shopify with Triple Whale:**
1. Install **Triple Whale** and connect ad accounts
2. Go to **Triple Whale → Summary Dashboard** — "New Customer CAC" tile shows blended new customer acquisition cost
3. Go to **Triple Whale → Attribution → New Customer Revenue** for CAC by channel

**Manual CAC calculation (any platform):**
1. Export: Monthly marketing spend by channel (from your ad platforms or agency reports)
2. Export: New customer count by acquisition channel and month (from your platform's analytics: Shopify Analytics → New vs. returning customers; Metorik → Customers → First order date)
3. Calculate: CAC by channel = Channel spend / New customers attributed to that channel

**Typical CAC benchmarks by channel:**
- Google Shopping / Search: $15–$50 (lower for branded, higher for competitive non-branded)
- Meta (Facebook/Instagram): $20–$80 for DTC
- TikTok: $10–$40 (often lower for discovery-driven products)
- Influencer marketing: $15–$60 (highly variable)
- Email/SMS (acquisition via lead gen): $5–$20

### Step 3: Calculate Customer Lifetime Value (LTV)

LTV is the total net revenue (or contribution margin) you expect from a customer over their relationship with your business.

**Historical (observed) LTV:**
Pull this from your analytics tool directly.

**Shopify + Lifetimely:**
1. Go to **Lifetimely → Cohorts** — see a cohort table showing cumulative revenue per customer at 1, 3, 6, 12, 18, 24 months after acquisition
2. The month-12 and month-24 rows represent your observed LTV at those time horizons
3. Go to **Lifetimely → Predicted CLV** — Lifetimely's model predicts 12-month and 24-month CLV per customer based on their early purchase behavior

**WooCommerce + Metorik:**
1. Go to **Metorik → Reports → Customer Cohorts** — cohort retention table with cumulative revenue per customer by months since acquisition
2. Go to **Metorik → Customers → Filter by: First order date range** — view average revenue per customer for any acquisition cohort

**Predicted LTV formula (for planning models):**

When you do not have 12+ months of cohort data, use this simplified formula:
```
LTV = (Average Order Value × Purchase Frequency per Year × Gross Margin %) / Annual Churn Rate

Example:
  AOV: $65
  Purchase Frequency: 2.5 orders/year
  Gross Margin: 55%
  Annual Churn Rate: 40%

LTV = ($65 × 2.5 × 0.55) / 0.40 = $89.375 / 0.40 = $223.44
```

This formula gives steady-state LTV. It assumes stable purchase behavior, which is a simplification — cohort-based analysis is more accurate when you have the data.

### Step 4: Calculate LTV:CAC ratio and payback period

**LTV:CAC ratio:**

```
LTV:CAC = LTV / CAC

Benchmarks:
  2:1 = Minimum viable (barely profitable customer acquisition)
  3:1 = Healthy for DTC ecommerce
  5:1+ = Excellent; strong case for scaling marketing spend
```

| LTV:CAC | Assessment | Action |
|---------|-----------|--------|
| < 2:1 | Unprofitable | Stop scaling paid acquisition; improve retention or reduce costs |
| 2:1 – 3:1 | Marginal | Monitor closely; improve one driver (AOV, repeat rate, or CAC) before scaling |
| 3:1 – 5:1 | Healthy | Good baseline; evaluate where to scale |
| 5:1+ | Excellent | Prioritize scaling this channel or business |

**Payback period:**

Payback period = CAC / (Monthly Contribution per Customer)

```
Example:
  CAC: $60
  AOV: $65
  Purchase Frequency: 2.5 orders/year → 0.21 orders/month
  Gross Margin: 55%
  Fulfillment + other variable costs: 15%
  Contribution margin rate: 40%

Monthly contribution per customer = $65 × 0.21 × 0.40 = $5.46
Payback period = $60 / $5.46 = 11 months
```

**Payback benchmarks:**
- <6 months: Excellent; very capital-efficient growth
- 6–12 months: Healthy
- 12–24 months: Acceptable if retention is strong past month 24
- 24+ months: Problematic unless you have significant venture/debt capital to bridge

### Step 5: Track unit economics by acquisition channel

The most important dimension for unit economics is acquisition channel — customers from different sources often have dramatically different LTVs, repeat purchase rates, and initial AOVs.

**Using Lifetimely (Shopify) to compare channels:**
1. Go to **Lifetimely → Channels** — select "LTV comparison by channel"
2. View 12-month and 24-month LTV by first-touch acquisition source
3. Pair with CAC by channel (from ad platform spend) to calculate LTV:CAC by channel

**Channel LTV comparison template:**

| Channel | CAC | Month-12 LTV | LTV:CAC | Payback (months) | Assessment |
|---------|-----|-------------|---------|-----------------|-----------|
| Google Shopping | $35 | $180 | 5.1:1 | 4 | Excellent; scale |
| Meta Prospecting | $62 | $145 | 2.3:1 | 13 | Marginal; optimize creatives |
| TikTok | $28 | $95 | 3.4:1 | 9 | Healthy; test scaling |
| Influencer | $45 | $210 | 4.7:1 | 6 | Excellent; invest more |
| Organic/SEO | $0 | $165 | ∞ | 0 | Free acquisition; protect this channel |

**Key insight from this type of analysis:** Meta Prospecting appears to have a high ROAS in Meta's dashboard but has the worst LTV:CAC because those customers have lower repeat purchase rates. This is the power of LTV-based analysis over single-order ROAS.

### Step 6: Monitor CAC trends weekly

Rising CAC is the first warning sign of channel saturation or increased competition. Monitor it weekly:

1. Set up a **CAC alert** in Triple Whale or Polar Analytics: alert when weekly new customer CAC exceeds your maximum allowable CAC by channel
2. Your **maximum allowable CAC** = LTV / Target LTV:CAC ratio
   - Example: If LTV = $180 and target LTV:CAC = 3.0, max CAC = $60
3. Any channel where CAC exceeds the maximum allowable CAC should be reviewed before the next weekly budget cycle

## Best Practices

- **Use contribution margin LTV, not gross revenue LTV** — LTV calculated on revenue overstates actual customer value; use contribution margin (after COGS, fulfillment, and variable costs) for a realistic economic picture
- **Segment LTV by acquisition channel from day one** — customers from organic search, paid social, and influencer partnerships often have dramatically different LTVs; pooling them into a blended LTV obscures channel economics
- **Track LTV curves, not just point estimates** — plot cumulative gross profit per customer over 24 months for each cohort; comparing curves across cohorts reveals whether recent cohorts are better or worse than historical averages
- **Set maximum CAC guardrails for each channel** — derive Max CAC = LTV / Target LTV:CAC ratio; use this as a hard budget guardrail so marketing teams cannot overpay for customers without executive approval
- **Validate LTV predictions against cohort actuals** — every 6 months, compare LTV predictions against the actual cumulative gross profit of cohorts that are now old enough to measure; recalibrate if predictions are consistently off
- **Account for reactivation costs in long-tail LTV** — customers who lapse and return via win-back campaigns have reactivation costs (discounts, extra email volume) that should reduce the apparent value of long-tail behavior

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Using only media spend to calculate CAC | True CAC includes agency fees, marketing technology (email platforms, analytics apps), marketing team salaries, and first-order discounts; using media-only CAC understates true CAC by 20–50% |
| Using ARPU (average revenue per user) instead of contribution margin for LTV | LTV in revenue terms overstates economic value; always use average contribution margin per customer per period |
| Ignoring cohort degradation | Newer cohorts often have worse retention than earlier cohorts as you move from early adopters to broader audiences; always compare cohort curves against each other rather than assuming all cohorts are equal |
| Confusing blended CAC with channel-level CAC | Blended CAC mixes organic (free) and paid customers; since organic customers cost nothing to acquire, blending them flatters paid CAC; use paid CAC by channel for budget decisions |
| Presenting LTV with too-long forecasts when business is young | If your business has 18 months of data, a 36-month LTV is highly speculative; be transparent about what portion of LTV is observed vs. modeled extrapolation |

## Related Skills

- @customer-analytics
- @attribution-modeling
- @marketing-spend-analysis
- @financial-analytics-dashboard
- @ecommerce-budgeting-forecasting
