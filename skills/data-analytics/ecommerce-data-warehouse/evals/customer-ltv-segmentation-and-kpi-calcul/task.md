# Customer Analytics Module for Meadow & Mill Subscription Box

## Problem/Feature Description

Meadow & Mill is a subscription box e-commerce company that ships curated artisan goods monthly. Their marketing team is drowning in raw order data but lacking structured customer intelligence. They need two things urgently: a customer lifetime value model to identify their most valuable buyers, and a daily KPI summary their executives can review each morning.

The marketing team wants customers segmented by their purchase behavior so campaigns can be targeted appropriately. They also need customers flagged by how recently they've engaged, so the retention team can prioritize outreach. The predicted lifetime value metric is the centerpiece of their upcoming board presentation — the CFO wants a 24-month revenue forecast per customer based on observed purchase velocity.

The analytics team also needs a daily aggregate model that powers the executive dashboard — showing revenue, margin, and customer mix metrics for each day. The company sells internationally so the per-customer data may come from multiple platforms; the data team wants a mapping layer that ensures each customer is represented by a single canonical key regardless of which channel they came in through.

## Output Specification

Produce the following SQL files (written as dbt-style CTEs or plain SQL — your choice):

- `models/marts/kpi_customer_ltv.sql` — customer lifetime value model with segmentation
- `models/marts/kpi_daily_summary.sql` — daily KPI aggregate model
- `models/marts/dim_customer_identity.sql` — customer identity resolution mapping table
- `analysis-notes.md` — brief documentation explaining the segmentation thresholds, activity status logic, and the LTV formula used

Assume the following base tables/views are available:
- `fct_order_items` — one row per order line item with columns: customer_key, order_id, ordered_at, net_revenue, gross_profit, quantity, discount_amount, is_first_order
- `dim_customers` — customer dimension with: customer_key, customer_id, email, first_name, last_name, country, acquisition_channel, is_current
- `dim_date` — date dimension with: date_key, full_date, day_name, week_of_year, month_name, quarter, year
