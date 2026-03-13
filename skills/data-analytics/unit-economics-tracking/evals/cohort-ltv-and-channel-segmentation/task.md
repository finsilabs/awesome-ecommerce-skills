# Customer Cohort Profitability Analysis

## Problem/Feature Description

Verdana Skincare has been running for three years and acquired customers through three channels: paid social advertising, organic/SEO traffic, and an email referral program. The VP of Marketing believes paid social is their most valuable channel based on volume, but the CFO suspects that organic customers spend more over time and may actually be worth more. They've been having the same debate for six months without resolution because nobody has built the analysis to settle it.

There's a secondary complication: the company ran two large win-back campaigns in 2024 targeting customers who hadn't purchased in over 9 months, offering 30% discounts to re-engage them. Some of these reactivated customers are now showing up in the "active customer" numbers, and leadership wants to understand whether those win-back investments are paying off or inflating the metrics.

Build a Python analysis tool using the provided transaction data that helps the team understand which customers are truly valuable and how customer quality has evolved across cohorts acquired over different time periods.

## Output Specification

Write a Python script (`cohort_analysis.py`) that processes the provided data and writes a JSON report (`cohort_report.json`) containing:

- LTV analysis broken down by acquisition channel, with separate handling for reacquired customers vs new customers
- Cohort-level cumulative performance at months 1, 3, 6, and 12 after acquisition
- A comparison across cohorts showing whether customer quality is improving or declining over time
- A summary table of channel-level economics

Print a human-readable summary to stdout. Write full results to `cohort_report.json`.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/customers.json ===============
{
  "customers": [
    {"customer_id": "C001", "first_order_date": "2023-01-15", "acquisition_channel": "paid_social", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C002", "first_order_date": "2023-01-22", "acquisition_channel": "organic", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C003", "first_order_date": "2023-02-03", "acquisition_channel": "paid_social", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C004", "first_order_date": "2023-02-14", "acquisition_channel": "email_referral", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C005", "first_order_date": "2023-03-05", "acquisition_channel": "organic", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C006", "first_order_date": "2023-03-18", "acquisition_channel": "paid_social", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C007", "first_order_date": "2023-04-09", "acquisition_channel": "email_referral", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C008", "first_order_date": "2023-04-22", "acquisition_channel": "organic", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C009", "first_order_date": "2023-05-11", "acquisition_channel": "paid_social", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C010", "first_order_date": "2023-06-01", "acquisition_channel": "organic", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C011", "first_order_date": "2024-01-08", "acquisition_channel": "paid_social", "is_reacquired": true, "reactivation_cost": 28.50},
    {"customer_id": "C012", "first_order_date": "2024-01-15", "acquisition_channel": "email_referral", "is_reacquired": true, "reactivation_cost": 22.00},
    {"customer_id": "C013", "first_order_date": "2024-02-05", "acquisition_channel": "paid_social", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C014", "first_order_date": "2024-02-19", "acquisition_channel": "organic", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C015", "first_order_date": "2024-03-07", "acquisition_channel": "paid_social", "is_reacquired": true, "reactivation_cost": 31.00},
    {"customer_id": "C016", "first_order_date": "2024-03-22", "acquisition_channel": "organic", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C017", "first_order_date": "2024-04-14", "acquisition_channel": "email_referral", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C018", "first_order_date": "2024-05-02", "acquisition_channel": "paid_social", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C019", "first_order_date": "2024-05-20", "acquisition_channel": "organic", "is_reacquired": false, "reactivation_cost": 0},
    {"customer_id": "C020", "first_order_date": "2024-06-10", "acquisition_channel": "paid_social", "is_reacquired": false, "reactivation_cost": 0}
  ]
}

=============== FILE: inputs/orders.json ===============
{
  "orders": [
    {"order_id": "O001", "customer_id": "C001", "order_date": "2023-01-15", "gross_revenue": 89.00, "contribution_margin": 38.50},
    {"order_id": "O002", "customer_id": "C001", "order_date": "2023-04-20", "gross_revenue": 112.00, "contribution_margin": 47.00},
    {"order_id": "O003", "customer_id": "C001", "order_date": "2023-08-10", "gross_revenue": 95.00, "contribution_margin": 41.00},
    {"order_id": "O004", "customer_id": "C001", "order_date": "2024-01-05", "gross_revenue": 130.00, "contribution_margin": 55.50},
    {"order_id": "O005", "customer_id": "C002", "order_date": "2023-01-22", "gross_revenue": 75.00, "contribution_margin": 32.00},
    {"order_id": "O006", "customer_id": "C002", "order_date": "2023-03-15", "gross_revenue": 88.00, "contribution_margin": 37.50},
    {"order_id": "O007", "customer_id": "C002", "order_date": "2023-06-02", "gross_revenue": 102.00, "contribution_margin": 44.00},
    {"order_id": "O008", "customer_id": "C002", "order_date": "2023-09-18", "gross_revenue": 91.00, "contribution_margin": 39.00},
    {"order_id": "O009", "customer_id": "C002", "order_date": "2024-02-14", "gross_revenue": 115.00, "contribution_margin": 49.00},
    {"order_id": "O010", "customer_id": "C003", "order_date": "2023-02-03", "gross_revenue": 65.00, "contribution_margin": 27.00},
    {"order_id": "O011", "customer_id": "C003", "order_date": "2023-07-22", "gross_revenue": 78.00, "contribution_margin": 33.00},
    {"order_id": "O012", "customer_id": "C004", "order_date": "2023-02-14", "gross_revenue": 95.00, "contribution_margin": 41.50},
    {"order_id": "O013", "customer_id": "C004", "order_date": "2023-05-08", "gross_revenue": 110.00, "contribution_margin": 47.50},
    {"order_id": "O014", "customer_id": "C004", "order_date": "2023-08-30", "gross_revenue": 88.00, "contribution_margin": 38.00},
    {"order_id": "O015", "customer_id": "C005", "order_date": "2023-03-05", "gross_revenue": 82.00, "contribution_margin": 35.50},
    {"order_id": "O016", "customer_id": "C005", "order_date": "2023-06-14", "gross_revenue": 97.00, "contribution_margin": 42.00},
    {"order_id": "O017", "customer_id": "C005", "order_date": "2023-10-05", "gross_revenue": 110.00, "contribution_margin": 47.50},
    {"order_id": "O018", "customer_id": "C005", "order_date": "2024-03-20", "gross_revenue": 125.00, "contribution_margin": 53.50},
    {"order_id": "O019", "customer_id": "C006", "order_date": "2023-03-18", "gross_revenue": 70.00, "contribution_margin": 29.00},
    {"order_id": "O020", "customer_id": "C006", "order_date": "2023-09-25", "gross_revenue": 85.00, "contribution_margin": 36.50},
    {"order_id": "O021", "customer_id": "C007", "order_date": "2023-04-09", "gross_revenue": 98.00, "contribution_margin": 42.50},
    {"order_id": "O022", "customer_id": "C007", "order_date": "2023-07-18", "gross_revenue": 115.00, "contribution_margin": 49.50},
    {"order_id": "O023", "customer_id": "C007", "order_date": "2023-11-22", "gross_revenue": 102.00, "contribution_margin": 44.00},
    {"order_id": "O024", "customer_id": "C008", "order_date": "2023-04-22", "gross_revenue": 88.00, "contribution_margin": 38.00},
    {"order_id": "O025", "customer_id": "C008", "order_date": "2023-08-14", "gross_revenue": 105.00, "contribution_margin": 45.00},
    {"order_id": "O026", "customer_id": "C008", "order_date": "2024-01-30", "gross_revenue": 118.00, "contribution_margin": 50.50},
    {"order_id": "O027", "customer_id": "C009", "order_date": "2023-05-11", "gross_revenue": 72.00, "contribution_margin": 30.00},
    {"order_id": "O028", "customer_id": "C009", "order_date": "2023-11-08", "gross_revenue": 89.00, "contribution_margin": 38.00},
    {"order_id": "O029", "customer_id": "C010", "order_date": "2023-06-01", "gross_revenue": 91.00, "contribution_margin": 39.50},
    {"order_id": "O030", "customer_id": "C010", "order_date": "2023-09-22", "gross_revenue": 108.00, "contribution_margin": 46.50},
    {"order_id": "O031", "customer_id": "C010", "order_date": "2024-02-08", "gross_revenue": 122.00, "contribution_margin": 52.00},
    {"order_id": "O032", "customer_id": "C011", "order_date": "2024-01-08", "gross_revenue": 68.00, "contribution_margin": 24.50},
    {"order_id": "O033", "customer_id": "C011", "order_date": "2024-05-14", "gross_revenue": 82.00, "contribution_margin": 31.50},
    {"order_id": "O034", "customer_id": "C012", "order_date": "2024-01-15", "gross_revenue": 75.00, "contribution_margin": 30.00},
    {"order_id": "O035", "customer_id": "C013", "order_date": "2024-02-05", "gross_revenue": 58.00, "contribution_margin": 22.50},
    {"order_id": "O036", "customer_id": "C013", "order_date": "2024-06-18", "gross_revenue": 70.00, "contribution_margin": 28.00},
    {"order_id": "O037", "customer_id": "C014", "order_date": "2024-02-19", "gross_revenue": 84.00, "contribution_margin": 36.00},
    {"order_id": "O038", "customer_id": "C014", "order_date": "2024-07-05", "gross_revenue": 98.00, "contribution_margin": 42.00},
    {"order_id": "O039", "customer_id": "C015", "order_date": "2024-03-07", "gross_revenue": 65.00, "contribution_margin": 22.00},
    {"order_id": "O040", "customer_id": "C016", "order_date": "2024-03-22", "gross_revenue": 79.00, "contribution_margin": 34.00},
    {"order_id": "O041", "customer_id": "C017", "order_date": "2024-04-14", "gross_revenue": 92.00, "contribution_margin": 40.00},
    {"order_id": "O042", "customer_id": "C018", "order_date": "2024-05-02", "gross_revenue": 62.00, "contribution_margin": 24.00},
    {"order_id": "O043", "customer_id": "C019", "order_date": "2024-05-20", "gross_revenue": 77.00, "contribution_margin": 33.00},
    {"order_id": "O044", "customer_id": "C020", "order_date": "2024-06-10", "gross_revenue": 55.00, "contribution_margin": 21.00}
  ]
}
