# Multi-Currency Exposure Tracking Infrastructure

## Problem/Feature Description

A UK-based B2B marketplace is expanding into North America and Asia. They process invoices in EUR, USD, GBP, and JPY, but their accounting is in GBP. Their current system has no way to distinguish between a bad sales month and a month where the pound strengthened — FX effects are silently mixed into reported revenue. Their auditors have flagged the lack of structured FX tracking as a control weakness.

The engineering team has been tasked with building the database schema and JavaScript business logic that will underpin the FX exposure management system. The work includes: (a) a PostgreSQL migration script that creates the required tables with appropriate data types and constraints; (b) Node.js functions for recording foreign-currency order exposures at booking time and marking them as settled when payment is received; (c) a month-end revaluation job that computes unrealized gain/loss on all open positions.

## Output Specification

Produce the following files:

1. `schema.sql` — PostgreSQL DDL creating the tables and indexes needed for FX exposure tracking. Include tables for: historical FX rates, per-transaction currency exposures, month-end revaluations, and hedge records.

2. `exposure-tracker.js` — JavaScript module (ES modules) exporting:
   - `recordOrderExposure(order)` — records exposure when an order is created
   - `settleExposure(transactionId, settlementDate, actualFunctionalAmount)` — marks an exposure as settled and records realized gain/loss

3. `revaluation.js` — JavaScript module exporting `runMonthEndRevaluation(revaluationDate)` that computes unrealized gain/loss on all open exposures for each tracked currency.

Assume a Prisma ORM client is available as `import { db } from './lib/db.js'` with models named `currencyExposures`, `fxRevaluations`, and `fxRates`.
