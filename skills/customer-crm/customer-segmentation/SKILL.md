---
name: customer-segmentation
description: "Segment customers by purchase behavior, recency, and spend using Klaviyo, your platform's built-in tools, or a custom RFM analysis to power targeted marketing"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [segmentation, rfm, cohort, behavioral, targeting, crm, customer-analytics, lifecycle]
triggers: ["customer segmentation", "RFM analysis", "rfm scoring", "behavioral segments", "cohort analysis", "customer targeting", "segment customers"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Customer Segmentation

## Overview

Customer segmentation divides your customer base into groups with similar purchase behavior so marketing campaigns, promotions, and product recommendations can be precisely targeted. Klaviyo, Omnisend, and Metorik all provide RFM-style segmentation out of the box for Shopify and WooCommerce without custom SQL. Only build a custom segmentation system if your platform's tools don't support the segment logic you need.

## When to Use This Skill

- When personalizing email campaigns by lifecycle stage (new, active, at-risk, lapsed)
- When building suppression lists to avoid wasting ad spend on already-converted customers
- When identifying "champion" customers for VIP programs and early access campaigns
- When analyzing which acquisition cohort has the best 90-day retention
- When syncing behavioral segments to advertising platforms (Meta, Google)

## Core Instructions

### Step 1: Determine platform and choose the right segmentation tool

| Platform | Built-in Segmentation | Recommended Tool |
|----------|-----------------------|-----------------|
| **Shopify** | Basic: Admin → Customers → Filters; Advanced: Klaviyo or Omnisend | Klaviyo for email + SMS; Lifetimely for cohort analysis |
| **WooCommerce** | WooCommerce Analytics → Customers (basic filters) | Klaviyo + WooCommerce plugin; or Metorik for analytics |
| **BigCommerce** | Customer Groups (tier-based); Analytics → Customers | Klaviyo for behavioral segmentation |
| **Custom / Headless** | Build RFM scoring in SQL; sync to Klaviyo for activation | Required when platform has no segmentation tools |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: Shopify Admin segments (basic, free)**

1. Go to **Admin → Customers**
2. Use the filter bar to create segments based on:
   - Order count, total spent, last order date
   - Email subscription status, tags, location
   - Product purchased
3. Save the filter as a customer segment
4. Export the segment to CSV for use in ads or email campaigns

**Option B: Klaviyo (recommended for lifecycle segmentation)**

Klaviyo syncs automatically with Shopify and provides RFM-style segmentation built on real purchase data.

**Key segments to create in Klaviyo:**

1. **Champions** (high-value, frequent, recent):
   - Rule: `Ordered at least 3 times` AND `Last order within 60 days` AND `Total spent > $200`
   - Action: Early access to new products, VIP perks, referral program invites

2. **At Risk — High Value**:
   - Rule: `Total spent > $200` AND `Last order 90–180 days ago`
   - Action: Win-back flow with personalized offer

3. **Recent First-Time Buyers**:
   - Rule: `Order count equals 1` AND `First order within 30 days`
   - Action: Onboarding sequence, encourage second purchase

4. **Lapsed Customers**:
   - Rule: `Last order more than 180 days ago` AND `Order count >= 2`
   - Action: Re-engagement campaign with "We've missed you" messaging

5. **Subscribers who never purchased**:
   - Rule: `Email subscriber` AND `Order count equals 0`
   - Action: Welcome series with social proof and first-order incentive

To create segments in Klaviyo:
1. Go to **Lists & Segments → Create Segment**
2. Add conditions using the filter builder — Klaviyo has 150+ pre-built filter types including Shopify-specific events
3. Name the segment clearly (e.g., "At Risk High Value — 90-180 days")
4. Use the segment in a Flow trigger or as an audience for a Campaign

**Klaviyo Predictive Analytics (paid plans):**
- Klaviyo automatically calculates **Predicted CLV**, **Expected Date of Next Order**, and **Churn Risk** per customer
- Find these under **Analytics → Predictive Analytics**
- Use these predictions as segment filter criteria without any custom code

---

#### WooCommerce

**Option A: Metorik (recommended analytics platform)**

1. Install **Metorik** (connects via WooCommerce REST API)
2. Go to **Metorik → Segments → Create Segment**
3. Build rule-based segments using purchase history, product affinity, geography, and more
4. Metorik calculates RFM scores automatically
5. Export segment to CSV or sync directly to Klaviyo/Mailchimp

**Option B: Klaviyo for WooCommerce**

1. Install **Klaviyo: Email Marketing for WooCommerce** from WordPress.org
2. Klaviyo syncs your WooCommerce order history and creates profiles for all customers
3. Build the same lifecycle segments described in the Shopify section above

---

#### BigCommerce

**Customer Groups for tier-based segmentation:**

1. Go to **Customers → Customer Groups → Add Group**
2. Create groups based on purchase behavior rules:
   - "VIP" — customers with lifetime spend > $500
   - "Repeat Buyers" — customers with 3+ orders
3. Assign group-specific pricing, category access, or shipping rules

**Klaviyo for behavioral segmentation:**
- Install the **Klaviyo for BigCommerce** app
- Connect your BigCommerce store
- Build behavioral segments in Klaviyo using purchase history and event data

---

#### Custom / Headless

Build RFM scoring in SQL and sync to an ESP for activation:

```sql
-- PostgreSQL: Calculate RFM scores for all customers
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
    recency_days, frequency, monetary,
    NTILE(5) OVER (ORDER BY recency_days DESC) AS r_score,  -- Lower recency = higher score
    NTILE(5) OVER (ORDER BY frequency ASC) AS f_score,
    NTILE(5) OVER (ORDER BY monetary ASC) AS m_score
  FROM customer_rfm
)
SELECT
  customer_id, r_score, f_score, m_score,
  r_score + f_score + m_score AS rfm_total,
  CASE
    WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'champions'
    WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN 'loyal_customers'
    WHEN r_score >= 4 AND f_score <= 2 THEN 'recent_customers'
    WHEN r_score <= 2 AND f_score >= 4 AND m_score >= 4 THEN 'cannot_lose_them'
    WHEN r_score <= 2 AND f_score >= 3 THEN 'at_risk'
    WHEN r_score = 1 AND f_score <= 2 THEN 'lost'
    ELSE 'needs_attention'
  END AS segment
FROM rfm_scored;
```

```typescript
// Sync a segment to Klaviyo — batched at 100 profiles per request
export async function syncSegmentToKlaviyo(segmentCustomers: Customer[], klaviyoListId: string) {
  const BATCH_SIZE = 100;
  for (let i = 0; i < segmentCustomers.length; i += BATCH_SIZE) {
    const batch = segmentCustomers.slice(i, i + BATCH_SIZE);
    await fetch(`https://a.klaviyo.com/api/lists/${klaviyoListId}/relationships/profiles/`, {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        revision: '2024-10-15',
      },
      body: JSON.stringify({
        data: batch.map(c => ({
          type: 'profile',
          attributes: { email: c.email, first_name: c.firstName, last_name: c.lastName },
        })),
      }),
    });
  }
}

// Export suppression list for Meta Ads — hash emails before sending
export async function exportSuppressionListForMeta(lookbackDays = 30): Promise<string[]> {
  const recentBuyers = await db.orders.findMany({
    where: { createdAt: { gte: new Date(Date.now() - lookbackDays * 86400000) }, status: 'completed' },
    select: { customerEmail: true },
    distinct: ['customerEmail'],
  });

  return recentBuyers.map(({ customerEmail }) => {
    const { createHash } = require('crypto');
    return createHash('sha256').update(customerEmail.toLowerCase().trim()).digest('hex');
  });
}
```

---

### Step 3: Map segments to actions

Every segment should have a clear marketing action:

| Segment | Recommended Action |
|---------|-------------------|
| Champions | VIP early access, referral program invite, no win-back discounts needed |
| Loyal Customers | Loyalty program enrollment, review request, upsell to next tier |
| Recent First-Time Buyers | Second-purchase email series (send 7 days after first order) |
| At Risk — High Value | Personalized win-back with acknowledgment: "It's been a while" |
| Cannot Lose Them | Direct outreach, significant offer (20% off), personal email from founder |
| Lapsed / Lost | Low-cost re-engagement (newsletter, product announcement); remove from active campaigns |

---

### Step 4: Build suppression lists for paid ads

Upload your most recent buyers as suppression lists on Meta and Google to avoid wasting acquisition budget:

- **Meta Business Manager**: Audiences → Create Audience → Customer List → Upload hashed email CSV
- **Google Ads**: Audience Manager → Customer Match → Upload email list
- Refresh these suppression lists monthly

## Best Practices

- **Refresh segments nightly** — Klaviyo and Metorik do this automatically; for custom builds, run the RFM SQL nightly
- **Start with RFM, then layer behavioral signals** — purchase recency/frequency/spend is the most reliable foundation; add category affinity and channel preference as you collect more data
- **Always build suppression lists alongside targeting lists** — sending re-engagement campaigns to active customers wastes budget and annoys them
- **Validate segment sizes before campaign sends** — a segment returning 0 customers usually indicates a logic error; set a minimum threshold check
- **Track which segments respond best to each type of offer** — champions rarely need discounts; at-risk customers may respond to free shipping more than percentage off

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Champions segment shrinks every month | Champions require recent + high frequency — customers naturally graduate out; supplement with "Loyal Customers" for long-term relationship management |
| RFM scores biased by one very large order | Klaviyo's predicted CLV smooths this out; for custom builds, use median order value in the monetary score rather than total spend |
| Segment sync to Klaviyo creates duplicate profiles | Always match by email as the primary key when syncing; if duplicates exist, use Klaviyo's profile merge |
| Cohort analysis shows declining retention but reason unclear | Segment cohort by acquisition channel to identify whether specific channels bring lower-quality customers |

## Related Skills

- @customer-lifetime-value
- @personalization-engine
- @referral-program
