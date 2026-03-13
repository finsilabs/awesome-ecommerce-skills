---
name: sales-reporting-dashboard
description: "Build executive dashboards showing revenue, average order value, conversion rates, and cohort analysis with drill-down by date and channel"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [analytics, dashboard, revenue, aov, conversion, cohort, reporting, sql, data-visualization]
triggers: ["sales dashboard", "revenue reporting", "sales reporting", "AOV dashboard", "conversion dashboard", "cohort analysis dashboard", "ecommerce analytics dashboard"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Sales Reporting Dashboard

## Overview

A sales reporting dashboard surfaces the metrics that matter most to an ecommerce operation: revenue, orders, average order value (AOV), conversion rate, and trend comparisons. Having a single source of truth for these metrics — accessible to the whole team and automatically up to date — replaces manual spreadsheet reports and gives operators the data they need for daily decisions.

This skill guides you through building a sales reporting dashboard using your platform's built-in tools, BI apps, and data connections.

## When to Use This Skill

- When the business needs a single source of truth for daily/weekly revenue reporting
- When building an internal analytics dashboard to replace manual spreadsheet reports
- When implementing time-comparison metrics (week-over-week, month-over-month, year-over-year)
- When product managers need category and channel drill-down beyond top-level revenue
- When building an executive dashboard that surfaces GMV, conversion rate, and AOV trends
- When integrating with a BI tool (Metabase, Looker Studio) via an API or direct database views

## Core Instructions

### Step 1: Choose your reporting tool by platform

| Platform | Tool | Best For |
|----------|------|---------|
| **Shopify** | **Shopify Analytics** (built-in) | Revenue, orders, AOV, conversion rate; free; real-time; sufficient for most merchants |
| **Shopify** | **Shopify + Google Looker Studio** (free) | Custom visual dashboards; combine Shopify data with GA4 and ad platform data |
| **Shopify** | **Polar Analytics** or **Triple Whale** | Multi-channel dashboards; profit metrics; automated daily digest emails |
| **WooCommerce** | **WooCommerce Analytics** (built-in) | Revenue, orders, products, customers; free; available in WooCommerce 3.5+ |
| **WooCommerce** | **Metorik** | Advanced filtering, cohort analysis, customer segments; best WooCommerce analytics tool |
| **BigCommerce** | **BigCommerce Analytics** (built-in) | Sales overview, product performance, customer metrics |
| **BigCommerce** | **Glew.io** | Advanced cohort retention, channel drill-down, and executive dashboards |
| **All platforms** | **Google Analytics 4** | Conversion funnel, traffic sources, session-based metrics; free; pairs with any platform |

### Step 2: Set up your core sales reporting dashboard

---

#### Shopify

**Built-in Shopify Analytics (start here):**

1. Go to **Analytics → Overview** — the default dashboard shows:
   - Today's total sales, orders, and sessions in real time
   - Conversion rate for the current day vs. prior period
   - AOV trend
   - Top products by revenue
2. Go to **Analytics → Dashboards** — Shopify lets you create custom dashboards:
   - Click **+ Add report** to add tiles for any built-in report metric
   - Recommended tiles: Total sales, Net sales, Orders, Conversion rate, AOV, Top products, Sales by channel, Sales by location
3. Go to **Analytics → Reports** for all available reports:
   - **Sales over time:** Revenue by day/week/month with period comparison
   - **Sales by product:** Top products by revenue and units sold
   - **Sales by channel:** Revenue breakdown by sales channel (online store, POS, draft orders, etc.)
   - **Sales by traffic source:** Revenue by UTM source/medium (last-click)
   - **Average order value over time:** AOV trend with comparison
   - **Returning customer rate:** New vs. returning customer ratio
4. All reports export to CSV for further analysis

**Setting up a Shopify + Looker Studio dashboard (free, for custom visualization):**

1. Go to **Looker Studio** at [lookerstudio.google.com](https://lookerstudio.google.com)
2. Add a data source: select **Google Sheets**
3. In Google Sheets, set up a connection to Shopify using **Sheets for Shopify** app or by scheduling CSV exports from Shopify Analytics
4. Build your dashboard in Looker Studio: add scorecards for key metrics, time-series charts for revenue trend, bar charts for channel breakdown
5. Share the dashboard URL with your team — refreshes automatically when the Google Sheet updates

---

#### WooCommerce

**WooCommerce Analytics (built-in):**

1. Go to **WooCommerce → Analytics → Overview** — shows revenue, orders, items sold, and refunds for the selected date range with period comparison
2. Go to **WooCommerce → Analytics → Revenue** — detailed revenue breakdown: gross sales, returns, coupons, net revenue, taxes, shipping by day
3. Go to **WooCommerce → Analytics → Orders** — order count, average order value, refund rate by day
4. Go to **WooCommerce → Analytics → Products** — revenue and units sold by product
5. Go to **WooCommerce → Analytics → Categories** — revenue and units by product category
6. All WooCommerce Analytics reports export to CSV

**Metorik (advanced WooCommerce dashboards):**

1. Connect Metorik to your WooCommerce store
2. Go to **Metorik → Dashboard** — real-time revenue, orders, and customer metrics with period comparison
3. Go to **Metorik → Reports → Revenue** — revenue by day/week/month; compare any two custom date ranges
4. Go to **Metorik → Reports → Products** — revenue, units, refunds by product
5. Go to **Metorik → Reports → Customers → Cohorts** — monthly cohort retention matrix showing what % of each acquisition cohort is still buying
6. Set up **Metorik Digest emails** — automated daily or weekly summary emails sent to your team

---

#### BigCommerce

1. Go to **Analytics → Store Overview** — shows revenue, orders, conversion rate, and AOV for the selected period with trend chart
2. Go to **Analytics → Purchase Funnel** — shows session-to-order conversion funnel: sessions → product views → add to cart → purchase
3. Go to **Analytics → Products** → **Analytics → Merchandising → Products** — revenue and units by product
4. Go to **Analytics → Customers** — new vs. returning customer breakdown, customer lifetime value
5. For advanced dashboards: install **Glew.io** from the BigCommerce App Marketplace — pre-built executive sales dashboard with channel comparison, cohort retention, and automated weekly digest emails

---

### Step 3: Build the key metrics your dashboard must answer

Regardless of tool, your sales dashboard should answer these questions at a glance:

**Daily check (5-minute morning review):**
- Revenue today vs. same day last week (and same day last year for seasonal businesses)
- Order count today vs. prior
- Conversion rate today vs. 7-day average (significant drops usually indicate a site issue)

**Weekly review:**
- Revenue this week vs. prior week vs. same week last year
- AOV trend (is it stable, growing, or declining?)
- Top 10 products by revenue and units sold this week
- Channel breakdown: website vs. Amazon vs. wholesale revenue share

**Monthly executive summary:**
- Total net revenue vs. budget
- Gross margin % (if COGS is tracked in platform)
- New customer revenue vs. returning customer revenue
- Cohort retention: what % of last month's new customers have placed a second order?

### Step 4: Set up period-over-period comparison

All platform analytics tools support date range comparison. Here is how to configure it:

- **Shopify:** In any report, click the date range picker → select **Compare to** → choose Prior period, Prior year, or Custom
- **WooCommerce Analytics:** The date range selector includes a comparison toggle; select "Previous period" or "Previous year"
- **Metorik:** Every chart has a "Compare" button that adds a prior-period line to the chart
- **Google Analytics 4:** Date range picker includes a comparison checkbox; select "Preceding period" or "Same period last year"
- **Looker Studio:** Add date range control to the dashboard; use "Comparison date range" in the control to enable period comparison

### Step 5: Add channel and category drill-down

**Channel drill-down:**
- **Shopify:** Analytics → Sales by traffic source (shows revenue by UTM source/medium)
- **WooCommerce:** Metorik → Reports → UTM (shows orders and revenue by utm_source, utm_medium)
- **BigCommerce:** Analytics → Marketing → Campaigns (shows revenue attributed to marketing campaigns)
- **All platforms:** GA4 → Monetization → Ecommerce purchases → filter by "Session source/medium"

**Category drill-down:**
- **Shopify:** Analytics → Sales by product type (shows revenue by product type/collection)
- **WooCommerce:** WooCommerce Analytics → Categories (built-in)
- **BigCommerce:** Analytics → Merchandising → Categories

## Best Practices

- **Cache or pre-aggregate for large date ranges** — revenue queries over 90+ days on large stores can be slow; use pre-built aggregate reports in Shopify Analytics or Metorik rather than exporting raw order data
- **Always filter cancelled orders** — including cancelled orders inflates GMV and skews AOV; all platform analytics tools exclude cancelled orders by default; verify this in custom SQL or exports
- **Separate GMV from net revenue** — GMV (gross merchandise value) includes full selling price before discounts; net revenue is after discounts and refunds; report both explicitly and label clearly
- **Provide period-over-period context for every KPI** — a $50K revenue day is meaningless without knowing whether it is up or down vs. last week
- **Use consistent time zones** — store all timestamps in UTC and apply timezone conversion only in reporting; mixed timezone data creates apparent revenue discrepancies
- **Build one authoritative source of truth** — if the marketing team uses GA4 revenue and the finance team uses Shopify Analytics revenue, they will often show different numbers (attribution timing, tax inclusion differences); agree on one source per metric

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Dashboard shows different revenue than payment processor | Reconcile by comparing order subtotal against Stripe/PayPal payouts; differences come from multi-currency, refund timing, or fee deduction |
| Conversion rate looks artificially low | Ensure session tracking includes anonymous visitors; GA4 by default tracks all sessions; platform analytics may only count sessions that hit certain pages |
| AOV inflated by bulk/wholesale orders | Add a filter to exclude orders above a threshold (e.g., >$5,000) from AOV calculations; analyze wholesale orders separately |
| Revenue appears in wrong time period | Confirm whether your platform recognizes revenue at order placement or fulfillment; Shopify reports order date, not fulfillment date; align with your accounting recognition policy |
| Weekly reports show inconsistent totals | Use the same date range definition (e.g., Monday–Sunday) consistently; avoid reporting partial weeks against full-week comparisons |

## Related Skills

- @product-analytics
- @customer-analytics
- @attribution-modeling
- @financial-analytics-dashboard
- @ab-testing-ecommerce
