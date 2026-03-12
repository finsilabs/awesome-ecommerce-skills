---
name: customer-segmentation
description: "RFM analysis, behavioral segments, and cohort-based targeting"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [segmentation, rfm, cohort, behavioral, targeting, crm, customer-analytics, lifecycle]
triggers: ["customer segmentation", "RFM analysis", "rfm scoring", "behavioral segments", "cohort analysis", "customer targeting", "segment customers"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Customer Segmentation

## Overview

Customer segmentation divides your customer base into groups with similar behaviors or characteristics so marketing messages, promotions, and product recommendations can be precisely targeted. This skill covers RFM (Recency, Frequency, Monetary) scoring — the industry-standard framework for e-commerce segmentation — behavioral event-based segments, cohort analysis, and exporting segments to ESPs and advertising platforms.

## When to Use This Skill

- When personalizing email campaigns by customer lifecycle stage (new, active, at-risk, lapsed)
- When building suppression lists to avoid wasting ad spend on already-converted customers
- When identifying "champion" customers for VIP programs and early access campaigns
- When analyzing which acquisition cohort has the best 90-day retention
- When feeding behavioral segments into Klaviyo, Braze, or a custom CDP
- When RFM scoring is needed as input to a CLV prediction model

## Core Instructions

1. **Calculate RFM scores for every customer**

   RFM assigns three scores (each 1–5) representing how recently a customer bought, how often they buy, and how much they spend:

   ```sql
   -- PostgreSQL: calculate raw RFM values
   WITH customer_rfm AS (
     SELECT
       customer_id,
       EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 86400 AS recency_days,
       COUNT(id) AS frequency,
       SUM(subtotal_cents) / 100.0 AS monetary
     FROM orders
     WHERE status NOT IN ('cancelled', 'refunded')
     GROUP BY customer_id
   ),
   rfm_scored AS (
     SELECT
       customer_id,
       recency_days,
       frequency,
       monetary,
       NTILE(5) OVER (ORDER BY recency_days DESC) AS r_score,   -- Lower recency = higher score
       NTILE(5) OVER (ORDER BY frequency ASC) AS f_score,
       NTILE(5) OVER (ORDER BY monetary ASC) AS m_score
     FROM customer_rfm
   )
   SELECT
     customer_id,
     r_score,
     f_score,
     m_score,
     r_score + f_score + m_score AS rfm_total,
     CONCAT(r_score, f_score, m_score) AS rfm_cell
   FROM rfm_scored;
   ```

2. **Map RFM cells to named segments**

   ```typescript
   type RFMSegment =
     | 'champions'
     | 'loyal_customers'
     | 'potential_loyalists'
     | 'recent_customers'
     | 'promising'
     | 'need_attention'
     | 'about_to_sleep'
     | 'at_risk'
     | 'cannot_lose_them'
     | 'hibernating'
     | 'lost';

   function classifyRFMSegment(r: number, f: number, m: number): RFMSegment {
     const rfm = `${r}${f}${m}`;

     if (r >= 4 && f >= 4 && m >= 4) return 'champions';
     if (r >= 3 && f >= 3 && m >= 3) return 'loyal_customers';
     if (r >= 4 && f <= 2) return 'recent_customers';
     if (r >= 3 && f >= 3 && m <= 2) return 'potential_loyalists';
     if (r >= 3 && f <= 2 && m <= 2) return 'promising';
     if (r === 3 && f >= 3) return 'need_attention';
     if (r <= 2 && f >= 4 && m >= 4) return 'cannot_lose_them';
     if (r <= 2 && f >= 3) return 'at_risk';
     if (r === 2 && f <= 2) return 'about_to_sleep';
     if (r === 1 && f <= 2) return 'hibernating';
     return 'lost';
   }

   // Refresh RFM scores nightly
   async function refreshRFMScores() {
     const scores = await db.query(rfmScoringQuery);
     for (const row of scores) {
       const segment = classifyRFMSegment(row.r_score, row.f_score, row.m_score);
       await db.customerSegmentScores.upsert(
         { customerId: row.customer_id },
         { customerId: row.customer_id, rScore: row.r_score, fScore: row.f_score, mScore: row.m_score, segment, updatedAt: new Date() }
       );
     }
   }
   ```

3. **Build behavioral event-based segments**

   Complement RFM with real-time behavioral signals:

   ```typescript
   interface BehavioralSegment {
     id: string;
     name: string;
     description: string;
     rules: SegmentRule[];
     operator: 'AND' | 'OR';
   }

   type SegmentRule =
     | { type: 'event'; event: string; count: { op: '>=' | '<='; value: number }; withinDays: number }
     | { type: 'property'; field: string; op: '==' | '!=' | '>=' | '<='; value: unknown }
     | { type: 'segment'; segmentId: string; in: boolean };

   async function evaluateBehavioralSegment(customerId: string, segment: BehavioralSegment): Promise<boolean> {
     const results = await Promise.all(
       segment.rules.map(async (rule) => {
         if (rule.type === 'event') {
           const count = await db.customerEvents.count({
             customerId,
             event: rule.event,
             createdAt: { gte: subDays(new Date(), rule.withinDays) },
           });
           return rule.count.op === '>=' ? count >= rule.count.value : count <= rule.count.value;
         }
         if (rule.type === 'property') {
           const customer = await db.customers.findById(customerId);
           return applyOperator(customer[rule.field], rule.op, rule.value);
         }
         if (rule.type === 'segment') {
           const inSegment = await isCustomerInSegment(customerId, rule.segmentId);
           return rule.in ? inSegment : !inSegment;
         }
         return false;
       })
     );

     return segment.operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
   }
   ```

4. **Build cohort analysis to track retention by signup month**

   ```sql
   -- Cohort retention: % of customers still purchasing N months after first order
   WITH cohorts AS (
     SELECT
       customer_id,
       DATE_TRUNC('month', MIN(created_at)) AS cohort_month
     FROM orders
     WHERE status NOT IN ('cancelled', 'refunded')
     GROUP BY customer_id
   ),
   cohort_orders AS (
     SELECT
       c.cohort_month,
       o.customer_id,
       DATE_PART('month', AGE(DATE_TRUNC('month', o.created_at), c.cohort_month)) AS period_number
     FROM cohorts c
     JOIN orders o ON c.customer_id = o.customer_id
     WHERE o.status NOT IN ('cancelled', 'refunded')
   )
   SELECT
     cohort_month,
     COUNT(DISTINCT CASE WHEN period_number = 0 THEN customer_id END) AS cohort_size,
     COUNT(DISTINCT CASE WHEN period_number = 1 THEN customer_id END) AS month_1_retained,
     COUNT(DISTINCT CASE WHEN period_number = 3 THEN customer_id END) AS month_3_retained,
     COUNT(DISTINCT CASE WHEN period_number = 6 THEN customer_id END) AS month_6_retained,
     COUNT(DISTINCT CASE WHEN period_number = 12 THEN customer_id END) AS month_12_retained
   FROM cohort_orders
   GROUP BY cohort_month
   ORDER BY cohort_month DESC;
   ```

5. **Export segments to ESP (Klaviyo) and advertising platforms**

   ```typescript
   async function syncSegmentToKlaviyo(segmentId: string, klaviyoListId: string) {
     const customerIds = await db.customerSegmentMemberships.findCustomerIds(segmentId);
     const customers = await db.customers.findByIds(customerIds, { fields: ['email', 'firstName', 'lastName', 'phone'] });

     // Klaviyo accepts batches of up to 100 profiles per request
     const chunks = chunk(customers, 100);

     for (const batch of chunks) {
       await fetch(`https://a.klaviyo.com/api/lists/${klaviyoListId}/relationships/profiles/`, {
         method: 'POST',
         headers: {
           Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
           'Content-Type': 'application/json',
           revision: '2024-02-15',
         },
         body: JSON.stringify({
           data: batch.map((c) => ({
             type: 'profile',
             attributes: { email: c.email, first_name: c.firstName, last_name: c.lastName, phone_number: c.phone },
           })),
         }),
       });
     }
   }
   ```

## Examples

### Segment summary for CRM dashboard

```typescript
async function getSegmentSummary() {
  const segments = await db.customerSegmentScores.groupBy({
    by: ['segment'],
    _count: { customerId: true },
    _avg: { mScore: true },
  });

  return segments.map((s) => ({
    segment: s.segment,
    customerCount: s._count.customerId,
    avgMonetaryScore: s._avg.mScore?.toFixed(1),
    recommendedAction: SEGMENT_ACTIONS[s.segment],
  }));
}

const SEGMENT_ACTIONS: Record<string, string> = {
  champions: 'Reward with VIP perks and early access',
  at_risk: 'Send win-back email with personalized offer',
  cannot_lose_them: 'Personal outreach + significant discount',
  lost: 'Remove from active campaigns; annual re-engagement only',
  recent_customers: 'Onboarding series; encourage second purchase',
};
```

### Suppression list export for paid ads

```typescript
async function exportSuppressionListForMeta() {
  // Suppress recent purchasers from acquisition campaigns (avoid wasting budget)
  const recentBuyers = await db.orders.findCustomerEmailsWhere({
    createdAt: { gte: subDays(new Date(), 30) },
    status: 'completed',
  });

  return recentBuyers.map((email) => ({ email: hashEmail(email) })); // SHA-256 hash for Meta Custom Audiences
}

function hashEmail(email: string): string {
  const { createHash } = require('crypto');
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}
```

## Best Practices

- **Refresh RFM scores nightly** — customer behavior changes daily; stale scores lead to wrong segment assignments and mistargeted campaigns
- **Use NTILE(5) for RFM quantiles**, not fixed thresholds — this ensures each score bucket always contains the same proportion of customers regardless of overall spend distribution
- **Build segments incrementally** — start with RFM, then layer behavioral signals (category affinity, channel preference) as you collect more data
- **Version segment definitions** — when you change a segment rule, record the change so you can explain why a customer moved between segments
- **Always create a suppression list alongside targeting lists** — sending re-engagement campaigns to active customers wastes budget and annoys them
- **Validate segment sizes before campaign sends** — a segment returning 0 customers means a rule logic error; set a minimum threshold alert
- **Combine RFM with CLV prediction** — RFM tells you where customers are now; CLV tells you where they are going

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Champions segment shrinks every month | Champions require recent AND high frequency — customers naturally graduate out; track segment size trends and diagnose acquisition vs. retention |
| RFM scores biased by a single large order | Separate monetary into "average order value" and "total spend" — a one-time large order looks like a champion but may be a one-off |
| Cohort analysis shows declining retention but reason is unclear | Segment cohort by acquisition channel to identify if specific channels bring lower-quality customers |
| Segment sync to Klaviyo creates duplicate profiles | Ensure you're matching by email as the primary key; use Klaviyo's profile merge API if duplicates exist |
| Behavioral segments run slow on large databases | Add composite indexes on `(customer_id, event, created_at)` on the events table; also consider pre-materializing segment membership in a nightly job |

## Related Skills

- @customer-lifetime-value
- @customer-analytics
- @personalization-engine
- @email-marketing-automation
- @attribution-modeling
