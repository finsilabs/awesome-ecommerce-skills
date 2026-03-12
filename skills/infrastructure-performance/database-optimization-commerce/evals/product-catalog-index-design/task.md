# Slow Product Listing Page — Index Migration

## Problem/Feature Description

An online outdoor gear retailer has a PostgreSQL database with a `products` table (roughly 2 million rows), a `product_categories` join table, and variable per-product specs stored alongside the main row. The engineering team has been receiving complaints that the product listing and search pages are taking 4–8 seconds to load, especially when shoppers filter by category, price range, brand, and attributes like material or weight.

The backend developer who built the schema created the base tables but left indexing for later. Now "later" has arrived and the team needs a migration script that adds the right indexes so that filtered product listing queries, full-text search, and attribute-based filtering all use index scans instead of sequential scans. The migration must run against a live production database without locking tables, so it must not block incoming writes at any point.

## Output Specification

Produce a single SQL migration file named `migration_add_indexes.sql` that adds all the indexes the team needs. The file should:

- Include a brief comment above each index explaining what query pattern it supports.
- Cover all the slow query patterns described: category+price filtering, brand/status combinations, full-text search on product name and description, and attribute containment queries.
- Also include an example SELECT query at the bottom of the file (in a comment) demonstrating how to paginate through the product listing efficiently at scale — imagine the catalog has been live for two years and the listing page is on page 500.

## Input Files

The following schema is provided as a starting point. Extract it before beginning.

=============== FILE: inputs/schema.sql ===============
-- Existing schema (no indexes beyond PKs)

CREATE TABLE products (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    description   TEXT,
    slug          TEXT NOT NULL UNIQUE,
    thumbnail_url TEXT,
    price         INTEGER NOT NULL,  -- cents
    brand_id      UUID NOT NULL,
    status        TEXT NOT NULL DEFAULT 'active',  -- 'active', 'draft', 'archived'
    attributes    JSONB DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE product_categories (
    product_id  UUID NOT NULL REFERENCES products(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    PRIMARY KEY (product_id, category_id)
);
