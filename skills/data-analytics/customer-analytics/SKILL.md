---
name: customer-analytics
description: "Analyze customer behavior with RFM scoring, purchase frequency tracking, churn prediction, and cohort analysis to improve retention strategy"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [customer-analytics, rfm, churn-prediction, purchase-frequency, cohort, retention, customer-data, segmentation]
triggers: ["customer analytics", "rfm scoring", "churn prediction", "purchase frequency analysis", "customer retention analytics", "customer behavior analysis", "customer data analysis"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Customer Analytics

## Overview

Customer analytics transforms raw order data into actionable insights about purchase patterns, lifecycle stages, and churn risk. The core analyses — RFM scoring, cohort retention, purchase frequency, and churn prediction — reveal which customers are loyal, which are at risk, and which channels produce the best long-term customers.

This skill guides you through running these analyses using your platform's built-in tools and dedicated analytics apps, with data warehouse approaches for stores that need deeper segmentation.

## When to Use This Skill

- When the marketing team needs data-driven segments beyond simple demographic filters
- When calculating at-risk customer counts for quarterly business reviews
- When measuring the impact of loyalty programs on purchase frequency
- When identifying the acquisition channels that produce the highest-LTV customers
- When preparing customer health dashboards for account management or VIP programs
- When building cohort retention analysis to understand customer lifetime value trends

## Core Instructions

### Step 1: Choose the right tool for your platform

| Platform | Recommended Tool | What It Provides |
|----------|-----------------|-----------------|
| **Shopify** | **Klaviyo** + Shopify's built-in customer segments | RFM-style segments, purchase frequency, CLV prediction, cohort reports |
| **Shopify** (advanced) | **Lifetimely** or **Triple Whale** | True cohort LTV, CLV by acquisition channel, retention curves |
| **WooCommerce** | **Metorik** | Customer segmentation, RFM analysis, cohort retention, churn identification |
| **WooCommerce** (email) | **Klaviyo** for WooCommerce | Behavioral segments + automated flows based on customer lifecycle stage |
| **BigCommerce** | **Klaviyo** for BigCommerce + **Glew.io** | Glew provides cohort analysis and CLV tracking natively for BigCommerce |
| **All platforms** (data-first) | Export to **Google Looker Studio** + **BigQuery** via Fivetran | Full SQL-based analysis; required for advanced RFM and cohort modeling |

### Step 2: Set up customer segmentation on your platform

---

#### Shopify

**Using Shopify's built-in customer segments (all plans):**

1. Go to **Customers → Segments**
2. Shopify provides pre-built segments including:
   - **Abandoned checkout in the last 30 days**
   - **Customers who have purchased more than X times**
   - **Customers who haven't purchased in 90 days** (at-risk segment)
   - **High-spend customers** (based on total spend threshold)
3. Create custom segments using the query editor with filters like:
   - `number_of_orders >= 3` (loyal customers)
   - `days_since_last_order > 90` (churn risk)
   - `total_spent > 500` (high-value)
4. Export segments to CSV or sync directly to Klaviyo for email campaigns

**Using Klaviyo for RFM segmentation on Shopify:**

1. Install **Klaviyo** from the Shopify App Store
2. Klaviyo automatically syncs all historical and new Shopify order data
3. Go to **Segments → Create Segment** and build RFM-style segments using:
   - **Recency:** "Has placed an order in the last X days"
   - **Frequency:** "Number of orders is greater than X"
   - **Monetary:** "Total amount spent is greater than $X"
4. Pre-built segment examples:
   - **Champions:** Ordered in last 30 days + 3+ orders + $200+ lifetime spend
   - **At Risk:** No order in 90–180 days + previously placed 2+ orders
   - **Lost:** No order in 180+ days
5. Use these segments to trigger flows in Klaviyo: win-back campaigns for at-risk, VIP rewards for champions

**Using Lifetimely for cohort LTV on Shopify:**

1. Install **Lifetimely** from the Shopify App Store
2. Go to **Lifetimely → Cohorts** to see a month-by-month retention matrix: what percentage of customers from each acquisition cohort are still buying at months 1, 3, 6, 12
3. Go to **Lifetimely → Channels** to compare 12-month LTV by acquisition source (Google, Meta, organic, email)
4. Go to **Lifetimely → Customer Segments** to see RFM distribution and predicted CLV per customer

---

#### WooCommerce

**Using Metorik:**

1. Connect Metorik to your WooCommerce store via API
2. Go to **Metorik → Customers** to browse all customers with filters:
   - Last order date (identify churned/at-risk)
   - Total spent (identify high-value)
   - Order count (identify one-time vs. repeat buyers)
3. Go to **Metorik → Reports → Customer Cohorts** to see retention by monthly acquisition cohort
4. Go to **Metorik → Segments** to create saved customer segments (equivalent to RFM groups); export segments as CSVs for Klaviyo or Mailchimp

**Using Klaviyo for WooCommerce:**

1. Install the **Klaviyo for WooCommerce** plugin
2. Klaviyo syncs WooCommerce customers and orders, enabling the same RFM segments described for Shopify above
3. Go to **Klaviyo → Analytics → Cohort Analysis** to see retention curves and predicted CLV by acquisition date

---

#### BigCommerce

1. **BigCommerce Customer Groups:** Go to **Customers → Customer Groups** — create groups based on purchase history, spend thresholds, and geographic criteria
2. Install **Glew.io** from the BigCommerce App Marketplace — provides cohort retention analysis, RFM scoring, and CLV by acquisition channel
3. Install **Klaviyo** for BigCommerce for behavioral email segmentation and lifecycle automation

---

### Step 3: Analyze purchase frequency and retention

**Purchase frequency distribution (using any platform's export):**

Export your customer order data to a CSV or Google Sheet and calculate:
- What % of customers have placed exactly 1 order?
- What % have placed 2–3 orders?
- What % have placed 4+ orders?

Industry benchmarks:
- Typical DTC brand: 60–70% of customers are one-time buyers
- Healthy subscription or consumable brand: 40–50% of customers reorder within 90 days
- Your second-purchase rate (% of first-time buyers who place a second order within 90 days) is the single most important leading indicator of long-term CLV

**Cohort retention analysis:**

A cohort retention grid shows what percentage of customers acquired in month X are still buying at months 1, 3, 6, 12:

- **Shopify + Lifetimely:** Available natively in the **Cohorts** view
- **Klaviyo:** Available under **Analytics → Cohort Analysis**
- **Metorik:** Available under **Reports → Cohorts**
- **Manual (any platform):** Export all orders to Google Sheets; create a pivot table with acquisition month as rows and "months since first order" as columns

**What good retention looks like:**
| Months After First Order | Minimum Viable | Healthy | Excellent |
|--------------------------|---------------|---------|-----------|
| Month 1 (second purchase rate) | 15% | 25% | 40%+ |
| Month 3 retention | 10% | 20% | 35%+ |
| Month 12 retention | 5% | 15% | 30%+ |

### Step 4: Identify at-risk customers and act

**At-risk customer identification:**

The simplest at-risk definition: customers who previously ordered multiple times but have not ordered in longer than their typical interval.

- **Shopify Segments:** `number_of_orders > 1 AND days_since_last_order > 90`
- **Klaviyo:** Create a "Winback" segment: "Has placed more than 1 order" AND "Has not placed an order in the last 90 days"
- **Metorik:** Use the "Customers at risk of churning" pre-built filter

**Action by segment:**

| Segment | Recommended Action |
|---------|-------------------|
| Champions (recent, frequent, high-spend) | Invite to VIP program; early access to new products |
| Loyal but cooling (frequent but not recent) | Targeted win-back email with personalized product recommendations |
| At risk (inactive > 90 days, multiple prior orders) | Win-back sequence: reminder → small incentive → final offer |
| One-time buyers | Second purchase campaign; show complementary products |
| Lost (inactive > 180 days) | Low-cost re-engagement attempt; if no response, suppress to reduce email costs |

## Best Practices

- **Run RFM scoring monthly** — customer order history changes continuously; stale segments lead to wrong targeting
- **Track second-purchase rate as a leading indicator** — the conversion from one-time to repeat buyer is the highest-leverage retention metric; it predicts CLV far in advance of any LTV model
- **Segment CLV by acquisition channel** — customers from organic search, paid social, and email/SMS referrals often have dramatically different LTVs; measure them separately to inform budget allocation
- **Build alerts for segment migration** — when the "at risk" segment grows week over week, it signals a retention problem needing immediate action; set up alerts in Klaviyo or Lifetimely
- **Flag seasonal buyers separately** — customers who only buy in Q4 should not be marked as churned in Q2; apply a seasonal buyer tag before running churn analysis

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| RFM segments shift dramatically after a sale event | Use a rolling 90-day window for scoring; recent sales spikes should not permanently elevate scores for customers who only responded to a discount |
| Acquisition channel CLV analysis not accounting for multi-touch | Use first-touch attribution for CLV by channel — the channel that introduced the customer, not the channel that converted the last order |
| Cohort retention shows 0% after month 6 | Check whether the query or export is filtering out cohorts that do not have 6 months of data yet; exclude cohorts acquired in the last 6 months from long-term retention views |
| Customer count in segments does not match email list size | Some customers in your store may not be subscribed to email; segment by customer (order-based) separately from email list (consent-based) |
| Win-back campaigns going to customers who bought recently | Ensure segment filters are current — sync order data before running segment exports; stale data causes emails to go to wrong contacts |

## Related Skills

- @customer-segmentation
- @attribution-modeling
- @sales-reporting-dashboard
- @ab-testing-ecommerce
- @unit-economics-tracking
