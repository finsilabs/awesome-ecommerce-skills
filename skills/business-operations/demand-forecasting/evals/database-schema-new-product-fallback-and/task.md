# Demand Forecasting Data Layer and Model Health Monitoring

## Problem/Feature Description

A fast-growing online marketplace is building the foundational data infrastructure for an automated demand forecasting system. Their transactional database stores orders in an `orders` table and line items in an `order_lines` table. Before any machine-learning or statistical forecasting can run, the engineering team needs a reliable daily aggregation layer that feeds those models — one that can handle the real-world messiness of order cancellations and refunds without inflating demand numbers.

The marketplace also faces two operational challenges. First, they frequently launch new products that have very little sales history — the forecasting model can't decompose a product's demand if it was listed only two weeks ago, yet the system still needs to make some inventory recommendation for it. Second, the forecasting team has seen accuracy drift over time on some products and wants a monthly health check that automatically flags any SKU whose model is performing poorly, so that planners can manually intervene rather than blindly trust bad predictions.

## Output Specification

Produce the following files:

1. `schema.sql` — PostgreSQL DDL that sets up the data aggregation layer, including the materialized view and any supporting objects
2. `refresh_job.sh` — A shell script (or cron-compatible command) that performs the nightly refresh of the aggregation layer
3. `forecast_service.ts` — A TypeScript module that implements:
   - A function to determine whether a product has enough history to run the standard decomposition model, and what fallback to use when it doesn't
   - A function to compute monthly forecast accuracy for a given product using provided actual vs. forecast data, and return a health status based on whether the model needs recalibration
4. `accuracy_report.json` — Run the MAPE computation against the sample data below and write the results

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/category_stats.json ===============
{
  "categories": [
    {
      "category_id": "CAT-ELECTRONICS",
      "avg_daily_demand": 8.4,
      "seasonal_indices": [0.82, 0.91, 0.95, 1.02, 1.08, 1.31, 1.24]
    },
    {
      "category_id": "CAT-APPAREL",
      "avg_daily_demand": 22.1,
      "seasonal_indices": [0.78, 0.88, 0.93, 1.05, 1.12, 1.38, 1.19]
    },
    {
      "category_id": "CAT-HOME",
      "avg_daily_demand": 5.2,
      "seasonal_indices": [0.85, 0.90, 0.97, 1.01, 1.06, 1.25, 1.15]
    }
  ]
}

=============== FILE: inputs/products_meta.json ===============
[
  { "id": "SKU-NEW-001", "name": "Smart Watch Band", "category_id": "CAT-ELECTRONICS", "first_sale_date": "2026-02-15" },
  { "id": "SKU-NEW-002", "name": "Running Shorts", "category_id": "CAT-APPAREL", "first_sale_date": "2026-01-10" },
  { "id": "SKU-EST-003", "name": "Coffee Table", "category_id": "CAT-HOME", "first_sale_date": "2024-06-01" }
]

=============== FILE: inputs/forecast_actuals.json ===============
{
  "month": "2026-02",
  "products": [
    {
      "productId": "SKU-EST-003",
      "daily_records": [
        {"date": "2026-02-01", "actual": 5, "forecast": 4.8},
        {"date": "2026-02-02", "actual": 3, "forecast": 4.2},
        {"date": "2026-02-03", "actual": 8, "forecast": 6.1},
        {"date": "2026-02-04", "actual": 7, "forecast": 7.3},
        {"date": "2026-02-05", "actual": 6, "forecast": 5.9},
        {"date": "2026-02-06", "actual": 4, "forecast": 4.5},
        {"date": "2026-02-07", "actual": 9, "forecast": 7.8},
        {"date": "2026-02-08", "actual": 5, "forecast": 5.1},
        {"date": "2026-02-09", "actual": 3, "forecast": 4.0},
        {"date": "2026-02-10", "actual": 11, "forecast": 7.2},
        {"date": "2026-02-11", "actual": 7, "forecast": 7.5},
        {"date": "2026-02-12", "actual": 6, "forecast": 5.8},
        {"date": "2026-02-13", "actual": 4, "forecast": 4.6},
        {"date": "2026-02-14", "actual": 15, "forecast": 8.0}
      ]
    }
  ]
}
