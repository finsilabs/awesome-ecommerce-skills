# Checkout Analytics Instrumentation

## Problem/Feature Description

Luminary Goods, a mid-sized direct-to-consumer furniture retailer, has seen their overall store conversion rate dip to 1.4% over the last quarter — well below industry benchmarks. Their marketing team is spending heavily on paid social but cannot tell the CEO which stage of the purchase journey is losing the most customers. The engineering lead has asked you to build the analytics layer that will finally answer this question.

The engineering team uses TypeScript on the frontend and PostgreSQL for their data warehouse. They currently have no step-level funnel instrumentation, no field-level error tracking, and their only conversion signal is a server-side order-confirmed event. They want a complete analytics instrumentation module that tracks each stage of the checkout journey and makes that data queryable.

Your goal is to produce a TypeScript analytics module that tracks each step of the checkout funnel and captures field-level validation failures, along with a SQL report query that surfaces step-to-step drop-off rates from the resulting data. The team's data analyst also wants to know how to reconcile discrepancies if the numbers ever differ between their analytics tool and their internal database.

## Output Specification

Produce the following files:

- `checkout-analytics.ts` — TypeScript module with the funnel step tracking function and the field error instrumentation logic
- `funnel-report.sql` — A PostgreSQL query that reads from a `funnel_events` table and produces a daily drop-off report covering the last 30 days
- `analytics-notes.md` — A short document (bullet points are fine) explaining the analyst's question about reconciling analytics discrepancies between front-end tracking tools and the internal order database
