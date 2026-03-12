# Offline-Ready Storefront Service Worker

## Problem/Feature Description

OutdoorGear Co. runs an e-commerce store targeting hiking and camping enthusiasts — customers who frequently shop in areas with poor cell coverage (trailheads, campsites, rural sporting goods stores). Their Vite-based storefront currently has no offline capability, and the support team is getting complaints that the site breaks entirely when customers lose signal mid-browse. The engineering team has decided to add a service worker with proper caching to make product browsing work offline.

The product catalog is large (up to several hundred products) and served from `/api/products`, while product collections and categories are served from `/api/collections`. Product images are served from a CDN at `cdn.outdoorgear.com` and are typically stable for a week. The cart (`/api/cart`, `/cart`) and checkout (`/checkout`) flows must always reflect live data — stale cart or price information has caused customer service issues in the past. The engineering team also wants background synchronization so that cart modifications made offline are retried automatically once connectivity is restored.

## Output Specification

Produce the following files:

- `vite.config.ts` — Vite configuration that registers the PWA plugin with appropriate precaching settings and runtime caching rules
- `public/sw.js` — a custom service worker implementation using Workbox modules directly, covering product images, product/collections API, and cart background sync
- `CACHING_STRATEGY.md` — a brief document describing which strategy is used for each resource type and why, including what happens to cart operations when the user is offline

The output should be working code that an engineer can drop into the project with minimal modification.
