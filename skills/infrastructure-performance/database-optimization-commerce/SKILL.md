---
name: database-optimization-commerce
description: "Product query optimization, search indexing, and read-replica strategies"
category: infrastructure-performance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [database, postgresql, indexing, query-optimization, read-replica, elasticsearch, pgvector, explain-analyze]
triggers: ["database optimization", "product query slow", "database performance ecommerce", "postgresql indexing", "read replica", "query optimization commerce", "slow catalog queries"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Database Optimization — Commerce

## Overview

E-commerce databases face distinct query patterns: high-cardinality product filtering (category + price + attributes), session-scoped cart lookups, write-heavy order creation, and read-heavy catalog browsing that must scale to thousands of concurrent users. This skill covers identifying slow queries with `EXPLAIN ANALYZE`, designing effective indexes for product filtering, partitioning order tables, and routing read traffic to replicas to protect the primary database.

## When to Use This Skill

- When product listing pages are slow due to unindexed filter combinations (category + price + brand)
- When checkout throughput is limited by order insertion latency
- When read load on the primary database is causing write latency to increase
- When a `pg_stat_statements` or slow query log reveals queries with seq scans on large tables
- When planning a database schema for a new e-commerce platform

## Core Instructions

1. **Identify slow queries with `pg_stat_statements`**

   Enable the extension and find the worst offenders:

   ```sql
   -- Enable in postgresql.conf or via:
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

   -- Find the top 20 slowest queries by total time
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

   -- Reset stats after making changes to see impact
   SELECT pg_stat_statements_reset();
   ```

   Explain a specific slow query:
   ```sql
   EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
   SELECT p.id, p.name, p.price
   FROM products p
   JOIN product_categories pc ON pc.product_id = p.id
   WHERE pc.category_id = 42
     AND p.price BETWEEN 1000 AND 5000
     AND p.status = 'active'
   ORDER BY p.created_at DESC
   LIMIT 24 OFFSET 0;
   ```

2. **Design indexes for product filtering**

   Product listing queries filter on multiple columns simultaneously. Partial and composite indexes are essential:

   ```sql
   -- Single-column indexes for common individual filters
   CREATE INDEX CONCURRENTLY idx_products_status
     ON products (status)
     WHERE status = 'active';  -- Partial index — only active products

   CREATE INDEX CONCURRENTLY idx_products_price
     ON products (price)
     WHERE status = 'active';

   CREATE INDEX CONCURRENTLY idx_products_brand_id
     ON products (brand_id, created_at DESC)
     WHERE status = 'active';

   -- Composite index for the most common filter combination
   CREATE INDEX CONCURRENTLY idx_products_category_price
     ON product_categories (category_id, product_id);

   CREATE INDEX CONCURRENTLY idx_products_listing
     ON products (status, brand_id, price, created_at DESC)
     INCLUDE (name, slug, thumbnail_url);
     -- INCLUDE adds non-key columns for index-only scans

   -- GIN index for full-text search on product name and description
   CREATE INDEX CONCURRENTLY idx_products_fts
     ON products USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

   -- Full-text search query
   SELECT id, name, ts_rank(
     to_tsvector('english', name || ' ' || coalesce(description, '')),
     plainto_tsquery('english', 'blue running shoes')
   ) AS rank
   FROM products
   WHERE to_tsvector('english', name || ' ' || coalesce(description, ''))
     @@ plainto_tsquery('english', 'blue running shoes')
     AND status = 'active'
   ORDER BY rank DESC
   LIMIT 20;
   ```

3. **Optimize product attribute filtering with JSONB**

   Storing variable product attributes in JSONB enables flexible filtering:

   ```sql
   -- Table design
   ALTER TABLE products ADD COLUMN attributes JSONB DEFAULT '{}';
   -- Example: {"color": "blue", "size": "M", "material": "cotton", "weight_kg": 0.5}

   -- GIN index on the entire JSONB column (for @> containment queries)
   CREATE INDEX CONCURRENTLY idx_products_attributes
     ON products USING gin(attributes);

   -- Find all blue M-size products in a category
   SELECT id, name, price, attributes
   FROM products
   WHERE category_id = 42
     AND attributes @> '{"color": "blue", "size": "M"}'
     AND status = 'active';

   -- For range queries on JSONB values, use expression indexes
   CREATE INDEX CONCURRENTLY idx_products_weight
     ON products ((attributes->>'weight_kg')::float)
     WHERE attributes ? 'weight_kg';

   -- Query using the expression index
   SELECT * FROM products
   WHERE (attributes->>'weight_kg')::float < 1.0
     AND category_id = 42;
   ```

4. **Partition the orders table by date**

   Orders tables grow unboundedly and become slow to query and maintain without partitioning:

   ```sql
   -- Create partitioned orders table
   CREATE TABLE orders (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id UUID NOT NULL,
     status      TEXT NOT NULL,
     total_cents INTEGER NOT NULL,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   ) PARTITION BY RANGE (created_at);

   -- Create quarterly partitions
   CREATE TABLE orders_2025_q1 PARTITION OF orders
     FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
   CREATE TABLE orders_2025_q2 PARTITION OF orders
     FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
   CREATE TABLE orders_2025_q3 PARTITION OF orders
     FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
   CREATE TABLE orders_2025_q4 PARTITION OF orders
     FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

   -- Indexes on each partition are created automatically when created on parent
   CREATE INDEX CONCURRENTLY ON orders (customer_id, created_at DESC);
   CREATE INDEX CONCURRENTLY ON orders (status, created_at DESC);

   -- Automate partition creation with a stored procedure
   CREATE OR REPLACE PROCEDURE create_quarterly_partition(year INT, quarter INT)
   LANGUAGE plpgsql AS $$
   DECLARE
     start_date DATE := make_date(year, (quarter - 1) * 3 + 1, 1);
     end_date   DATE := start_date + INTERVAL '3 months';
     table_name TEXT := format('orders_%s_q%s', year, quarter);
   BEGIN
     EXECUTE format(
       'CREATE TABLE IF NOT EXISTS %I PARTITION OF orders FOR VALUES FROM (%L) TO (%L)',
       table_name, start_date, end_date
     );
   END;
   $$;
   ```

5. **Configure read replicas and connection pooling**

   ```typescript
   // lib/database.ts
   import {Pool} from 'pg';
   import {createPool} from '@pgbouncer/client'; // Or direct pg

   const config = {
     primary: {
       connectionString: process.env.DATABASE_URL,
       max: 20,              // Max connections to primary
       idleTimeoutMillis: 30000,
       connectionTimeoutMillis: 2000,
     },
     replica: {
       connectionString: process.env.DATABASE_REPLICA_URL,
       max: 50,              // More connections on replica (read-heavy)
       idleTimeoutMillis: 30000,
       connectionTimeoutMillis: 2000,
     },
   };

   const primaryPool = new Pool(config.primary);
   const replicaPool = new Pool(config.replica);

   // Route queries based on intent
   export const db = {
     // Transactional writes — always primary
     async transaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
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

     // Catalog reads — replica
     async queryRead<T = any>(sql: string, params: any[] = []): Promise<T[]> {
       const result = await replicaPool.query(sql, params);
       return result.rows;
     },

     // Writes and reads requiring freshness — primary
     async queryWrite<T = any>(sql: string, params: any[] = []): Promise<T[]> {
       const result = await primaryPool.query(sql, params);
       return result.rows;
     },
   };
   ```

6. **Implement materialized views for complex aggregations**

   Dashboard queries (top sellers, revenue by category) are expensive if run live:

   ```sql
   -- Materialized view for daily sales by category
   CREATE MATERIALIZED VIEW daily_category_sales AS
   SELECT
     date_trunc('day', o.created_at) AS sale_date,
     pc.category_id,
     c.name AS category_name,
     COUNT(DISTINCT o.id) AS order_count,
     SUM(ol.quantity) AS units_sold,
     SUM(ol.unit_price_cents * ol.quantity) AS revenue_cents
   FROM orders o
   JOIN order_lines ol ON ol.order_id = o.id
   JOIN product_categories pc ON pc.product_id = ol.product_id
   JOIN categories c ON c.id = pc.category_id
   WHERE o.status = 'completed'
   GROUP BY 1, 2, 3
   WITH DATA;

   CREATE UNIQUE INDEX ON daily_category_sales (sale_date, category_id);

   -- Refresh concurrently (non-blocking) — run as a nightly cron job
   REFRESH MATERIALIZED VIEW CONCURRENTLY daily_category_sales;
   ```

## Examples

### Keyset pagination for large product catalogs

```sql
-- Offset pagination degrades as offset grows — avoid for pages > 10
-- Use keyset pagination instead:

-- First page
SELECT id, name, price, created_at
FROM products
WHERE status = 'active'
ORDER BY created_at DESC, id DESC
LIMIT 24;

-- Next page (pass last row's values as cursor)
SELECT id, name, price, created_at
FROM products
WHERE status = 'active'
  AND (created_at, id) < ('2025-03-01T12:00:00Z', 'uuid-of-last-row')
ORDER BY created_at DESC, id DESC
LIMIT 24;
```

```typescript
// TypeScript implementation
export async function getProducts(cursor?: {createdAt: string; id: string}) {
  const params: any[] = ['active', 24];
  let whereClause = 'WHERE status = $1';

  if (cursor) {
    whereClause += ` AND (created_at, id) < ($3::timestamptz, $4::uuid)`;
    params.push(cursor.createdAt, cursor.id);
  }

  const rows = await db.queryRead<Product>(
    `SELECT id, name, price, created_at FROM products ${whereClause} ORDER BY created_at DESC, id DESC LIMIT $2`,
    params
  );

  const nextCursor = rows.length === 24
    ? {createdAt: rows[rows.length - 1].created_at, id: rows[rows.length - 1].id}
    : null;

  return {products: rows, nextCursor};
}
```

### Connection pool monitoring

```sql
-- Monitor connection pool utilization
SELECT
  state,
  COUNT(*) AS connections,
  MAX(now() - state_change) AS longest_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Find long-running queries that may be blocking others
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > INTERVAL '5 minutes'
  AND state != 'idle';
```

## Best Practices

- **Use `EXPLAIN (ANALYZE, BUFFERS)` to validate index usage** — `EXPLAIN` without `ANALYZE` shows the planner's estimate; `ANALYZE` runs the query and shows actual rows and buffer hits
- **Create indexes `CONCURRENTLY`** — creating indexes without `CONCURRENTLY` locks the table for writes; always use `CONCURRENTLY` in production
- **Use keyset (cursor-based) pagination, not OFFSET** — `OFFSET 10000` requires the database to read and discard 10,000 rows; keyset pagination uses an index seek directly to the cursor position
- **Index foreign keys** — PostgreSQL does not auto-index foreign keys; `customer_id`, `order_id`, and `product_id` columns in join tables must be explicitly indexed
- **Set `work_mem` carefully** — increasing `work_mem` speeds up sorting and hash joins but multiplies with connection count; a 50MB `work_mem` × 200 connections = 10GB RAM
- **Vacuum and analyze regularly** — table bloat from dead tuples slows all queries; configure `autovacuum` aggressively on high-write tables like `sessions` and `carts`
- **Monitor `n_dead_tup` and `pg_total_relation_size`** — these metrics indicate tables needing vacuum and candidates for archiving/partitioning

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Index not used for multi-column filters | Ensure all columns in the `WHERE` clause are covered by a single composite index in the correct order (equality columns first, range columns last) |
| Slow queries on `products.attributes` JSONB | Add a GIN index on the entire `attributes` column for `@>` containment queries; use expression indexes for range queries on specific JSON keys |
| Read replica lag causing stale cart data | Route cart reads to the primary; only route catalog and order history reads to the replica where slight staleness is acceptable |
| Partition pruning not working | Ensure your `WHERE` clause references the partition key (`created_at`) so PostgreSQL can skip irrelevant partitions |
| `ORDER BY` with OFFSET causing full table scan | Replace with keyset pagination using the last row's values as a cursor; ensure a compound index on `(sort_column DESC, id DESC)` |

## Related Skills

- @flash-sale-scaling
- @monitoring-alerting-commerce
- @data-retention-policies
- @load-testing-commerce
