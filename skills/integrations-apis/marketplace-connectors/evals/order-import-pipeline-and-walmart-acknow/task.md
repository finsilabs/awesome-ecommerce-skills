# Marketplace Order Import Pipeline

## Problem/Feature Description

A fashion retailer receives orders from Amazon and Walmart Marketplace in addition to their own website. Currently, their operations staff checks each marketplace portal manually and copies orders into their internal order management system (OMS) — a tedious process that causes fulfillment delays and occasionally results in Walmart seller performance warnings due to late order acknowledgment.

The team needs an automated order import pipeline that runs on a schedule and pulls new orders from both Amazon and Walmart into the internal OMS. The system must handle the fact that repeated polling runs may encounter orders already imported in a previous run. It also needs to handle Walmart's strict SLA requirements — Walmart penalizes sellers who fail to acknowledge orders promptly. The team is particularly concerned about a scenario where an acknowledgment failure goes unnoticed for hours.

## Output Specification

Produce a TypeScript project with:

- `src/amazon/orders.ts` — Module that fetches new Amazon orders and maps them to an internal order format
- `src/walmart/orders.ts` — Module for acknowledging Walmart orders with correct headers and request format
- `src/pipeline/poller.ts` — Polling orchestrator that runs on a schedule, deduplicates orders, and enqueues them for processing
- `src/walmart/monitor.ts` — Monitor module that checks for Walmart orders not yet acknowledged and can trigger alerts
- `package.json` — Package manifest

Write `PIPELINE_NOTES.md` explaining how the pipeline handles duplicate order imports and why the Walmart acknowledgment flow is designed the way it is.

Use environment variable references for all credentials. Implement the full logic without making real API calls.
