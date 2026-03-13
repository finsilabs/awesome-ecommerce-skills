---
name: customer-lifetime-value
description: "Calculate and track the net profit value each customer generates, then automate retention strategies for your highest-value segments using platform tools"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [clv, ltv, customer-lifetime-value, retention, prediction, churn, rfm, machine-learning]
triggers: ["customer lifetime value", "CLV calculation", "LTV", "predict CLV", "customer retention strategy", "clv model", "churn prediction"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Customer Lifetime Value

## Overview

Customer Lifetime Value (CLV) tells you the total net revenue expected from a customer over their relationship with your store, enabling smarter decisions on acquisition spend, retention investment, and customer tier management. Most platforms calculate historical CLV (total spent to date) natively. For predictive CLV and churn risk scoring, use a dedicated analytics app (Klaviyo, Metorik, Triple Whale) or build a custom model for stores with 10k+ customers.

## When to Use This Skill

- When setting CAC targets for acquisition channels based on expected return
- When building a VIP tier program that needs a quantitative threshold
- When predicting which customers are likely to churn and triggering win-back automation
- When calculating the ROI of retention programs (loyalty points, VIP benefits)
- When segmenting customers by predicted future value rather than historical spend alone

## Core Instructions

### Step 1: Determine platform and choose the right CLV tool

| Platform | Historical CLV | Predictive CLV |
|----------|---------------|----------------|
| **Shopify** | Built-in: Admin → Analytics → Customers (shows lifetime spend) | Triple Whale, Lifetimely, or Klaviyo for predictive scoring |
| **WooCommerce** | Metorik or WooCommerce Analytics → Customers report | Metorik Pro for churn prediction; Klaviyo integration for CLV-based flows |
| **BigCommerce** | Built-in customer analytics; Google Analytics 4 for cohort analysis | Klaviyo or Metorik for predictive CLV |
| **Custom / Headless** | Build SQL queries against your order database | Build a parametric or BG/NBD model against your historical data |

---

### Step 2: Access and track historical CLV

Historical CLV is the sum of all revenue from a customer. Platforms show this natively.

#### Shopify

1. Go to **Admin → Analytics → Reports → Customers over time** — shows total customers, orders, and revenue by cohort
2. Go to **Admin → Customers → [Customer]** — each customer profile shows total spent, order count, and last order date
3. For bulk export: go to **Customers → Export** — the CSV includes `Total Spent` and `Number of Orders` per customer

**More advanced CLV reporting:**
- Install **Lifetimely** from the App Store — provides cohort-based LTV curves, payback period by acquisition channel, and predicted future spend
- Install **Triple Whale** — includes CLV by acquisition source, cohort analysis, and attribution modeling

#### WooCommerce

1. Go to **WooCommerce → Analytics → Customers** — shows lifetime value, order count, and average order value per customer
2. Sort by **Lifetime value** descending to see your top customers
3. Filter by date range to see CLV for specific acquisition cohorts

**Metorik for deeper analytics:**
- Install **Metorik** (connects via WooCommerce REST API)
- Metorik's customer dashboard shows CLV distributions, cohort retention, and automatically flags at-risk customers
- Metorik Pro adds churn probability scoring and automated win-back email triggers

#### BigCommerce

1. Go to **Analytics → Customers** for a summary of customer spending
2. Individual customer profiles show total orders and lifetime spend
3. For cohort analysis: connect **Google Analytics 4** and use the **User Lifetime** reports

---

### Step 3: Set up CLV-based customer segments

Once you can measure CLV, create segments to target different value tiers with different messaging.

#### Shopify + Klaviyo

1. In Klaviyo, go to **Lists & Segments → Create Segment**
2. Create a "VIP Customers" segment: `Customer → Predicted CLV is greater than $500` (Klaviyo calculates predicted CLV automatically for Shopify stores)
3. Create an "At Risk - High Value" segment: `Customer → Predicted CLV > $200 AND Last order date is more than 90 days ago`
4. Use these segments as audiences for targeted email flows

**Klaviyo's predictive analytics (available on paid plans):**
- Klaviyo shows **Predicted CLV**, **Churn Risk**, and **Predicted Next Order Date** per profile
- Find these under **Analytics → Predictive Analytics** or on individual customer profiles
- Use these predictions as segment filters without any custom code

#### WooCommerce + Klaviyo

1. Install **Klaviyo for WooCommerce** from WordPress.org
2. Klaviyo syncs customer purchase history automatically
3. Create the same CLV-based segments as described above

---

### Step 4: Automate retention based on CLV and churn risk

Once segments are defined, create automated flows for each tier.

**Win-back flow for high-value at-risk customers:**

Klaviyo (all platforms):
1. Go to **Flows → Create Flow → Win-Back**
2. Set trigger: customer enters the "At Risk - High Value" segment
3. Configure the sequence:
   - Day 0: personalized email — "We miss you" with product recommendations based on purchase history
   - Day 7: email with a small incentive (free shipping or 10% off)
   - Day 14: final email from the "founder" or customer success team
4. Stop the flow if the customer makes a purchase (add a flow filter: "Ordered zero times since starting this flow")

**VIP tier recognition:**
1. Create a VIP segment (CLV > $500 or 5+ orders)
2. When a customer enters the segment, send a personalized "You're now a VIP" email with exclusive benefits
3. On Shopify: tag the customer with `vip` automatically using **Shopify Flow** (Plus) or a tagging app; use the tag to show VIP-specific content on the storefront

---

#### Custom / Headless

For stores building their own CLV calculations:

```typescript
// lib/clv.ts

// Simple parametric CLV prediction — practical for most stores
export function calculatePredictedCLV(inputs: {
  avgOrderValue: number;
  avgOrderFrequencyPerYear: number;
  avgCustomerLifespanYears: number;
  grossMarginRate: number;
}): number {
  const { avgOrderValue, avgOrderFrequencyPerYear, avgCustomerLifespanYears, grossMarginRate } = inputs;
  return avgOrderValue * avgOrderFrequencyPerYear * avgCustomerLifespanYears * grossMarginRate;
}

// Per-customer prediction from their actual order history
export async function predictCustomerCLV(customerId: string, projectionYears = 2): Promise<number> {
  const orders = await db.orders.findMany({
    where: { customerId, status: { notIn: ['cancelled', 'refunded'] } },
    orderBy: { createdAt: 'asc' },
  });
  if (orders.length < 2) return 0;  // Not enough history

  const dates = orders.map(o => o.createdAt.getTime());
  const tenureDays = (dates[dates.length - 1] - dates[0]) / 86400000;
  const avgIntervalDays = tenureDays / (orders.length - 1);
  const purchasesPerYear = 365 / avgIntervalDays;
  const aov = orders.reduce((sum, o) => sum + o.subtotalCents / 100, 0) / orders.length;

  // Reduce projection for customers who haven't ordered recently
  const daysSinceLast = (Date.now() - dates[dates.length - 1]) / 86400000;
  const effectiveYears = daysSinceLast < 90 ? projectionYears : projectionYears * 0.5;

  return aov * purchasesPerYear * effectiveYears * 0.50;  // 50% gross margin
}

// Churn probability based on recency vs. typical purchase cadence
export async function calculateChurnProbability(customerId: string): Promise<number> {
  const orders = await db.orders.findMany({
    where: { customerId, status: { notIn: ['cancelled', 'refunded'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) return 0.95;
  if (orders.length === 1) return 0.65;

  const daysSinceLast = (Date.now() - orders[0].createdAt.getTime()) / 86400000;
  const avgInterval = orders.slice(0, -1).reduce((sum, o, i) =>
    sum + (o.createdAt.getTime() - orders[i + 1].createdAt.getTime()) / 86400000, 0) / (orders.length - 1);

  // Sigmoid: churn probability rises as recency exceeds 2× typical interval
  const recencyRatio = daysSinceLast / avgInterval;
  return Math.min(0.99, Math.max(0.01, 1 / (1 + Math.exp(-2 * (recencyRatio - 2)))));
}

// Nightly job: update CLV scores and trigger win-back automation
export async function runChurnPreventionNightly() {
  const activeCustomers = await db.customers.findMany({ where: { orderCount: { gte: 2 } } });

  for (const customer of activeCustomers) {
    const [churnProbability, predictedCLV] = await Promise.all([
      calculateChurnProbability(customer.id),
      predictCustomerCLV(customer.id),
    ]);

    await db.customers.update({ where: { id: customer.id }, data: { churnProbability, predictedCLV } });

    // High-value, high-churn-risk: trigger win-back
    if (churnProbability > 0.70 && predictedCLV > 200) {
      const alreadyTriggered = await db.winBackTriggers.findFirst({
        where: { customerId: customer.id, createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
      });
      if (!alreadyTriggered) {
        await klaviyo.triggerFlow(customer.email, 'win-back-high-value');
        await db.winBackTriggers.create({ data: { customerId: customer.id } });
      }
    }
  }
}
```

**For stores with 100k+ customers:** Use the BG/NBD probabilistic model (Python `lifetimes` library) for significantly more accurate predictions than the parametric approach:

```python
from lifetimes import BetaGeoFitter, GammaGammaFitter
from lifetimes.utils import summary_data_from_transaction_data

# Build RFM summary and fit BG/NBD model
rfm = summary_data_from_transaction_data(orders_df, 'customer_id', 'created_at', 'subtotal_cents')
bgf = BetaGeoFitter(penalizer_coef=0.001)
bgf.fit(rfm['frequency'], rfm['recency'], rfm['T'])

ggf = GammaGammaFitter(penalizer_coef=0.001)
ggf.fit(rfm[rfm['frequency'] > 0]['frequency'], rfm[rfm['frequency'] > 0]['monetary_value'])

rfm['predicted_clv_12mo'] = ggf.customer_lifetime_value(bgf, rfm['frequency'], rfm['recency'], rfm['T'], rfm['monetary_value'], time=12, discount_rate=0.01)
```

## Best Practices

- **Use Klaviyo's predictive CLV for Shopify/WooCommerce** before building anything custom — their model is well-calibrated and works out of the box
- **Refresh CLV scores weekly at minimum** — customer behavior changes; stale scores lead to mistargeted retention campaigns
- **Separate predicted CLV from historical spend** in your segments — they answer different questions: historical shows past value, predicted shows where to invest
- **Set CAC ceilings per acquisition channel based on CLV** — if average CLV from Google Ads customers is $80 at 50% margin, your maximum sustainable CAC is $40
- **Calibrate churn probability against actual outcomes** — compare predictions from 6 months ago to who actually churned; adjust thresholds if the model is over- or under-predicting

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| CLV model inflated by a few very large orders | Use median order value rather than mean AOV for parametric models; single outlier orders skew the mean significantly |
| Win-back emails trigger for customers who took a vacation | Set a minimum "days since last purchase" threshold of 60+ days before triggering win-back; short gaps are normal, not churn signals |
| CLV calculation includes cancelled orders | Always filter `status NOT IN ('cancelled', 'refunded')` — cancelled orders overstate revenue |
| Predicted CLV lower than historical for loyal customers | In BG/NBD, verify that the tenure variable (T) is measured from first purchase, not account creation date |

## Related Skills

- @customer-segmentation
- @referral-program
- @personalization-engine
