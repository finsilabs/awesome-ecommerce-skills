# Build Compliance Export and Audit Chain Verification Tooling

## Problem/Feature Description

A retail ecommerce company's finance team has received a request from external auditors for a complete export of all financial events from the last quarter. In parallel, the security team has become suspicious that a database administrator may have altered historical payment records following a revenue discrepancy between the platform's records and the payment processor's settlement report. They need a way to programmatically verify whether any stored audit events have been tampered with.

The company already has a `financial_audit_events` table (PostgreSQL) with columns including `seq` (BIGSERIAL), `occurred_at`, `event_type`, `aggregate_type`, `aggregate_id`, `actor_id`, `actor_ip`, `before_state` (JSONB), `after_state` (JSONB), `delta` (JSONB), `hash` (VARCHAR), `prev_hash` (VARCHAR), `correlation_id`, and `metadata`. The `hash` column was populated at insert time using a deterministic formula over event fields. The engineering team wants two things built: a compliance export function and a chain integrity verification system that can be scheduled to run automatically.

Your implementation should be production-ready TypeScript. The `db` abstraction is already available in scope.

## Output Specification

Produce the following TypeScript files:

- `audit-export.ts` — a function that exports audit events for a given date range in multiple output formats, with appropriate columns for auditor review
- `audit-verify.ts` — a function that verifies the tamper-detection chain for a given aggregate and returns a detailed report of any discrepancies found
- `audit-integrity-job.ts` — a scheduled job that runs the integrity check across recent events and handles the results appropriately

Also produce `implementation-notes.md` (max 1 page) explaining: the hash verification approach, how you handle high event volumes in the export, and how the scheduled job is intended to be deployed.

You do not need to implement the `db` layer or run any code — produce the TypeScript source files only.
