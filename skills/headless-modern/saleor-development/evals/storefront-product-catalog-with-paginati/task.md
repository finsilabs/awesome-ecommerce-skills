# Product Catalog API for a Next.js Storefront

## Problem/Feature Description

A fashion retailer is building a new Next.js storefront on top of their Saleor backend. Their marketing team regularly runs promotions for different regions — Europe uses EUR pricing while the US uses USD — so the backend is configured with multiple channels to handle regional pricing and availability. The storefront team needs a reliable way to fetch the full product catalog, including names, slugs, thumbnails, and pricing, so it can power both the homepage grid and a search index.

The catalog contains thousands of products, so a single query won't return everything. The team needs a TypeScript utility that can walk through all pages of results and return the complete list. Performance matters: catalog data barely changes during the day, so the team wants CDN-level caching on the API route that serves this data. They also need the code to be type-safe since the frontend is entirely TypeScript.

## Output Specification

Write a TypeScript implementation with the following files:

- `lib/saleorClient.ts` — GraphQL client setup targeting the Saleor API
- `lib/fetchAllProducts.ts` — a function that fetches all products from a given channel, handling large catalogs across multiple pages, returning a typed array
- `pages/api/catalog.ts` — a Next.js API route that calls fetchAllProducts and returns JSON, with appropriate caching headers set on the response

Include a `graphql-codegen.yml` (or equivalent config) or inline type definitions that show how types are generated from the Saleor schema.

You may use environment variables such as `NEXT_PUBLIC_SALEOR_API_URL` and `SALEOR_APP_TOKEN` — do not hardcode URLs or tokens.
