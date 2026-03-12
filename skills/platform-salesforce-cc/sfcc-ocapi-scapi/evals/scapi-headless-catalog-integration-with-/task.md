# Mobile Commerce Catalog API Layer

## Problem/Feature Description

A sporting goods retailer is building a React Native mobile app backed by Salesforce B2C Commerce Cloud. The app's catalog browsing feature needs to support hundreds of concurrent users during peak sale events without hitting API rate limits or degrading response times. The previous integration built by an external agency made direct calls to legacy SFCC APIs and suffered from slow response times due to large payloads and repeated identical requests from different users. The team has been told to modernize the integration.

The new implementation should serve product search results and individual product detail pages to the mobile app via a Node.js BFF (Backend for Frontend) service. The team wants the implementation to be type-safe, handle traffic spikes gracefully, and keep API response payloads small to improve mobile performance.

Write a Node.js/TypeScript BFF service module with the catalog functions needed for the mobile app. Also produce a short `CATALOG_DESIGN.md` that describes the resilience and performance strategies you chose and why.

## Output Specification

Produce the following files:

- `lib/catalog.ts` — BFF catalog module with at minimum:
  - `searchProducts(query, options)` — search products by keyword and/or category
  - `getProductDetail(productId)` — fetch full product details
  Both functions should handle authentication internally (the caller does not need to manage tokens).
- `lib/sfcc-auth.ts` — SLAS authentication helper (guest token acquisition and refresh)
- `CATALOG_DESIGN.md` — A short document describing the resilience patterns and payload optimisation strategy used

Use TypeScript. Assume the following environment variables are available at runtime (do not hardcode their values):
- `SFCC_SHORT_CODE`
- `SFCC_ORG_ID`
- `SFCC_SITE_ID`
- `SFCC_SLAS_CLIENT_ID`
- `SFCC_SLAS_REDIRECT_URI`
