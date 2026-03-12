# On-Demand Cache Invalidation for a Next.js Storefront

## Problem/Feature Description

SportZone runs a large statically generated Next.js storefront connected to a Saleor backend. The merchandising team runs frequent flash sales where prices drop for a few hours — they need those price changes to appear on the site within seconds of being published in the backend, not after a 5-minute ISR interval. The engineering team wants a webhook-driven approach: whenever a product or collection is updated in Saleor, the backend posts to a Next.js API endpoint, which then purges only the affected cached pages and their associated cache tags.

Security is a concern: the endpoint should not be callable by anyone on the internet without authorization. The team also uses Next.js fetch cache tags throughout the data layer, so revalidation needs to be targeted using those same tag names to avoid purging the entire cache unnecessarily.

You also need to implement the data-fetching function that assigns fetch cache tags when loading product data, so that tag-based revalidation works end-to-end.

## Output Specification

Produce the following files:

- `app/api/revalidate/route.ts` — the Next.js API route handler for on-demand revalidation
- `lib/get-product.ts` — a data-fetching function that fetches a product with appropriate fetch cache tags

Do not install packages or run a build — just produce the source files.
