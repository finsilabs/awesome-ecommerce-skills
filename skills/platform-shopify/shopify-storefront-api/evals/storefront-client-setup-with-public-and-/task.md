# Headless Shopify Data Layer Setup

## Problem/Feature Description

A growing DTC brand called Pebble & Pine has decided to move their Shopify store to a custom Next.js 14 frontend. Their engineering team has built the UI components but hasn't yet wired up live Shopify data. The team lead has asked you to create the foundational data-fetching layer: a set of TypeScript modules that connect to Shopify's Storefront API and can be imported by both server components and client-side hooks.

The architecture needs to account for two very different contexts: server components and API route handlers that run on Node.js, and interactive client-side widgets running in the browser. These contexts have different performance and security requirements, so the Shopify connection should be configured differently for each.

## Output Specification

Produce a working TypeScript implementation with the following files:

- `lib/shopify.ts` — The Shopify client configuration module (exported clients for different contexts)
- `lib/products.ts` — A module that exports at least one function to fetch a list of products from Shopify, intended for use in a server context
- `README.md` — Brief documentation explaining which client to use in which context and why

Use environment variables for all secrets and store credentials. You can assume the following environment variables will be available at runtime:
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` — the store's myshopify.com domain (safe for browser)
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` — the public storefront access token (safe for browser)
- `SHOPIFY_STORE_DOMAIN` — the store's myshopify.com domain (server only)
- `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` — a private storefront access token (server only, NOT safe for browser)

Do not actually call the API (no live credentials exist); the implementation only needs to be structurally correct and ready to use.
