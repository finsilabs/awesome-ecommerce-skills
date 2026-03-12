# Marketing Channel ROI and Cohort Retention Report

## Problem Description

Trove Market, an online home goods retailer, is heading into its annual marketing budget review. The CMO wants hard data to decide where to invest next year: which acquisition channels are actually bringing in customers who stick around and spend, not just one-time bargain hunters? The analytics team is being asked to produce two analyses: (1) a channel quality comparison showing revenue contribution per acquired customer, and (2) a cohort retention matrix showing what percentage of each month's new customers returned to buy in subsequent months.

The database is PostgreSQL and has four tables: `customers` (id, email, first_name, created_at), `orders` (id, customer_id, created_at, subtotal_cents, status), `order_attribution` (order_id, source), and `customer_rfm_scores` (for materialized scores). Not all orders are valid — cancelled and refunded orders should be excluded. Some customers came in via paid channels, others organically, and some with no tracking data at all.

The team has been burned before by analysis that mixed together channels from very different time periods — a channel that looked great three years ago may now be bringing in low-quality customers. They also want to understand which specific months are showing weak long-term retention so they can investigate what was happening with those cohorts.

## Output Specification

Produce two SQL files:

**`channel_quality.sql`** — Queries CLV by acquisition channel for recently acquired customers, including:
- Acquisition source (with a fallback label for untracked customers)
- Number of customers acquired per channel
- Average and median 12-month revenue per customer
- Average order count per customer
- Repeat purchase rate (percentage who ordered more than once)

**`cohort_retention.sql`** — A monthly cohort retention matrix showing:
- The cohort month (month of first purchase)
- Cohort size
- How many months after first purchase each data point represents
- Count of retained customers and retention percentage at each period
- Only includes cohorts that have had sufficient time to accumulate data (exclude cohorts too recent to have meaningful retention at the period being measured)

Also produce **`analysis_notes.md`** documenting:
- What time window was used for the channel analysis and why
- Whether first-touch or last-touch attribution is used, labeled clearly
- What metric the team should track as the leading indicator of customer lifetime value
