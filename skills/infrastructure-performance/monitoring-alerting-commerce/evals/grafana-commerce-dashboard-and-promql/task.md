# Build a Commerce Observability Dashboard

## Problem/Feature Description

An e-commerce company's SRE team recently inherited monitoring responsibilities for a headless storefront. Their Grafana instance is connected to a Prometheus data source that already scrapes metrics from the storefront — including checkout funnel counters (checkout_started_total, checkout_completed_total, checkout_abandoned_total), payment counters (payment_successes_total, payment_failures_total with a `decline_code` label), and an order creation latency histogram (order_creation_duration_ms_bucket). The team wants a single Grafana dashboard that gives both engineers and business stakeholders immediate visibility into commerce health.

The current situation: engineers waste 10–15 minutes during incidents piecing together whether a drop in orders is a technical failure or a business trend, because there is no unified view. Business stakeholders meanwhile have no real-time visibility and rely on daily sales reports. The SRE team needs a dashboard that surfaces both technical reliability signals and business KPIs in one place, making it immediately obvious whether an anomaly is a technical problem or a business event.

## Output Specification

Produce a Grafana dashboard JSON file named `commerce-dashboard.json` that can be imported into a Grafana instance.

Also produce a `dashboard-notes.md` file that:
- Lists each panel in the dashboard with its panel type (e.g., gauge, time series, pie chart, stat)
- Documents the PromQL query used for each panel

The dashboard JSON should be valid Grafana dashboard format (version 6+). Panel visualization types matter — choose the appropriate visualization for each metric type.
