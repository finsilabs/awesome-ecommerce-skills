# Product Catalog Module for Headless Magento Storefront

## Problem Description

An outdoor sports retailer runs a Magento 2 store with a broad product catalogue that includes both simple products (accessories, consumables) and configurable products (apparel with size/color variants). They are building a React-based headless storefront and need a product catalog module that powers two key pages: a category listing page with faceted filtering, and a product detail page.

The merchandising team has reported a recurring issue in staging: some products visible in the Magento admin panel do not show up when fetched through the API, and the stock status for clothing variants is always showing incorrectly. The new implementation should be designed so that these known data issues are handled correctly.

The listing page must support pagination and allow shoppers to filter by attributes (size, color, brand) using the facet counts returned by the API.

## Output Specification

Produce a TypeScript file `lib/catalog.ts` containing:

- A `getProducts` function for category/search listing with facets and pagination
- A `getProductDetail` function for a single product's full details (suitable for a product detail page)

Also produce a `NOTES.md` file (max 30 lines) that explains:
- How the code handles different product types in the response
- Why stock status is queried the way it is
- A note about the visibility issue and what causes products to be missing from API results

Do not make live network calls — assume a `magentoQuery` helper function is available (you may import it from `./magento-client` or stub it). The code only needs to be structurally correct with proper GraphQL query strings.
