# Browsing History Utility for Product Catalog

## Problem/Feature Description

An outdoor gear retailer is launching a headless storefront rebuild and the team needs a standalone JavaScript utility module for tracking which products a shopper has browsed. The utility will be shared across multiple page types — product detail pages, the homepage, and search results — so it must be a clean, importable module with a well-defined API.

The module should store browsing history in the browser so returning visitors can pick up where they left off. It needs to handle the case where a shopper views the same product multiple times (only the most recent visit should count), and history should automatically age out to avoid showing discontinued or long-forgotten products. The team cares about keeping the stored data lean — product details change frequently, so the module must not cache anything that could go stale.

## Output Specification

Write a self-contained JavaScript module at `lib/recentlyViewed.js` that exports the following functions:
- `recordView(productId)` — records that the given product was viewed
- `getRecentlyViewedIds(excludeId)` — returns an ordered array of recently viewed product IDs, excluding the given ID
- `clearHistory()` — removes all stored history

Also write a short `lib/recentlyViewed.test.js` file (plain JS, no test framework required — just runnable with Node.js using `assert`) that demonstrates the deduplication and TTL filtering behavior.
