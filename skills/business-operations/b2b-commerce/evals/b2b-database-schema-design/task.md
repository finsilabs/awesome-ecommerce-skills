# Wholesale Portal Database Migration

## Problem/Feature Description

SupplyChain Direct is migrating from a legacy wholesale ordering platform to a modern PostgreSQL-backed system. The legacy system tracked company customers as a flat list with a single billing contact, but the new platform needs to support multiple buyers per company account, per-user purchase controls, and deferred payment arrangements (net terms).

The engineering team is starting with the database migration. They need SQL that models company accounts with proper payment term options and credit tracking, assigns users to company accounts with role-based controls, and maintains a per-company product catalog with optional custom pricing. The finance team has emphasized that monetary values must be stored consistently and that the schema must enforce valid values for status and payment term fields.

## Output Specification

Write a PostgreSQL migration file named `migration.sql` containing the CREATE TABLE statements for the company accounts data model. The migration should be standalone and runnable against a PostgreSQL database that already has `users` and `products` tables.

Document any design decisions in a `design_notes.md` file — particularly how you chose to store monetary amounts, how you enforced field constraints, and how you separated company-level from user-level data.
