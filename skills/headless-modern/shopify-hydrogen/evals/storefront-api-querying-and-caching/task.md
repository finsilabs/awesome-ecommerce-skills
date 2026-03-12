# Build Hydrogen Storefront Route Files

## Problem/Feature Description

A fashion brand is migrating from a legacy Shopify theme to a custom headless storefront built with Hydrogen. The engineering team has scaffolded the project and connected it to the Storefront API, but the core product browsing experience still needs to be built out. They need two key route files: one for a product detail page and one for a collections listing page.

The team's primary concern is performance — their old storefront had slow page loads and poor TTFB scores. The new implementation needs to be smart about caching: product catalog data should stay cached aggressively at the CDN edge, inventory-sensitive data (like availability) should refresh frequently, and any customer-specific queries should never be cached. The brand also sells internationally and the team wants to ensure prices are fetched in the visitor's local currency and language.

## Output Specification

Produce two TypeScript route files that would slot into a Hydrogen + Remix project:

1. `app/routes/products.$handle.tsx` — Product detail page loader and component. Should fetch a product by its handle, including variants with pricing and availability. Must handle the case where a product doesn't exist.

2. `app/routes/collections.$handle.tsx` — Collection listing page loader and component. Should fetch a collection and its products, supporting sort order via URL query parameters.

For each file, include the loader function, any GraphQL queries, and a basic React component that renders the data using `useLoaderData`. The files should be complete and runnable in a Hydrogen project.

Also produce a `NOTES.md` file documenting the caching strategy decisions made for each query and why.
