# Management Dashboard: Metrics and Drill-Down Module

## Problem/Feature Description

Apex Brands operates an ecommerce business across three channels: a direct-to-consumer website, Amazon, and a wholesale B2B portal. Their CFO uses a static Google Sheet to track monthly KPIs and has asked for a real-time dashboard replacing it. The executive team wants a single "scorecard" view at the top of the dashboard showing the most important financial health metrics, with the ability to click through to channel-level or category-level breakdowns.

The engineering team has already built the `financial_facts` database table (with columns: `fact_id`, `fiscal_period`, `statement_type`, `line_item`, `channel`, `product_category`, `geography`, `amount`, `version`). They now need to build the Python module that defines the KPI queries and the drill-down query builder. The head of FP&A has also asked the team to document which chart type should be used for each financial view, as the frontend team will implement these in a separate sprint. Finally, the CFO noted that she sometimes opens the dashboard and can't tell if the numbers are from this morning or last week, so there should be a clear indication of data currency.

## Output Specification

Produce a Python file `dashboard_metrics.py` that includes:
- A `FINANCIAL_KPIS` list/structure defining the headline KPI cards with their SQL queries, formatting, and comparison configuration
- A `build_pnl_query(filters: dict) -> str` function that dynamically constructs a filtered P&L SQL query
- A `VISUALIZATION_SPEC` dictionary or equivalent structure mapping each financial statement view to the recommended chart type and any relevant notes

Also produce a `dashboard_spec.md` that describes the data freshness strategy (how and where the last-updated timestamp will be displayed) and explains how percentage metrics will be presented alongside absolute values in the UI.

The implementation should work against a PostgreSQL database using the `financial_facts` schema described above.
