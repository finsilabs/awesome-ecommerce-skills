# International Product Catalog for Headless Shopify

## Problem/Feature Description

Volta Goods is a European outdoor equipment brand using Shopify as their backend. They are launching a headless Next.js storefront that will serve customers across multiple countries. Their product catalog has hundreds of items, so the product listing page must load products in batches rather than all at once. Additionally, customers visiting from France should see prices in EUR, customers from the UK in GBP, and so on — the existing Shopify-hosted store already manages multi-currency pricing, so the data layer just needs to surface it correctly.

The engineering team has set up the Shopify client already (it's available as `storefront` exported from `lib/shopify.ts`). Your job is to implement the product data-fetching layer so the catalog page can display localised product prices and load more products on demand. The team uses TypeScript throughout.

## Output Specification

Produce the following TypeScript file:

- `lib/products.ts` — Exports the following functions:
  - `getProducts(first: number, after?: string, country?: string): Promise<...>` — fetches a page of products; the `country` parameter (ISO 3166-1 alpha-2 code, e.g. `"FR"`, `"GB"`) should influence the currency of prices returned
  - `getProduct(handle: string, country?: string): Promise<...>` — fetches a single product by its URL handle

Both functions should return enough data to render a product card or product detail page (title, handle, prices, images, availability).

You can assume `lib/shopify.ts` already exports:
```typescript
import { createStorefrontApiClient } from "@shopify/storefront-api-client";
export const storefront = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
  apiVersion: "2025-01",
  privateAccessToken: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN!,
});
```

Do not modify `lib/shopify.ts`. Do not make live API calls — the implementation only needs to be structurally correct.
