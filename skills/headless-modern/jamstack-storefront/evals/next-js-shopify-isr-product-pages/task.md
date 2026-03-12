# Headless Shopify Storefront with Next.js

## Problem/Feature Description

A fashion retailer, LookBook Co., is migrating away from a monolithic Shopify theme to a custom headless storefront. The marketing team wants near-perfect Core Web Vitals scores and sub-second page loads so product pages rank well in search. The engineering team has decided on Next.js with the App Router as the framework. They have a Shopify store and want product pages to be statically generated at build time, with automatic background regeneration so pricing and availability stay fresh without requiring a full redeploy.

The catalog has around 12,000 products, but only a few hundred are top sellers. Generating every single page at build time would make deploys prohibitively slow. They also need Next.js to serve product images from Shopify's CDN without errors in production.

## Output Specification

Produce the following files as if scaffolding the storefront from scratch. The files should contain working TypeScript code — they don't need to be a complete running app, but they should be structurally correct and importable:

- `lib/shopify.ts` — the Shopify Storefront API client configuration
- `app/products/[handle]/page.tsx` — the product page component with static generation and ISR
- `next.config.ts` — Next.js configuration including CDN cache headers and image domains

All files should be placed directly in the output directory. Do not install packages or run a build — just produce the source files.
