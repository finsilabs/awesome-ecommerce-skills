# Competitor Price Monitor and Price Audit Trail

## Problem/Feature Description

PriceWatch is a B2B SaaS product that helps online retailers track competitor prices and maintain a complete audit trail of every price change for regulatory compliance. A new client in the EU needs two things: (1) a module that can scrape live prices from competitor product pages given a CSS selector and URL, discarding any data older than a certain freshness threshold; and (2) a PostgreSQL schema and corresponding data-access layer that records every price change with enough detail to support rollback, compliance audits, and volatility analytics. The scheduler should run frequently during store operating hours and be idle overnight.

The scraping module must handle pages that display prices in various formats like `$1,299.00`, `€ 899`, or `1299.00` and convert them to integer cents for consistent internal storage.

## Output Specification

Produce the following files:

1. `competitor-monitor.ts` — The competitor price fetching module. It should export a function that accepts a list of competitor configurations (each with a competitor name, product page URL, and CSS price selector) and returns parsed competitor prices. Include the parsePriceCents helper. Include staleness filtering so prices fetched more than 4 hours ago are excluded from results.

2. `schema.sql` — PostgreSQL DDL for the price history table, including the index needed for efficient per-product price history lookups.

3. `price-history.ts` — A data-access module that exports a function to record a price change (accepting old price, new price, product ID, and reason) using a database transaction, and also calls a search index update after the transaction.

4. `scheduler.ts` — Sets up the cron schedule for the pricing job. Should include a comment explaining when the job runs.

## Input Files

No additional input files are provided. Implement all files from scratch.
