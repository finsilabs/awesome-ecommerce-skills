# Cache Invalidation System for a Live Commerce Platform

## Problem/Feature Description

Vanta Shop runs a high-traffic online store with thousands of products. Their marketing team regularly updates prices for promotions, and the warehouse team adjusts inventory levels throughout the day. The current setup caches all product and collection pages at the CDN, but after price changes or inventory updates the site sometimes shows stale prices or incorrect stock availability for up to 10 minutes — until the cached pages expire naturally. During a recent sale, several customers checked out at the wrong price because the cache hadn't expired yet.

The engineering team needs a cache invalidation system that reacts to catalog events in real time. When a product's price changes, the right pages must be cleared immediately. Inventory changes are trickier: every warehouse adjustment should not flush the cache (there can be hundreds per hour), but customers must see accurate in/out-of-stock status. The team also has a requirement that product pages must be cacheable at the CDN edge for anonymous users, yet each visitor still sees their own live cart count and current inventory status — so the personalization approach must not break CDN caching.

Additionally, the collection listing pages are generated from a complex JOIN across several tables and the DBA wants to move that query to a pre-computed structure in PostgreSQL that can be updated without blocking concurrent reads.

## Output Specification

Produce the following files:

- `src/cache-invalidator.ts` — A TypeScript `CacheInvalidator` class with handlers for product update, price change, inventory change, and bulk catalog update events. Include a brief JSDoc comment on each method explaining when it fires and what it does.
- `src/personalization-api.ts` — An Express route handler for a `/api/personalization` endpoint that returns cart count and inventory for a given product, with appropriate cache headers
- `src/product-page-renderer.ts` — A function that renders a product page HTML string. The rendered page should include placeholders for cart count and inventory status that are populated by a client-side script calling the personalization API
- `db/collection-listing.sql` — SQL statements to create and maintain the collection product listing data structure in PostgreSQL, along with the necessary index
- `package.json` — With the required dependencies listed

The code does not need to run end-to-end (stubs for external services like CDN purge APIs are fine), but the logic, structure, and configuration choices must be complete and correct.
