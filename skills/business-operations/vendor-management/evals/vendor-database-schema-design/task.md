# Vendor Management Database Setup

## Problem Description

A mid-sized e-commerce company called NorthBay Goods is expanding its supplier network from 3 vendors to over 30. Their current process — emailing spreadsheets back and forth with purchase order details — is breaking down: orders get lost, costs are mis-entered, and there's no audit trail. The engineering team has been tasked with building a proper vendor management backend.

The first milestone is setting up the database schema that will power the system. The data model needs to represent suppliers, purchase orders, and individual line items on those orders. The schema should be production-ready: it needs to enforce data integrity through appropriate constraints, handle multiple currencies for international suppliers, track payment terms, and record both what was ordered and what was actually received for each line item.

A key requirement from the finance team is that all monetary amounts must be stored in a way that avoids floating-point rounding errors — the company lost money in a previous system due to decimal precision issues. The operations team also needs a reliable, human-readable order numbering scheme so that phone conversations with suppliers can reference a specific order unambiguously.

## Output Specification

Write the SQL migration files to create the database schema for the vendor management system. Produce the following:

- `schema.sql` — a single SQL file containing all `CREATE TABLE` statements, constraints, sequences, and indexes needed to set up the schema from scratch
- `schema_notes.md` — a brief document explaining the key design decisions made (data types chosen, constraint rationale, numbering approach)

The schema must be valid PostgreSQL syntax. Do not include any INSERT statements or test data.
