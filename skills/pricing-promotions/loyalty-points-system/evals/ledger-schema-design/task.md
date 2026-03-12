# Loyalty Program Database Schema

## Problem/Feature Description

A mid-sized online retailer is launching a customer loyalty program and needs a solid database foundation before any application code is written. The engineering team wants a schema that can support points earned on purchases, bonus actions, redemptions, and automatic expiry — without ever losing the history of how a customer's balance changed over time. Auditing is critical: the finance team needs to be able to trace every points event back to its source. The schema also needs to support tiered membership levels that unlock different earning rates.

The existing database is PostgreSQL and already has a `customers` table with an `id UUID` primary key. Your task is to design the tables, constraints, and indexes that will underpin the loyalty system.

## Output Specification

Produce a single SQL migration file named `migration.sql` containing:
- All `CREATE TABLE` statements
- All `CREATE INDEX` statements
- Any necessary `CHECK` constraints

The file should be runnable against a PostgreSQL database that already has a `customers(id UUID)` table. Do not include any application code — only SQL.
