# Design the Financial Audit Trail Database Schema

## Problem/Feature Description

A fintech startup processing payments for marketplace vendors is preparing for its first SOX compliance review. The external auditors have flagged that the company has no reliable record of who changed financial records or when. The CTO has tasked a backend engineer with designing the foundational database schema for a new audit trail system that will capture every financial event — orders, payments, invoices, refunds, and general-ledger postings.

The key requirement from the compliance officer is that the audit record must be trustworthy: once written, no one should be able to quietly alter or delete it, and any tampering should be detectable by examining the data itself. The schema also needs to be practical to query — auditors will want to pull all events for a specific order, see everything a particular staff member did, or export a date-range of events in chronological order, all without full-table scans on a table that will reach hundreds of millions of rows within two years.

The company uses PostgreSQL. There is currently no existing audit infrastructure; you are designing it from scratch.

## Output Specification

Produce a single file `audit-schema.sql` containing:

- The full `CREATE TABLE` statement for the audit events table with all necessary columns and appropriate data types
- All index definitions needed for efficient querying
- The database permission grants that enforce the immutability guarantee
- A brief comment above the permission block explaining the security rationale

Also produce a short `schema-design-notes.md` (max 1 page) summarising the key design decisions you made, including how the schema supports tamper detection and scalability at high event volumes.
