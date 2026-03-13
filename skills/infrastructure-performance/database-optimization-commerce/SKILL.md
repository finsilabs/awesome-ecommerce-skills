---
name: database-optimization-commerce
description: "Speed up slow product and order queries with proper indexing, query analysis, read replicas, and search engine offloading strategies"
category: infrastructure-performance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [database, postgresql, indexing, query-optimization, read-replica, elasticsearch, pgvector, explain-analyze]
triggers: ["database optimization", "product query slow", "database performance ecommerce", "postgresql indexing", "read replica", "query optimization commerce", "slow catalog queries"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Database Optimization — Commerce

## Overview

E-commerce databases face distinct query patterns: high-cardinality product filtering (category + price + attributes), session-scoped cart lookups, write-heavy order creation, and read-heavy catalog browsing that must scale to concurrent users. This skill covers identifying slow queries, designing effective indexes for product filtering, partitioning order tables, and routing read traffic to replicas.

## When to Use This Skill

- When product listing pages are slow due to unindexed filter combinations (category + price + brand)
- When checkout throughput is limited by order insertion latency
- When read load on the primary database is causing write latency to increase
- When a slow query log reveals queries doing sequential scans on large tables
- When planning a database schema for a new custom e-commerce platform

## Core Instructions

### Step 1: Determine your situation

Database optimization applies primarily to self-hosted setups. Understand your constraints first:

| Platform | Database Control | What to Optimize |
|----------|-----------------|-----------------|
| **Shopify** | None — Shopify manages all infrastructure | Focus on Liquid template rendering speed, app performance, and Shopify's built-in query optimization via Search & Discovery app |
| **WooCommerce** | Full — you manage MySQL/MariaDB on your host | Optimize WooCommerce queries with caching plugins (Redis Object Cache, WP Rocket), add database indexes via WP Optimize plugin, and configure your hosting MySQL settings |
| **BigCommerce** | None — BigCommerce manages all infrastructure | Focus on theme performance, image optimization, and reducing third-party app overhead |
| **Custom / Headless** | Full — you own PostgreSQL (or MySQL) | Apply all the techniques below; PostgreSQL is assumed in code examples |

### Step 2: Quick wins for WooCommerce (managed WordPress/WooCommerce)

Before touching database indexes directly, apply these WooCommerce-specific optimizations:

1. **Install Redis Object Cache** (free, wordpress.org):
   - Your host must support Redis (most managed WordPress hosts — WP Engine, Kinsta, Cloudways — do)
   - Install and activate the plugin; go to **Settings → Redis** and click **Enable Object Cache**
   - This caches all WooCommerce database queries in memory, dramatically reducing repeat query times

2. **Install WP-Optimize** (free, wordpress.org):
   - Go to **WP-Optimize → Database** and run **Clean database** to remove orphaned order meta, expired transients, and post revisions
   - WooCommerce stores build up millions of rows of orphaned meta over time — regular cleanup is essential
   - Schedule automatic cleanup weekly

3. **Enable the WooCommerce HPOS (High-Performance Order Storage)**:
   - Go to **WooCommerce → Settings → Advanced → Features**
   - Enable **High-Performance Order Storage** — this moves orders from WP post tables to dedicated order tables with proper indexes
   - Critical for stores with 10,000+ orders

4. **Upgrade to a host with MySQL 8.0+** — older MySQL versions lack important index improvements; WP Engine, Kinsta, and Cloudways all run MySQL 8.0+

### Step 3: PostgreSQL optimization for custom storefronts

---

#### Identify slow queries

```sql
-- Enable pg_stat_statements to find the worst offenders
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 20 slowest queries by total cumulative time
SELECT
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  calls,
  round((total_exec_time / sum(total_exec_time) OVER()) * 100, 2) AS pct_of_total,
  left(query, 200) AS query
FROM pg_stat_statements
WHERE calls > 100
ORDER BY total_exec_time DESC
LIMIT 20;

-- Diagnose a specific slow query
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT p.id, p.name, p.price
FROM products p
JOIN product_categories pc ON pc.product_id = p.id
WHERE pc.category_id = 42
  AND p.price BETWEEN 1000 AND 5000
  AND p.status = 'active'
ORDER BY p.created_at DESC
LIMIT 24;
-- Look for "Seq Scan" on large tables — this means a missing index
```

#### Design indexes for product filtering

```sql
-- Partial index on active products only (smaller, faster)
CREATE INDEX CONCURRENTLY idx_products_status
  ON products (status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_products_price
  ON products (price) WHERE status = 'active';

-- Composite index for the most common filter combination
-- INCLUDE adds non-key columns for index-only scans (no table heap access)
CREATE INDEX CONCURRENTLY idx_products_listing
  ON products (status, brand_id, price, created_at DESC)
  INCLUDE (name, slug, thumbnail_url);

-- GIN index for flexible JSONB attribute filtering
-- Enables: attributes @> '{"color": "blue", "size": "M"}'
CREATE INDEX CONCURRENTLY idx_products_attributes
  ON products USING gin(attributes);

-- ALWAYS index foreign keys (PostgreSQL does NOT do this automatically)
CREATE INDEX CONCURRENTLY idx_product_categories_product_id
  ON product_categories (product_id);
CREATE INDEX CONCURRENTLY idx_order_lines_order_id
  ON order_lines (order_id);
```

#### Partition the orders table by date

```sql
-- Create orders table with range partitioning on created_at
CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  status      TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Quarterly partitions
CREATE TABLE orders_2025_q1 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE orders_2025_q2 PARTITION OF orders
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
-- (continue for Q3, Q4, 2026...)

-- Indexes on the parent propagate to all partitions
CREATE INDEX CONCURRENTLY ON orders (customer_id, created_at DESC);
CREATE INDEX CONCURRENTLY ON orders (status, created_at DESC);
```

#### Route reads to replicas

```javascript
// lib/database.js — two connection pools
import { Pool } from 'pg';

const primaryPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
const replicaPool = new Pool({ connectionString: process.env.DATABASE_REPLICA_URL, max: 50 });

export const db = {
  // Writes and anything requiring freshness — primary
  async write(sql, params = []) {
    const result = await primaryPool.query(sql, params);
    return result.rows;
  },
  // Catalog reads — replica (slight staleness is acceptable)
  async read(sql, params = []) {
    const result = await replicaPool.query(sql, params);
    return result.rows;
  },
  // Transactions — always primary
  async transaction(fn) {
    const client = await primaryPool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};
```

**Route reads correctly:**
- Catalog pages, product search, order history → `db.read()` (replica)
- Cart operations, checkout, inventory decrement → `db.write()` or `db.transaction()` (primary)

#### Use keyset pagination (never OFFSET for large catalogs)

```sql
-- OFFSET 10000 reads and discards 10,000 rows — slow at scale
-- Use keyset pagination instead: pass the last row's cursor values

-- First page
SELECT id, name, price, created_at FROM products
WHERE status = 'active'
ORDER BY created_at DESC, id DESC
LIMIT 24;

-- Next page (pass last row's created_at and id as cursor)
SELECT id, name, price, created_at FROM products
WHERE status = 'active'
  AND (created_at, id) < ('2025-03-01T12:00:00Z', 'uuid-of-last-row')
ORDER BY created_at DESC, id DESC
LIMIT 24;
```

## Best Practices

- **Use `EXPLAIN (ANALYZE, BUFFERS)`** to validate index usage — `EXPLAIN` alone shows estimates; `ANALYZE` runs the query and shows actuals; "Seq Scan" on a large table means a missing index
- **Create indexes `CONCURRENTLY`** — without `CONCURRENTLY`, index creation locks the table for writes; always use it in production
- **Index all foreign keys** — PostgreSQL does not auto-index foreign keys; `customer_id`, `order_id`, and `product_id` in join tables must be explicitly indexed
- **Set `work_mem` carefully** — increasing `work_mem` speeds up sorting but multiplies with connection count; benchmark before raising it
- **Run `VACUUM ANALYZE` regularly** — table bloat from dead tuples slows all queries; configure `autovacuum` aggressively on high-write tables like `carts` and `sessions`

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Index not used for multi-column filters | Composite index column order matters: equality columns first (`status`, `brand_id`), range columns last (`price`, `created_at`) |
| Slow JSONB attribute filtering | Add a GIN index on the full `attributes` column for `@>` containment queries; use expression indexes for range queries on specific JSON keys |
| Read replica lag causing stale cart data | Route cart reads to primary; only route catalog and order history reads to replica where slight staleness is acceptable |
| Partition pruning not working | Ensure `WHERE` clause includes the partition key (`created_at`) so PostgreSQL can skip irrelevant partitions |
| Slow pagination on page 50+ | Replace `OFFSET` with keyset pagination using the last row's values as a cursor |

## Related Skills

- @flash-sale-scaling
- @monitoring-alerting-commerce
- @ecommerce-caching
- @load-testing-commerce
