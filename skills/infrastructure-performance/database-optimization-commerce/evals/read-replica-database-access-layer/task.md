# Database Access Layer for Scaled E-commerce API

## Problem/Feature Description

A Node.js/TypeScript e-commerce API has reached a point where the primary PostgreSQL database is showing increased write latency during peak traffic. The infrastructure team has provisioned a read replica, and now the application needs to be updated to route read traffic to the replica. The team wants a clean, reusable database module that handles both the primary and replica pools and makes it easy for application code to choose the right connection.

A junior engineer wrote a draft module that just uses a single pool pointed at the primary, and the tech lead needs it replaced with a proper dual-pool implementation. The module must expose a consistent interface so existing call sites can migrate incrementally: transactional operations stay on the primary, catalog browsing and order history queries move to the replica. One exception the tech lead flagged explicitly: the shopping cart must always read from the primary because even a small replication lag can cause confusing UX (items appearing to disappear from the cart).

## Output Specification

Produce a TypeScript file `lib/database.ts` implementing the database access module. The file should:

- Export a `db` object with at minimum three methods: one for transactions, one for replica reads, and one for primary writes/reads.
- Use environment variables for connection strings.
- Include a short `README.md` (in the same output directory) that documents which method to use for: product listing queries, cart reads, order placement, and order history — with one-line justifications for each.

## Input Files

The following starter file is provided as context. Extract it before beginning.

=============== FILE: inputs/database_v1.ts ===============
// Current single-pool implementation — needs to be replaced
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export const db = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await pool.query(sql, params);
    return result.rows;
  },
};
