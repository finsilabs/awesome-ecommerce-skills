# Financial Metrics Computation Engine

## Problem/Feature Description

A Series B e-commerce company has a growing analytics team that needs a shared Python library for computing financial KPIs consistently across multiple dashboards and reports. Right now, each analyst writes their own version of the revenue query with slightly different date logic, leading to conflicting numbers in different reports. The VP of Analytics wants to establish a single, reusable metrics engine that handles all date arithmetic, time-series granularity, and period-over-period comparisons — so every dashboard and report pulls from the same logic.

The engine should be able to serve a live operations dashboard (checking how this month is trending vs. last month), a board pack (comparing this quarter to the same quarter last year), and ad hoc analysis (any custom date range). The team also wants the system designed so it can eventually serve data from pre-aggregated snapshot tables rather than live transaction queries — since the dashboards are slow to load when they hit the raw fact table directly.

## Output Specification

Produce a Python module `metrics_engine.py` containing:

1. A KPI registry with at least 3 KPI definitions (e.g. gross_revenue, gross_margin_pct, customer_acquisition_cost).
2. A `FinancialMetricsEngine` class with the following methods:
   - One method for computing a single KPI over a date range, supporting time-series output at configurable time granularity and optional dimension filtering.
   - One method for computing period-over-period comparisons, supporting at least two comparison modes (current period vs. equivalent prior period, and vs. same period one year ago).
3. A `design_notes.md` explaining the data architecture choices — specifically how the engine is designed for a snapshot-based data layer, and how the system would surface data freshness information to dashboard users when the underlying data is stale or unavailable.

Also include a `demo.py` that can be run directly (using SQLite in-memory or pandas) to demonstrate that both methods work correctly with sample data, and prints the results to stdout.
