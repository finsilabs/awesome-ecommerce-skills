# Payment Reconciliation Database Schema and Alerting System

## Problem/Feature Description

Paylens, a fintech company processing payments for e-commerce merchants, is building a new payment reconciliation platform from scratch. Their CTO has approved the project and the first sprint covers two things: defining the database schema that will store all reconciliation data, and building the alerting system that notifies the finance team when discrepancies are detected.

The finance team has shared their requirements: they need the database to track not just whether a transaction was matched, but the quality of each match, who resolved any discrepancies, and when. For alerting, they want immediate notifications for large individual discrepancies, daily summary emails, and they want Slack alerts routed to the dedicated finance monitoring channel that their treasury team watches around the clock. The team is also aware that processor fees are billed differently from individual transactions (often as aggregated monthly charges), and wants the system designed to handle fee reconciliation as a distinct concern.

## Output Specification

Produce the following files:

- `schema.sql` — Complete SQL schema for the reconciliation database
- `alerting.js` — The alerting module implementation
- `SCHEMA_NOTES.md` — Brief notes explaining the schema design decisions, including how match quality is tracked and how exception resolution is audited

The SQL schema should be self-contained and executable. The alerting code should reference environment variables for credentials but include all logic inline.
