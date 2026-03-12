# Order Data Cleanup for Tax Compliance

## Problem/Feature Description

A European e-commerce company is preparing for a GDPR compliance review. Their legal team has confirmed that they must retain all order financial records for 7 years to satisfy EU VAT and tax audit requirements — but they are not permitted to hold customer personal information beyond what is strictly necessary. Orders older than 7 years that still contain identifiable customer data need to have that personal information removed, while the underlying financial record must remain intact and accurate.

The engineering team has been asked to write a TypeScript function that processes these old orders. The challenge is that the financial data (amounts, payment method summary, tax figures) is critical for audits and must survive unchanged, while name and address fields should be cleared. The city and country must be preserved for tax jurisdiction purposes. The job may run monthly and must be safe to re-run — it should never double-process a record.

## Output Specification

Produce a TypeScript file `jobs/anonymize-old-orders.ts` that:

- Implements an `anonymizeOldOrders(cutoffDays: number)` function
- Includes stub types/interfaces for `db` and the order model as needed
- Has a brief inline comment explaining why city/country are preserved

The output does not need to compile against a real database driver. Focus on the logic: what fields get cleared, how atomicity is ensured, what prevents re-processing.
