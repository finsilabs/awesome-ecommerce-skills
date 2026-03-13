# Tax Audit Report Generator

## Problem/Feature Description

BrightCart is a mid-size B2B and B2C ecommerce platform that has just received a sales tax audit notice from the California state tax authority covering the prior fiscal year. The auditor will want to see a complete, reconcilable record of every taxable transaction: what was charged, at what rate, for which customer, and whether any exemptions were applied. The compliance team also needs to confirm that their process for handling B2B customers who claim tax-exempt status is documented and defensible.

The engineering team needs to build a tax audit reporting module that generates a structured transaction-level report from their database of tax records. They also want the implementation to correctly handle the scenario where a B2B customer presents an exemption certificate — the system should check for a valid, active certificate before skipping tax collection, and should log an error gracefully if the third-party tax calculation service is temporarily unavailable (rather than blocking the customer from completing their purchase). Additionally, they want a script that generates a sample CSV-format audit report and demonstrates the correct column formatting.

## Output Specification

Produce the following files:

- `tax-reporting.js` — A module implementing at minimum:
  - A `generateTaxReport({ jurisdiction, startDate, endDate, transactions })` function that takes an array of transaction objects and returns rows (one per transaction) and a summary object
  - A `checkExemptionCertificate(customer, state, certificates)` function that checks whether a valid, active exemption certificate exists for the given customer and state
  - A `calculateTaxSafe(order, taxCalculateFn)` function (or equivalent) that wraps tax calculation with error resilience so checkout is never blocked
- `generate-sample-report.js` — A runnable script that creates sample transaction data and writes a CSV audit report to `audit-report.csv`
- `audit-report.csv` — The CSV output produced by running generate-sample-report.js, containing at least 5 sample rows showing a mix of taxable and exempt transactions, including at least one refunded/voided transaction that should be excluded

The implementation should not require any API keys or external services to run.

## Input Files

The following sample transaction schema is provided for reference. Extract it before beginning.

=============== FILE: inputs/transaction-schema.json ===============
{
  "description": "Shape of a tax transaction record",
  "fields": {
    "id": "uuid",
    "order_id": "uuid",
    "jurisdiction": "string (e.g. 'US-CA', 'US-TX')",
    "tax_type": "string ('sales_tax' | 'vat' | 'gst')",
    "taxable_amount": "decimal",
    "tax_rate": "decimal (e.g. 0.0875 for 8.75%)",
    "tax_amount": "decimal",
    "tax_name": "string",
    "exemption_applied": "boolean",
    "exemption_type": "string | null",
    "provider": "string ('taxjar' | 'avalara' | 'vertex' | 'manual')",
    "provider_transaction_id": "string | null",
    "collected_at": "ISO 8601 timestamp",
    "voided_at": "ISO 8601 timestamp | null",
    "customer": {
      "name": "string",
      "email": "string"
    }
  }
}
