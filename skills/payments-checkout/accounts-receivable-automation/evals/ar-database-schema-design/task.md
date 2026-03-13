# B2B Wholesale Platform: AR Database Schema

## Problem/Feature Description

A wholesale distribution company is building a new B2B ecommerce platform that will serve roughly 300 trade accounts, each with custom payment terms ranging from payment on receipt to 90-day net terms. The finance team currently uses spreadsheets to track who owes what and has been losing invoices and missing follow-ups. The CFO has mandated a proper accounts receivable system before the platform goes live.

You are joining as the backend engineer responsible for designing the database layer. The platform runs PostgreSQL. The finance team needs the system to track invoices through their entire lifecycle, store payment records, manage customer credit limits with automatic enforcement, and support escalation workflows for past-due accounts. The aging report is a critical output — the finance team needs to see outstanding balances bucketed by how many days past-due each customer is.

## Output Specification

Produce a single SQL migration file named `ar_schema.sql` that creates all the tables, computed columns, and indexes needed for the AR system. The file should be runnable on a clean PostgreSQL database. Include any seed data needed to configure a default escalation workflow.

Also produce a short `schema_notes.md` explaining the key design decisions you made — in particular around how computed values are handled and why.
