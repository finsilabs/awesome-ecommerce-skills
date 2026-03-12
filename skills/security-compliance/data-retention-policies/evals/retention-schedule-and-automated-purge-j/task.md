# Implement Data Retention for an E-Commerce Backend

## Problem/Feature Description

A fast-growing online marketplace has been accumulating data since launch without any formal data cleanup process. The engineering team has been asked by legal and compliance to implement a proper data retention system before an upcoming SOC 2 audit. The platform stores customer sessions, abandoned shopping carts, browsing history, fraud detection logs, analytics events, and customer account records in a PostgreSQL database.

The legal team has reviewed applicable regulations (US tax law, EU VAT, GDPR) and signed off on a retention policy document. Engineering needs to translate this into running code: a TypeScript module that defines the retention schedule and a nightly background job that enforces it. The compliance team specifically needs evidence that the jobs are actually running and purging data — they want an audit trail they can show to auditors.

The system must be safe for production: it cannot lock database tables during business hours, and it must handle large tables gracefully without timing out.

## Output Specification

Produce a TypeScript implementation with the following files:

- `lib/data-retention/schedule.ts` — defines the retention schedule as a typed constant
- `jobs/data-retention.ts` — the nightly retention job runner (cron scheduling, all purge functions, execution tracking)
- `README.md` — a brief explanation of the cron schedule chosen and the approach used to avoid database table locks

The output does **not** need to compile or connect to a real database — stub the `db` and `CronJob` imports as needed. Focus on the logic, structure, and configuration values.
