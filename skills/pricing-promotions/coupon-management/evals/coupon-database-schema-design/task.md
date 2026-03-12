# Promotional Code System — Database Design

## Problem/Feature Description

FinSi is launching its first promotional campaign ahead of a product rebrand and needs a database layer to power coupon codes across its checkout flow. The engineering team has been asked to design the persistence layer from scratch: there is currently no coupon infrastructure and marketing wants to support percentage-off deals, flat dollar discounts, and free-shipping offers — each with configurable minimum basket sizes, discount caps, and expiry windows.

The system must also track which customers have already used a given code so that per-customer limits can be enforced, and it must retain a permanent history of every redemption even if a coupon is later retired. The CTO has flagged that coupon lookup will happen on every checkout page load so the schema must be optimized accordingly.

## Output Specification

Produce a single file `schema.sql` containing:
- All `CREATE TABLE` statements for the coupon system
- All `CREATE INDEX` statements required for production performance
- Inline SQL comments where the purpose of a column or constraint is not self-evident

Do not include any application code, migration tooling, or seed data — just the schema DDL.
