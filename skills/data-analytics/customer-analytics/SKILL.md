---
name: customer-analytics
description: "RFM scoring, purchase frequency, churn prediction, and segment analysis"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [customer-analytics, rfm, churn-prediction, purchase-frequency, cohort, retention, customer-data, segmentation]
triggers: ["customer analytics", "rfm scoring", "churn prediction", "purchase frequency analysis", "customer retention analytics", "customer behavior analysis", "customer data analysis"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Customer Analytics

## Overview

Customer analytics transforms raw order and behavioral data into actionable insights about purchase patterns, lifecycle stages, and churn risk. This skill covers building a complete customer analytics pipeline: RFM scoring from SQL, purchase frequency distributions, churn prediction using survival analysis concepts, segment-level cohort comparisons, and an API that surfaces customer analytics for operational tools like marketing automation and the CRM.

## When to Use This Skill

- When building a customer analytics module for an internal data platform
- When the marketing team needs data-driven segments beyond simple demographic filters
- When calculating at-risk customer counts for quarterly business reviews
- When measuring the impact of loyalty programs on purchase frequency
- When identifying the acquisition channels that produce the highest-quality customers (CLV by source)
- When preparing customer health dashboards for account management or VIP programs

## Core Instructions

1. **Build a comprehensive RFM scoring pipeline**

   ```sql
   -- Full RFM analysis with segment labels
   WITH order_stats AS (
     SELECT
       customer_id,
       MAX(created_at) AS last_order_at,
       COUNT(id) AS order_count,
       SUM(subtotal_cents) / 100.0 AS total_spent,
       MIN(created_at) AS first_order_at,
       AVG(subtotal_cents) / 100.0 AS avg_order_value
     FROM orders
     WHERE status NOT IN ('cancelled', 'refunded')
     GROUP BY customer_id
   ),
   rfm_raw AS (
     SELECT
       customer_id,
       EXTRACT(EPOCH FROM (NOW() - last_order_at)) / 86400 AS recency_days,
       order_count AS frequency,
       total_spent AS monetary,
       avg_order_value,
       first_order_at
     FROM order_stats
   ),
   rfm_scores AS (
     SELECT
       *,
       NTILE(5) OVER (ORDER BY recency_days DESC) AS r,
       NTILE(5) OVER (ORDER BY frequency ASC) AS f,
       NTILE(5) OVER (ORDER BY monetary ASC) AS m
     FROM rfm_raw
   )
   SELECT
     c.id AS customer_id,
     c.email,
     c.first_name,
     rs.recency_days,
     rs.frequency,
     rs.monetary,
     rs.avg_order_value,
     rs.r,
     rs.f,
     rs.m,
     rs.r + rs.f + rs.m AS rfm_score,
     CASE
       WHEN rs.r >= 4 AND rs.f >= 4 AND rs.m >= 4 THEN 'champions'
       WHEN rs.r >= 3 AND rs.f >= 3 AND rs.m >= 3 THEN 'loyal_customers'
       WHEN rs.r >= 4 AND rs.f <= 2 THEN 'recent_customers'
       WHEN rs.r >= 3 AND rs.f >= 3 AND rs.m <= 2 THEN 'potential_loyalists'
       WHEN rs.r <= 2 AND rs.f >= 4 AND rs.m >= 4 THEN 'cannot_lose_them'
       WHEN rs.r <= 2 AND rs.f >= 3 THEN 'at_risk'
       WHEN rs.r = 1 AND rs.f <= 2 THEN 'lost'
       ELSE 'other'
     END AS segment
   FROM rfm_scores rs
   JOIN customers c ON rs.customer_id = c.id;
   ```

2. **Analyze purchase frequency distribution**

   Understanding the distribution of order counts reveals the proportion of one-time vs. repeat buyers:

   ```sql
   -- Purchase frequency distribution
   SELECT
     order_count,
     COUNT(customer_id) AS customers,
     ROUND(100.0 * COUNT(customer_id) / SUM(COUNT(customer_id)) OVER (), 1) AS pct_of_customers,
     SUM(total_spent) AS total_revenue_from_segment,
     ROUND(AVG(total_spent), 2) AS avg_ltv
   FROM (
     SELECT customer_id, COUNT(id) AS order_count, SUM(subtotal_cents) / 100.0 AS total_spent
     FROM orders
     WHERE status NOT IN ('cancelled', 'refunded')
     GROUP BY customer_id
   ) t
   GROUP BY order_count
   ORDER BY order_count;
   ```

   TypeScript API for the frequency chart:

   ```typescript
   export async function getPurchaseFrequencyDistribution(req: Request, res: Response) {
     const rows = await db.query(`
       SELECT
         CASE
           WHEN order_count = 1 THEN '1 order'
           WHEN order_count BETWEEN 2 AND 3 THEN '2-3 orders'
           WHEN order_count BETWEEN 4 AND 6 THEN '4-6 orders'
           ELSE '7+ orders'
         END AS frequency_bucket,
         COUNT(*) AS customers,
         AVG(total_spent) AS avg_ltv
       FROM (
         SELECT customer_id, COUNT(id) AS order_count, SUM(subtotal_cents) / 100.0 AS total_spent
         FROM orders WHERE status NOT IN ('cancelled', 'refunded') GROUP BY customer_id
       ) t
       GROUP BY frequency_bucket
       ORDER BY MIN(order_count)
     `);

     res.json(rows);
   }
   ```

3. **Build a churn prediction pipeline**

   ```typescript
   interface CustomerChurnRisk {
     customerId: string;
     churnScore: number;       // 0–1, probability of churn
     churnCategory: 'low' | 'medium' | 'high' | 'churned';
     daysSinceLastOrder: number;
     avgPurchaseIntervalDays: number;
     predictedNextOrderDate: Date | null;
   }

   async function scoreCustomerChurnRisk(customerId: string): Promise<CustomerChurnRisk> {
     const orders = await db.orders.findByCustomer(customerId, {
       where: { status: { notIn: ['cancelled', 'refunded'] } },
       orderBy: { createdAt: 'asc' },
     });

     if (orders.length === 0) return { customerId, churnScore: 0.95, churnCategory: 'churned', daysSinceLastOrder: Infinity, avgPurchaseIntervalDays: 0, predictedNextOrderDate: null };

     const lastOrderDate = orders[orders.length - 1].createdAt;
     const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / 86400000;

     if (orders.length === 1) {
       // Single-purchase customers: churn score based on days since purchase
       const churnScore = Math.min(0.95, 0.3 + daysSinceLastOrder * 0.005);
       return { customerId, churnScore, churnCategory: churnScore > 0.7 ? 'high' : churnScore > 0.4 ? 'medium' : 'low', daysSinceLastOrder, avgPurchaseIntervalDays: 0, predictedNextOrderDate: null };
     }

     // Multi-purchase: compare recency to typical interval
     const intervals: number[] = [];
     for (let i = 1; i < orders.length; i++) {
       intervals.push((orders[i].createdAt.getTime() - orders[i - 1].createdAt.getTime()) / 86400000);
     }
     const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
     const stdDev = Math.sqrt(intervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) / intervals.length);

     // How many standard deviations past due is this customer?
     const zScore = (daysSinceLastOrder - avgInterval) / Math.max(1, stdDev);
     const churnScore = Math.min(0.99, Math.max(0.01, 1 / (1 + Math.exp(-0.5 * zScore))));

     const predictedNextOrderDate = new Date(lastOrderDate.getTime() + avgInterval * 86400000);

     return {
       customerId,
       churnScore,
       churnCategory: churnScore > 0.75 ? 'high' : churnScore > 0.45 ? 'medium' : 'low',
       daysSinceLastOrder,
       avgPurchaseIntervalDays: avgInterval,
       predictedNextOrderDate,
     };
   }
   ```

4. **Build acquisition channel quality analysis**

   ```sql
   -- CLV by acquisition channel: which channels bring the best customers?
   SELECT
     COALESCE(oa.source, 'direct') AS acquisition_source,
     COUNT(DISTINCT c.id) AS customers_acquired,
     AVG(clv.total_revenue_12mo) AS avg_12mo_clv,
     PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY clv.total_revenue_12mo) AS median_12mo_clv,
     AVG(clv.order_count) AS avg_orders_per_customer,
     AVG(clv.avg_order_value) AS avg_aov,
     -- Ratio of customers who ordered more than once
     ROUND(100.0 * COUNT(DISTINCT CASE WHEN clv.order_count > 1 THEN c.id END) / COUNT(DISTINCT c.id), 1) AS repeat_purchase_rate_pct
   FROM customers c
   LEFT JOIN order_attribution oa ON oa.order_id = (
     SELECT id FROM orders WHERE customer_id = c.id ORDER BY created_at ASC LIMIT 1
   )
   LEFT JOIN LATERAL (
     SELECT
       customer_id,
       COUNT(id) AS order_count,
       SUM(subtotal_cents) / 100.0 AS total_revenue_12mo,
       AVG(subtotal_cents) / 100.0 AS avg_order_value
     FROM orders
     WHERE customer_id = c.id
       AND status NOT IN ('cancelled', 'refunded')
       AND created_at <= c.created_at + INTERVAL '12 months'
     GROUP BY customer_id
   ) clv ON TRUE
   WHERE c.created_at >= NOW() - INTERVAL '18 months' -- acquired in last 18mo for fair comparison
   GROUP BY 1
   ORDER BY avg_12mo_clv DESC;
   ```

5. **Build the customer analytics API**

   ```typescript
   // GET /api/analytics/customers/overview
   export async function getCustomerAnalyticsOverview(req: Request, res: Response) {
     const [
       segmentDistribution,
       frequencyDistribution,
       churnRiskDistribution,
       retentionRate,
     ] = await Promise.all([
       db.query(rfmSegmentDistributionSQL),
       db.query(purchaseFrequencySQL),
       db.customerChurnScores.groupBy({ by: ['churnCategory'], _count: { customerId: true } }),
       calculateRetentionRate(90), // 90-day retention
     ]);

     res.json({
       totalCustomers: segmentDistribution.reduce((sum: number, s: any) => sum + s.count, 0),
       segments: segmentDistribution,
       frequencyDistribution,
       churnRisk: {
         high: churnRiskDistribution.find((r: any) => r.churnCategory === 'high')?._count?.customerId ?? 0,
         medium: churnRiskDistribution.find((r: any) => r.churnCategory === 'medium')?._count?.customerId ?? 0,
         low: churnRiskDistribution.find((r: any) => r.churnCategory === 'low')?._count?.customerId ?? 0,
       },
       retentionRate90Day: retentionRate,
     });
   }
   ```

## Examples

### Customer cohort retention matrix

```sql
-- Monthly cohort retention: what % of each acquisition cohort is still buying?
WITH first_orders AS (
  SELECT customer_id, DATE_TRUNC('month', MIN(created_at)) AS cohort_month
  FROM orders WHERE status NOT IN ('cancelled', 'refunded') GROUP BY customer_id
),
repeat_orders AS (
  SELECT o.customer_id, DATE_TRUNC('month', o.created_at) AS order_month
  FROM orders o WHERE status NOT IN ('cancelled', 'refunded')
)
SELECT
  fo.cohort_month,
  COUNT(DISTINCT fo.customer_id) AS cohort_size,
  EXTRACT(MONTH FROM AGE(ro.order_month, fo.cohort_month)) AS months_since_first_order,
  COUNT(DISTINCT ro.customer_id) AS retained_customers,
  ROUND(100.0 * COUNT(DISTINCT ro.customer_id) / COUNT(DISTINCT fo.customer_id), 1) AS retention_pct
FROM first_orders fo
JOIN repeat_orders ro ON fo.customer_id = ro.customer_id
  AND ro.order_month >= fo.cohort_month
GROUP BY fo.cohort_month, months_since_first_order
ORDER BY fo.cohort_month DESC, months_since_first_order;
```

### Identify best customers about to churn

```typescript
async function getHighValueAtRiskCustomers(limit = 50) {
  const scores = await db.customerChurnScores.findMany({
    where: { churnCategory: 'high' },
    include: ['customer'],
    orderBy: [{ customer: { lifetimeSpendCents: 'desc' } }],
    take: limit,
  });

  return scores.map((s) => ({
    customerId: s.customerId,
    name: s.customer.firstName,
    email: s.customer.email,
    lifetimeValue: s.customer.lifetimeSpendCents / 100,
    churnScore: s.churnScore,
    daysSinceLastOrder: s.daysSinceLastOrder,
    recommendedAction: s.customer.lifetimeSpendCents >= 50000 ? 'personal_outreach' : 'win_back_email',
  }));
}
```

## Best Practices

- **Run RFM scoring as a nightly batch job** — customer order history changes daily; stale scores lead to wrong segment assignments
- **Validate churn model accuracy** monthly by comparing predicted churn probabilities from 90 days ago to who actually churned — adjust scoring coefficients if accuracy drifts
- **Segment acquisition channel analysis** by cohort month, not lifetime — channels that were good 2 years ago may have declined in quality
- **Track second-purchase rate as a leading indicator** — the conversion from one-time buyer to repeat customer is the highest-leverage retention metric and a leading indicator of CLV
- **Build alerts on segment migrations** — when the "cannot lose them" segment grows week over week, it signals a retention problem needing immediate action
- **Cross-reference churn risk with support ticket history** — customers who contacted support and had poor experiences (low CSAT) have higher churn risk; combine signals
- **Combine RFM with behavioral data for richer segments** — RFM is purchase-based; layer in browsing frequency, category affinity, and channel preference for more precise targeting

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| RFM quantiles shift dramatically after a sale event | Use a rolling 90-day window for scoring rather than the all-time dataset; recent spikes shouldn't permanently elevate scores |
| Churn prediction false positives for seasonal buyers | Include a "seasonal purchase pattern" flag — customers who only buy in Q4 should not be marked as churned in Q2 |
| Acquisition channel analysis not accounting for multi-touch | Clarify whether you are using first-touch or last-touch attribution; be explicit in report labels |
| Cohort analysis shows 0% retention after month 6 | Check if the query is filtering out cohort groups that haven't had 6 months yet — use `HAVING cohort_month <= NOW() - INTERVAL '6 months'` |
| Customer analytics queries time out on 1M+ customer tables | Materialize RFM scores daily into `customer_rfm_scores` table; never compute NTILE on the full table in real-time |

## Related Skills

- @customer-segmentation
- @customer-lifetime-value
- @attribution-modeling
- @sales-reporting-dashboard
- @ab-testing-ecommerce
