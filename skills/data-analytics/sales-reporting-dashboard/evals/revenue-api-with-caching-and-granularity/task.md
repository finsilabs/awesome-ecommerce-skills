# Revenue Analytics API Endpoint

## Problem/Feature Description

Fenwick Commerce, a mid-sized e-commerce company, has outgrown their weekly spreadsheet revenue reports. The BI team is building an internal React dashboard powered by Recharts and needs a backend API that can serve aggregated revenue data across flexible date ranges and time granularities. The dashboard will be queried dozens of times per page load by multiple analysts simultaneously, so the team is concerned about query performance on their PostgreSQL database, which contains several years of order history.

The engineering team has a working database with an `orders` table that stores monetary values as integer cents fields (`subtotal_cents`, `discount_cents`, `refund_cents`, `shipping_cents`). They also need the API to clearly distinguish between gross merchandise value and net revenue so the finance and marketing teams stop confusing the two numbers. Every metric displayed must include context about how it compares to the equivalent prior period so analysts can immediately spot trends.

## Output Specification

Implement the following:

1. A TypeScript Express route handler for `GET /api/analytics/revenue` that accepts `start`, `end`, and `granularity` query parameters.
2. A PostgreSQL SQL query that the handler uses to fetch the revenue data.
3. A brief `api-design.md` document (max 300 words) explaining the performance strategy, how the prior period is calculated, and the granularity options supported.

The output files should be:
- `revenue-handler.ts` — the Express route handler
- `revenue-query.sql` — the SQL query used for fetching revenue data
- `api-design.md` — the design notes document

Assume a database query function `db.query(sql, params)` is available. The infrastructure stack includes Node.js, Express, PostgreSQL, and Redis.
