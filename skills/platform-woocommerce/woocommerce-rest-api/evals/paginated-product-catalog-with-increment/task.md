# Headless Product Catalog Service

## Problem/Feature Description

A startup is building a React Native mobile app for a boutique that runs their inventory on WooCommerce. The app needs a lightweight Node.js backend service that exposes product data to the mobile client. Because the product catalog has over 2,000 items, the service must support pagination so the app can load products lazily as the user scrolls. Response times need to be fast, so the service should avoid fetching unnecessary fields from WooCommerce — the mobile app only needs product IDs, names, prices, and stock status.

The team also wants the service to support an incremental cache-refresh mode: instead of re-fetching the entire catalog on every refresh, it should be able to fetch only products that have been updated since a given point in time, specified as an ISO 8601 timestamp. This will allow a background job to keep a local cache fresh without hammering the WooCommerce server.

## Output Specification

Produce a Node.js TypeScript project with:
- `package.json` with required dependencies
- `src/lib/woocommerce.ts` — WooCommerce client initialization
- `src/catalog.ts` — catalog functions including:
  - `getProducts(params)` — paginated product listing that returns products along with total page count and total product count
  - `getProductsSince(isoTimestamp, page?)` — fetches products modified after the given ISO 8601 timestamp (for incremental refresh)
  - `getProductVariations(productId)` — fetches all variations for a variable product
- `src/example-usage.ts` — demonstrates fetching page 2 of the catalog (10 items per page) and also fetching products updated since a specific timestamp

Do not hardcode any credentials. Use environment variables for WooCommerce configuration.
