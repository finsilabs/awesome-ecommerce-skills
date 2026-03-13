# Marketing Spend Efficiency Audit Tool

## Problem/Feature Description

Northbrook Goods is a direct-to-consumer home goods brand that has been growing rapidly over the past two years across three acquisition channels: paid social (Meta/TikTok), Google Search, and an influencer affiliate program. The CFO is preparing for a Series B pitch and has asked the growth team to produce a rigorous analysis of whether their customer acquisition spending is actually efficient. In past fundraises, investors pushed back hard on the CAC figures because the team was only counting ad spend — they want to avoid that conversation this time.

The team also wants to operationalize their budget planning. Right now, channel managers can increase budgets freely as long as they hit volume targets, but leadership suspects they may be overpaying for some channels relative to what those customers are actually worth. They want hard limits baked into the planning process, and an alert mechanism so the finance team knows when acquisition costs are drifting.

## Output Specification

Build a Python script (`cac_audit.py`) that accepts the sample cost data below and produces a JSON report (`cac_report.json`) containing:

- CAC figures for each channel and in aggregate, broken down by cost component
- Channel-level and blended metrics for each period in the input data
- A channel-level budget guardrail calculation given a target LTV:CAC ratio (use 3.0 as the target)
- A trend analysis across periods, including any warning flags for significant cost increases
- A health assessment for each channel based on standard industry benchmarks

The script should print a human-readable summary to stdout and write the full results to `cac_report.json`.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/cost_data.json ===============
{
  "ltv_by_channel": {
    "paid_social": 185.00,
    "google_search": 210.00,
    "influencer": 145.00
  },
  "periods": [
    {
      "period": "2025-Q3",
      "channels": {
        "paid_social": {
          "media_spend": 42000,
          "agency_fees": 5000,
          "marketing_tech_costs": 1200,
          "marketing_payroll_allocated": 8000,
          "first_order_discount_cost": 3100,
          "new_customers_paid": 310,
          "new_customers_organic": 95
        },
        "google_search": {
          "media_spend": 28000,
          "agency_fees": 2500,
          "marketing_tech_costs": 800,
          "marketing_payroll_allocated": 4500,
          "first_order_discount_cost": 900,
          "new_customers_paid": 210,
          "new_customers_organic": 0
        },
        "influencer": {
          "media_spend": 15000,
          "agency_fees": 3000,
          "marketing_tech_costs": 400,
          "marketing_payroll_allocated": 2500,
          "first_order_discount_cost": 2200,
          "new_customers_paid": 180,
          "new_customers_organic": 30
        }
      }
    },
    {
      "period": "2025-Q4",
      "channels": {
        "paid_social": {
          "media_spend": 51000,
          "agency_fees": 5500,
          "marketing_tech_costs": 1200,
          "marketing_payroll_allocated": 8000,
          "first_order_discount_cost": 4200,
          "new_customers_paid": 325,
          "new_customers_organic": 88
        },
        "google_search": {
          "media_spend": 34000,
          "agency_fees": 2500,
          "marketing_tech_costs": 800,
          "marketing_payroll_allocated": 4500,
          "first_order_discount_cost": 980,
          "new_customers_paid": 215,
          "new_customers_organic": 0
        },
        "influencer": {
          "media_spend": 18500,
          "agency_fees": 3200,
          "marketing_tech_costs": 400,
          "marketing_payroll_allocated": 2500,
          "first_order_discount_cost": 2700,
          "new_customers_paid": 172,
          "new_customers_organic": 28
        }
      }
    }
  ]
}
