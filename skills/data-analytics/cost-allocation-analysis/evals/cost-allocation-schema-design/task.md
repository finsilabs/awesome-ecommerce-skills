# E-Commerce Cost Allocation Database Schema

## Problem Description

Marble & Thread is a small DTC home-goods brand that sells on their own Shopify storefront, Amazon, and Etsy. Until now, the founder has tracked all costs — supplier invoices, shipping labels, warehouse fees — in a single spreadsheet that mixes current and historical numbers in the same cells. When they renegotiated their packaging supplier contract last quarter, somebody updated the unit cost in the spreadsheet and the historical order margins suddenly looked 40% better than when the orders actually shipped. The board is asking for a proper profitability breakdown before the next funding round.

The engineering team has been asked to design a PostgreSQL schema that will serve as the foundation for all cost allocation going forward. The schema must correctly represent the four main cost categories: the per-unit cost of goods, the variable costs of fulfilling each order, the channel-level marketing spend that can be attributed to orders, and the shared overhead costs (warehouse rent, software subscriptions, headcount) that need to be spread across orders. A finance analyst will later write queries on top of this schema, so the structure and column naming must make those queries straightforward.

## Output Specification

Produce a single SQL file named `schema.sql` containing:
- All `CREATE TABLE` statements for the cost allocation tables
- Appropriate primary keys, foreign key references, and constraints
- Column-level comments where the purpose of a column might not be obvious
- Any `CREATE INDEX` statements you consider necessary for the anticipated query patterns

Also produce a brief `design_notes.md` that explains the key design decisions you made — particularly any choices that will affect the accuracy of historical margin calculations or the correctness of financial arithmetic.
