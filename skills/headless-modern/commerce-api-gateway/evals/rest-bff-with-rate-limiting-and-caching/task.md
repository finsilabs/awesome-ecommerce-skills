# Commerce BFF: Product Detail and Cart Aggregation Service

## Problem/Feature Description

StyleHub, a mid-sized fashion retailer, is migrating from a monolithic storefront to a composable architecture. Their new backend consists of three independent microservices: a catalog service (product data), an inventory service (stock levels), and a CMS service (rich product descriptions and media). The existing storefront was making 8–12 API calls per page load and engineering has decided to introduce a Backend-for-Frontend layer to consolidate these into single-endpoint responses.

The engineering team wants a TypeScript BFF that handles two critical pages: the Product Detail Page (PDP) and the Cart Page. The PDP aggregates data from all three services — the CMS and inventory are considered "enrichment" data, meaning the page can still render if they are temporarily unavailable. The Cart Page is account-sensitive and must only be accessible to authenticated customers. The team also wants to protect the service from abuse with per-user and per-IP rate limiting backed by Redis, and to cache public responses to reduce load on the microservices. The BFF must log all requests.

## Output Specification

Produce a TypeScript implementation of the BFF. The deliverable should be a set of source files in a `bff/` directory. Your implementation should include:

- `bff/src/server.ts` — the main server application with both `/api/pdp/:id` and `/api/cart/:cartId` routes
- `bff/src/middleware/auth.ts` — the JWT authentication middleware
- `bff/src/tracing.ts` or similar if you add observability (optional)
- `bff/package.json` — with all required dependencies listed

The actual microservice clients do not need to be implemented (stub them or use placeholder functions). Focus on the BFF structure, middleware wiring, and resilience patterns. Include inline comments explaining any key decisions.

Do not implement a working Redis connection or live JWT verification — use mock/placeholder values where environment variables would normally be required. The code should be syntactically correct and runnable with `npm install`.

Also produce a `bff/DECISIONS.md` file documenting: which HTTP framework was chosen and why, how parallel upstream calls are handled, the rate limiting approach and key selection strategy, and the caching strategy.
