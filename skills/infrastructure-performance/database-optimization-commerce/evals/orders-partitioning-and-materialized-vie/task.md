# Orders Table Scaling and Sales Dashboard Optimization

## Problem/Feature Description

A fast-growing e-commerce company has an `orders` table that started three years ago and now contains over 50 million rows. Simple queries like "get all orders for customer X from the last 90 days" take 12+ seconds because the planner has to scan the entire table. Meanwhile, the analytics team runs dashboard queries every few minutes to compute revenue by product category — these live aggregation queries take 30–45 seconds each and are hammering the database.

The engineering lead wants to solve both problems with a major schema overhaul: partition the orders table so PostgreSQL can skip irrelevant data automatically, and pre-compute the analytics aggregations so the dashboard reads a summary instead of scanning all orders live. The team also wants the partition management process to be automated so a new quarterly partition gets created without manual SQL every three months.

Your job is to produce a SQL migration script that transforms the system, plus a brief explanation document.

## Output Specification

Produce two files:

1. `migration_orders_overhaul.sql` — A SQL script that:
   - Defines the new partitioned `orders` table structure.
   - Creates the necessary quarterly partitions (create at least four — for the current year).
   - Creates a stored procedure to automate future quarterly partition creation.
   - Adds appropriate indexes on the partitioned table.
   - Creates a materialized view that aggregates daily sales revenue by category.
   - Includes the command to refresh that materialized view in a non-blocking way.

2. `design_notes.md` — A short document (bullet points are fine) explaining:
   - How to ensure the query planner skips irrelevant partitions when querying recent orders.
   - How to validate that an index is actually being used after the migration (include the specific SQL syntax to use).
   - How often the materialized view should be refreshed and via what mechanism.

## Input Files

The following existing schema is provided. Extract it before beginning.

=============== FILE: inputs/existing_orders.sql ===============
-- Current monolithic orders table (no partitioning)
CREATE TABLE orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    status      TEXT NOT NULL,  -- 'pending', 'processing', 'completed', 'cancelled'
    total_cents INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_lines (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID NOT NULL REFERENCES orders(id),
    product_id     UUID NOT NULL,
    quantity       INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL
);

CREATE TABLE product_categories (
    product_id  UUID NOT NULL,
    category_id UUID NOT NULL,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);
