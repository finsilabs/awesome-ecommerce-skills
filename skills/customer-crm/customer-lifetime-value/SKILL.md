---
name: customer-lifetime-value
description: "Calculate and predict the net profit value each customer will generate over their lifetime, then automate retention strategies for your highest-value segments"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [clv, ltv, customer-lifetime-value, retention, prediction, churn, rfm, machine-learning]
triggers: ["customer lifetime value", "CLV calculation", "LTV", "predict CLV", "customer retention strategy", "clv model", "churn prediction"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Customer Lifetime Value

## Overview

Customer Lifetime Value (CLV) quantifies the total net revenue expected from a customer over their relationship with your store, enabling smarter decisions on acquisition spend, retention investment, and customer tier management. This skill covers three CLV calculation methods — historical CLV for reporting, BG/NBD probabilistic prediction for forward-looking estimates, and a simple parametric model for teams without data science infrastructure — along with automating retention actions based on predicted churn risk.

## When to Use This Skill

- When setting CAC targets for acquisition channels based on expected return
- When building a VIP tier program that needs a quantitative threshold
- When predicting which customers are likely to churn and triggering win-back automation
- When calculating the ROI of retention programs (loyalty points, VIP benefits)
- When a board or investor asks for cohort-level LTV curves
- When segmenting customers by predicted future value rather than historical spend alone

## Prerequisites & Platform Notes

**Shopify**: Shopify stores customer data natively. Use Shopify Customer APIs and metafields for custom data. For CRM, integrate with Klaviyo, HubSpot, or Gorgias via Shopify webhooks.
**WooCommerce**: Customer data lives in WordPress. Extend with CRM plugins (HubSpot for WooCommerce, Metorik). Use woocommerce_created_customer and profile hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with customer data, CRM tool (Klaviyo, HubSpot) if needed

## Core Instructions

1. **Calculate historical CLV (realized value)**

   Historical CLV is the simplest model — the sum of all revenue from a customer minus the cost to acquire them:

   ```sql
   -- PostgreSQL: historical CLV per customer
   SELECT
     c.id AS customer_id,
     c.email,
     c.created_at AS first_seen,
     COUNT(o.id) AS order_count,
     SUM(o.subtotal_cents) / 100.0 AS total_revenue,
     AVG(o.subtotal_cents) / 100.0 AS avg_order_value,
     MAX(o.created_at) AS last_order_at,
     EXTRACT(EPOCH FROM (MAX(o.created_at) - MIN(o.created_at))) / 86400 AS customer_tenure_days,
     -- CLV = total revenue - COGS estimate (50%) - acquisition cost
     SUM(o.subtotal_cents) / 100.0 * 0.50 - COALESCE(c.acquisition_cost_cents, 0) / 100.0 AS historical_clv
   FROM customers c
   JOIN orders o ON o.customer_id = c.id AND o.status NOT IN ('cancelled', 'refunded')
   GROUP BY c.id, c.email, c.created_at, c.acquisition_cost_cents
   HAVING COUNT(o.id) >= 1;
   ```

2. **Implement a simple parametric CLV prediction model**

   A practical model using average purchase value, purchase frequency, and churn probability:

   ```typescript
   interface CLVInputs {
     avgOrderValue: number;         // Average order revenue
     avgOrderFrequency: number;     // Orders per year
     avgCustomerLifespanYears: number; // How long customers typically stay active
     grossMarginRate: number;       // e.g., 0.50 for 50% margin
     discountRate: number;          // e.g., 0.10 for 10% annual discount rate (NPV)
   }

   function calculatePredictedCLV(inputs: CLVInputs): number {
     const { avgOrderValue, avgOrderFrequency, avgCustomerLifespanYears, grossMarginRate, discountRate } = inputs;

     // Predicted CLV = (AOV × Purchase Frequency × Gross Margin) × (1 / (1 + Discount Rate - Repeat Purchase Rate))
     const repeatPurchaseRate = 1 - 1 / avgCustomerLifespanYears;
     const clv = (avgOrderValue * avgOrderFrequency * grossMarginRate) / (1 + discountRate - repeatPurchaseRate);
     return clv;
   }

   // Per-customer prediction using their individual stats
   async function predictCustomerCLV(customerId: string, projectionYears = 2): Promise<number> {
     const orders = await db.orders.findByCustomer(customerId, { where: { status: { not: 'cancelled' } } });
     if (orders.length < 2) return calculateColdStartCLV(customerId);

     const dates = orders.map((o) => o.createdAt.getTime()).sort();
     const tenureDays = (dates[dates.length - 1] - dates[0]) / 86400000;
     const avgPurchaseIntervalDays = tenureDays / (orders.length - 1);
     const purchasesPerYear = 365 / avgPurchaseIntervalDays;

     const totalRevenue = orders.reduce((sum, o) => sum + o.subtotalCents / 100, 0);
     const aov = totalRevenue / orders.length;

     // Estimate remaining lifespan using recency — long-inactive customers have lower predicted lifespan
     const daysSinceLastOrder = (Date.now() - dates[dates.length - 1]) / 86400000;
     const expectedLifespanYears = daysSinceLastOrder < 90 ? projectionYears : projectionYears * 0.5;

     return aov * purchasesPerYear * expectedLifespanYears * 0.50; // 50% gross margin
   }
   ```

3. **Build a churn probability score**

   A customer's probability of churning increases as recency grows relative to their typical purchase cadence:

   ```typescript
   async function calculateChurnProbability(customerId: string): Promise<number> {
     const orders = await db.orders.findByCustomer(customerId, {
       where: { status: { not: 'cancelled' } },
       orderBy: { createdAt: 'desc' },
     });

     if (orders.length === 0) return 0.95; // Never purchased
     if (orders.length === 1) return 0.65; // Only one purchase, higher churn risk

     const daysSinceLastOrder = (Date.now() - orders[0].createdAt.getTime()) / 86400000;

     // Calculate typical inter-purchase interval
     const intervals: number[] = [];
     for (let i = 0; i < orders.length - 1; i++) {
       intervals.push((orders[i].createdAt.getTime() - orders[i + 1].createdAt.getTime()) / 86400000);
     }
     const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;

     // Churn probability rises sigmoidally as recency exceeds the typical interval
     const recencyRatio = daysSinceLastOrder / avgInterval;
     const churnProbability = 1 / (1 + Math.exp(-2 * (recencyRatio - 2))); // Sigmoid centered at 2x average interval

     return Math.min(0.99, Math.max(0.01, churnProbability));
   }
   ```

4. **Automate retention actions based on churn risk**

   ```typescript
   // Cron: run nightly to identify and act on high-churn-risk customers
   async function runChurnPreventionAutomation() {
     const activeCustomers = await db.customers.findActiveWithOrders({ minOrders: 2 });

     for (const customer of activeCustomers) {
       const churnProbability = await calculateChurnProbability(customer.id);
       const predictedCLV = await predictCustomerCLV(customer.id);

       // Update CRM record
       await db.customers.update(customer.id, { churnProbability, predictedCLV, clvUpdatedAt: new Date() });

       // High-value, high-churn-risk: trigger intervention
       if (churnProbability > 0.70 && predictedCLV > 200) {
         const alreadyInWinBack = await db.emailQueue.has(`win_back-${customer.id}-step0`);
         if (!alreadyInWinBack) {
           await triggerWinBackFlow(customer.id, { discountPct: 20, expiresInDays: 7 });
           await db.churnInterventions.create({ customerId: customer.id, churnProbability, predictedCLV, triggeredAt: new Date() });
         }
       }

       // Moderate churn risk: send personalized content
       if (churnProbability > 0.40 && churnProbability <= 0.70) {
         await triggerPersonalizedNurtureEmail(customer.id);
       }
     }
   }
   ```

5. **Build CLV cohort analysis for business reporting**

   ```sql
   -- CLV by acquisition channel and cohort
   SELECT
     DATE_TRUNC('quarter', c.created_at) AS acquisition_quarter,
     c.acquisition_source,
     COUNT(DISTINCT c.id) AS customers,
     AVG(o_stats.total_revenue) AS avg_12mo_clv,
     PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o_stats.total_revenue) AS median_12mo_clv,
     SUM(o_stats.total_revenue) / COUNT(DISTINCT c.id) AS cohort_clv
   FROM customers c
   JOIN LATERAL (
     SELECT
       customer_id,
       SUM(subtotal_cents) / 100.0 AS total_revenue
     FROM orders
     WHERE customer_id = c.id
       AND status NOT IN ('cancelled', 'refunded')
       AND created_at <= c.created_at + INTERVAL '12 months'
     GROUP BY customer_id
   ) o_stats ON TRUE
   GROUP BY 1, 2
   ORDER BY 1 DESC, avg_12mo_clv DESC;
   ```

## Examples

### BG/NBD model using the `lifetimes` Python library

For high-volume stores (100k+ customers), the BG/NBD probabilistic model outperforms simple parametric CLV:

```python
import pandas as pd
from lifetimes import BetaGeoFitter, GammaGammaFitter
from lifetimes.utils import summary_data_from_transaction_data

# Load order data
orders = pd.read_sql("SELECT customer_id, created_at, subtotal_cents FROM orders WHERE status = 'completed'", conn)
orders['created_at'] = pd.to_datetime(orders['created_at'])

# Build RFM summary
rfm = summary_data_from_transaction_data(
    orders,
    customer_id_col='customer_id',
    datetime_col='created_at',
    monetary_value_col='subtotal_cents',
    observation_period_end=pd.Timestamp.now(),
)

# Fit BG/NBD model for purchase frequency prediction
bgf = BetaGeoFitter(penalizer_coef=0.001)
bgf.fit(rfm['frequency'], rfm['recency'], rfm['T'])

# Fit Gamma-Gamma for monetary value
ggf = GammaGammaFitter(penalizer_coef=0.001)
ggf.fit(rfm[rfm['frequency'] > 0]['frequency'], rfm[rfm['frequency'] > 0]['monetary_value'])

# Predict 12-month CLV for all customers
rfm['predicted_clv_12mo'] = ggf.customer_lifetime_value(
    bgf,
    rfm['frequency'],
    rfm['recency'],
    rfm['T'],
    rfm['monetary_value'],
    time=12,           # months
    discount_rate=0.01 # monthly discount rate
)

# Export predictions to DB
rfm[['predicted_clv_12mo']].to_sql('customer_clv_predictions', conn, if_exists='replace')
```

### CLV-based tier assignment

```typescript
async function assignCustomerTier(customerId: string) {
  const { predictedCLV, historicalCLV } = await db.customers.findById(customerId);
  const blendedCLV = predictedCLV * 0.7 + historicalCLV * 0.3;

  const tier =
    blendedCLV >= 1000 ? 'platinum' :
    blendedCLV >= 500 ? 'gold' :
    blendedCLV >= 200 ? 'silver' : 'standard';

  await db.customers.update(customerId, { loyaltyTier: tier });
}
```

## Best Practices

- **Separate predicted CLV from historical CLV** — historical is what they've spent; predicted is what they will spend; both are useful for different decisions
- **Refresh CLV scores weekly at minimum** — customer behavior changes; a weekly recalculation keeps retention interventions timely
- **Use the BG/NBD model for repeat-purchase businesses** with 10k+ customers — it's significantly more accurate than simple average-based models
- **Calibrate churn probability against actual outcomes** — backtest your churn model by comparing predicted churn probabilities from 6 months ago to who actually churned
- **Set CAC ceiling per channel based on CLV** — if CLV from Google Ads is $80 and margin rate is 50%, max sustainable CAC is $40 from that channel
- **Communicate CLV to merchandising** — high-CLV customers' category preferences should influence buying decisions and inventory levels
- **Never use CLV as the only retention metric** — pair it with NPS, CSAT, and support contact rate to get a holistic customer health picture

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| CLV model inflated by a few very large orders | Use median order value instead of mean AOV in the parametric model; outliers in AOV distort predictions |
| Churn automation emails loyal customers who just took a vacation | Set a minimum "days since last purchase" threshold of 60+ days before triggering win-back; short gaps are not churn signals |
| BG/NBD model overfits on small datasets | Use the `penalizer_coef` parameter in the `lifetimes` library to regularize; start at 0.001 and increase if predictions seem unrealistic |
| CLV calculation includes cancelled orders | Always filter `WHERE status NOT IN ('cancelled', 'refunded')` in CLV queries |
| Predicted CLV lower than historical CLV for loyal customers | Check that the "T" variable (customer tenure) in BG/NBD is measured from first purchase, not account creation |

## Related Skills

- @customer-segmentation
- @customer-analytics
- @referral-program
- @email-marketing-automation
- @attribution-modeling
