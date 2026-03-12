# Frequently Bought Together Engine

## Problem Description

An outdoor gear retailer has been running their e-commerce platform for two years and has accumulated a substantial order history in their PostgreSQL database. The product team wants to add a "Frequently Bought Together" section to their product detail pages — the kind of carousel that shows customers which other items are commonly purchased alongside the item they're viewing.

The current system has no recommendation capability at all. The engineering team wants a solution that: (a) pre-computes product affinity data from historical orders efficiently, (b) exposes a TypeScript function that returns recommended products for a given product, and (c) can be kept up to date as new orders come in without impacting site performance.

The database has three relevant tables: `order_items` (columns: `order_id`, `product_id`, `promotion_bundle_id` — nullable, set when item was part of a bundle promotion), `products` (columns: `id`, `status`, `inventory`, `sales_count`), and `product_co_purchases` (columns: `product_a_id`, `product_b_id`, `co_purchase_count`, `updated_at`).

## Output Specification

Produce the following files:

1. `co_purchase_matrix.sql` — A SQL script that builds or refreshes the `product_co_purchases` table from `order_items`. The script should handle being run repeatedly (i.e., updating existing rows rather than failing on duplicates).

2. `recommendations.ts` — A TypeScript module exporting a `getFrequentlyBoughtTogether(productId, limit, excludeProductIds)` function that queries the database and returns active, in-stock products sorted by affinity.

3. `refresh_schedule.md` — A short document (3–5 sentences) describing how and when the co-purchase matrix should be refreshed in production, and why that schedule was chosen.

The SQL and TypeScript can use placeholder database clients (`db`, `redis`) — no running database is required. Focus on correctness of the logic rather than a working runtime environment.
