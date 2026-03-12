# International Shipping — Product Catalogue and Order Screening

## Problem/Feature Description

Nomad Commerce, a growing direct-to-consumer brand, is launching international shipping to 30+ countries. Before they can go live, two things need to happen: first, their PostgreSQL product database needs new fields to support cross-border shipments; second, their order processing pipeline needs a screening step that catches prohibited or restricted items before an order reaches the fulfilment queue.

The engineering team has found that catching restricted items late (after a label is created) is both costly and operationally disruptive. Their compliance officer also provided a list of known product-country restrictions they need to seed as a starting point. The team wants a SQL migration that extends the products table, a new reference table for tariff classification support, a seed script for known restriction data, and a TypeScript function that screens a cart against destination-country restrictions before the order is submitted.

## Output Specification

Produce the following files:

1. `migration.sql` — SQL migration that adds the required international-shipping fields to the `products` table and creates any supporting reference tables
2. `seed-restrictions.sql` — SQL statements to seed a `country_restrictions` table with at least the known problematic product categories for key destination countries
3. `screen-order.ts` — TypeScript module exporting an async `screenForRestrictions(orderLines, destinationCountry)` function; include the TypeScript interface definitions for inputs and the return value
4. `notes.md` — A short (max 20 lines) design note explaining where in the checkout flow the screening should happen and why
