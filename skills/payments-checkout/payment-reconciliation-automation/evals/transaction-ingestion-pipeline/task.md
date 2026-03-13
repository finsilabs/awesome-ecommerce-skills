# Multi-Processor Transaction Ingestion Service

## Problem/Feature Description

FinFlow, a SaaS billing platform processing $2M/month in payments, accepts payments through both Stripe and PayPal. Their finance team currently exports CSV files from each processor manually every morning, but this process is fragile and sometimes pulls incomplete data because transactions from the previous evening haven't fully settled yet. Additionally, when the team re-runs exports to fix missing data, they accidentally create duplicate records in their accounting system.

The engineering team has been asked to build an automated ingestion service that reliably pulls transaction data from both Stripe and PayPal and stores it in a normalized internal database. The service must be safe to re-run multiple times without creating duplicates, and should only pull data that is fully settled to avoid false exception alerts later in the reconciliation pipeline.

## Output Specification

Write the ingestion service as Node.js/JavaScript source files. Produce the following:

- `ingesters/stripe.js` — Stripe transaction ingester
- `ingesters/paypal.js` — PayPal transaction ingester
- `jobs/daily-ingest.js` — Orchestration script that runs both ingesters for the previous day's data
- `IMPLEMENTATION_NOTES.md` — A brief document explaining key design decisions made in the implementation, including which Stripe API endpoints were used and why, how duplicate prevention works, and how the date range for ingestion is determined

The code should reference environment variables for credentials (STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE) but does not need to actually connect to live APIs.
