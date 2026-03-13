# Invoice Ingestion and Three-Way Matching Engine

## Problem/Feature Description

A wholesale distributor has just gone live with a new procurement system that generates structured purchase orders and goods receipt records. Their AP team is drowning in PDF invoices arriving via email from over 200 active vendors. They need a TypeScript module that can automatically ingest invoices from an email inbox, match them against the corresponding purchase orders and goods receipts, and flag discrepancies for human review — all without requiring the AP clerks to manually key in data or hunt down receipts.

The operations manager has identified a few tricky edge cases from their old system: vendors occasionally send invoices in EUR or GBP rather than USD, and in the past the team would convert to USD before saving — leading to reconciliation headaches when the conversion rate changed. Some vendors also send invoices with slightly different unit prices than the PO (e.g., a $10,001 invoice on a $10,000 PO due to rounding) that shouldn't block payment. The matching logic needs to be robust: it should compare quantities received against invoice quantities line-by-line, check for unit price consistency against the PO, and produce clear exception messages when something doesn't match. Once an invoice is approved, the record should be considered immutable — any correction must go through a formal void-and-reissue process rather than allowing quiet edits.

## Output Specification

Write a TypeScript file named `ap_matching.ts` that implements the following functions. You do not need a working runtime — write the logic clearly enough that a reviewer can assess correctness.

- `ingestInvoiceFromEmail(email: EmailMessage): Promise<void>` — extracts invoice data from PDF/image attachments, resolves the vendor by email domain or extracted vendor name, flags unknown vendors for manual review, and persists the invoice with the correct due date computed from the vendor's payment terms
- `performThreeWayMatch(invoiceId: string): Promise<MatchResult>` — matches an invoice against its PO and goods receipt, applying appropriate tolerance logic, and returns a structured result with status and exception list
- `lockInvoiceAfterApproval(invoiceId: string): Promise<void>` — enforces immutability of key invoice fields post-approval

Include TypeScript interfaces for all relevant data shapes. Add inline comments explaining any non-obvious decisions in the matching logic.
