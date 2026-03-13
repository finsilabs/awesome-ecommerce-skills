# AP Database Schema for Multi-Entity Finance Platform

## Problem/Feature Description

A mid-size manufacturing company is retiring their legacy spreadsheet-based accounts payable process and migrating to a new in-house finance platform. The AP team processes hundreds of supplier invoices each month across three legal entities, each with its own bank account and chart of accounts. They need a solid PostgreSQL database schema that can support the full invoice lifecycle — from receipt through three-way matching, approval, payment scheduling, and eventual archival.

The finance controller has flagged several recurring pain points with the old system: duplicate payments from the same invoice being entered twice by different AP clerks, inability to track whether invoices were matched against purchase orders and goods receipts, no way to distinguish regular supplier invoices from credit memos (which were causing mysteriously negative balances in aging reports), and slow queries when generating monthly AP aging reports for vendors with hundreds of open invoices. The new schema must be designed to prevent these issues structurally, not just through application logic.

## Output Specification

Write a single SQL file named `ap_schema.sql` containing the complete DDL for the accounts payable tables. The file should include all tables, constraints, and indexes needed for a production-ready AP system. Add brief comments to explain non-obvious design decisions.

Do not include application code — only SQL DDL statements.
