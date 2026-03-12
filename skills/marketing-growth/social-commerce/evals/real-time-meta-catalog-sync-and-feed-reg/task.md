# Meta Commerce Catalog Registration and Live Inventory Sync

## Problem/Feature Description

Sole Republic is a sneaker retailer that just finished building their Meta XML catalog feed endpoint (hosted at `https://catalog.solerepublic.com/feeds/meta.xml`). Now they need to wire up the backend integration: register their feed with a new Meta product catalog, schedule ongoing sync, and ensure that when a product's price is updated or stock runs out, the change appears in Meta within minutes — not hours.

The ops team was burned last year when a flash sale caused price mismatches between the website and Meta Shopping, leading to ad disapprovals and customer complaints. They want real-time push updates any time a product variant's price or inventory changes, and also want to understand how to keep their Meta access token alive long-term.

## Output Specification

Write the following TypeScript files:

- `src/meta/catalog-setup.ts` — exports `createMetaCatalog()` and `addFeedToCatalog(catalogId, feedUrl)` functions that register a new catalog and schedule feed ingestion
- `src/meta/sync.ts` — exports `pushProductUpdateToMeta(variantId)` that sends a real-time update for a single variant when its price or inventory changes
- `src/meta/token-management.ts` — exports a `scheduleTokenRefresh()` function (can use setInterval or a cron approach) with a brief comment explaining the token lifecycle
- `ARCHITECTURE.md` — a short document (one page) describing: which Meta API version is used, how the feed schedule is configured, the real-time update mechanism, and token lifecycle management

Use environment variables (e.g. `process.env.META_BUSINESS_ID`, `process.env.META_ACCESS_TOKEN`, `process.env.META_CATALOG_ID`) for all credentials. Stub out any database calls that would be needed.
