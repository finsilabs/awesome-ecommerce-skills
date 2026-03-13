---
name: edge-commerce
description: "Reduce latency globally by running geo-routing, A/B tests, and personalization logic at the network edge using Cloudflare Workers or Vercel"
category: infrastructure-performance
risk: safe
source: curated
date_added: "2026-03-12"
tags: [edge, cloudflare-workers, vercel-edge, geo-routing, personalization, kv-store, edge-middleware, latency]
triggers: ["edge commerce", "edge computing ecommerce", "cloudflare workers commerce", "geo-routing", "edge personalization", "vercel edge functions", "edge caching"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Edge Commerce

## Overview

Edge computing executes code in the CDN PoP closest to each user, reducing latency from hundreds of milliseconds (round-trip to a central origin) to under 50ms. For e-commerce, this enables geo-routing (redirect UK users to a UK storefront), edge-side personalization (inject user tier into cached pages), instant A/B testing without origin round-trips, and distributed inventory caching via edge KV stores. This skill covers Cloudflare Workers and Vercel Edge Middleware patterns for commerce use cases.

## When to Use This Skill

- When pages routed through a central origin have high TTFB (>300ms) for international users
- When you need to redirect users to region-specific storefronts or localized product catalogs
- When you want to run A/B tests without adding JavaScript that delays page rendering
- When you need to inject personalization hints (customer tier, ab variant) into cached page responses
- When building a multi-region deployment where each region needs its own origin but shares a single domain

## Core Instructions

1. **Set up Vercel Edge Middleware for geo-routing**

   Vercel Edge Middleware runs on Vercel's Edge Network before the request reaches your Next.js app:

   ```typescript
   // middleware.ts — runs at the edge, globally
   import {NextRequest, NextResponse} from 'next/server';
   import {geolocation} from '@vercel/functions';

   const REGION_STORE_MAP: Record<string, string> = {
     GB: 'uk',
     DE: 'de',
     FR: 'fr',
     CA: 'ca',
     AU: 'au',
   };

   export function middleware(request: NextRequest) {
     const url = request.nextUrl.clone();
     const {country} = geolocation(request);
     const storeSegment = country ? REGION_STORE_MAP[country] : null;

     // If the user is on the root path and has a region mapping, redirect
     if (storeSegment && url.pathname === '/') {
       url.pathname = `/${storeSegment}`;
       return NextResponse.redirect(url, {status: 302});
     }

     // Add country to request headers for downstream use
     const response = NextResponse.next();
     if (country) {
       response.headers.set('x-user-country', country);
     }
     return response;
   }

   export const config = {
     matcher: ['/', '/products/:path*', '/collections/:path*'],
   };
   ```

2. **Implement edge A/B testing without round-trips**

   ```typescript
   // middleware.ts — assign A/B variant at the edge
   import {NextRequest, NextResponse} from 'next/server';

   interface ABExperiment {
     id: string;
     buckets: Array<{name: string; weight: number; path?: string}>;
   }

   const ACTIVE_EXPERIMENTS: ABExperiment[] = [
     {
       id: 'checkout-button-color',
       buckets: [
         {name: 'control', weight: 0.5},
         {name: 'green-button', weight: 0.5},
       ],
     },
   ];

   function assignVariant(buckets: ABExperiment['buckets']): string {
     const random = Math.random();
     let cumulative = 0;
     for (const bucket of buckets) {
       cumulative += bucket.weight;
       if (random < cumulative) return bucket.name;
     }
     return buckets[0].name;
   }

   export function middleware(request: NextRequest) {
     const response = NextResponse.next();

     for (const experiment of ACTIVE_EXPERIMENTS) {
       const cookieName = `ab_${experiment.id}`;
       let variant = request.cookies.get(cookieName)?.value;

       if (!variant) {
         variant = assignVariant(experiment.buckets);
         // Set a cookie so the user stays in the same variant
         response.cookies.set(cookieName, variant, {
           maxAge: 60 * 60 * 24 * 30, // 30 days
           sameSite: 'lax',
           httpOnly: true,
         });
       }

       response.headers.set(`x-ab-${experiment.id}`, variant);
     }

     return response;
   }
   ```

3. **Use Cloudflare Workers KV for edge inventory caching**

   Workers KV is Cloudflare's globally distributed key-value store, accessible from any Cloudflare Worker:

   ```typescript
   // cloudflare-worker.ts
   export interface Env {
     INVENTORY_KV: KVNamespace;
     CATALOG_KV: KVNamespace;
     ORIGIN_URL: string;
   }

   export default {
     async fetch(request: Request, env: Env): Promise<Response> {
       const url = new URL(request.url);

       // Serve product inventory from KV (updated every 60 seconds via a Durable Object or cron)
       if (url.pathname.startsWith('/api/inventory/')) {
         const productId = url.pathname.replace('/api/inventory/', '');
         const cached = await env.INVENTORY_KV.get(productId, 'json');

         if (cached) {
           return new Response(JSON.stringify(cached), {
             headers: {
               'Content-Type': 'application/json',
               'Cache-Control': 'public, max-age=60',
               'X-Edge-Cache': 'HIT',
             },
           });
         }

         // Miss — fetch from origin and cache
         const originResponse = await fetch(`${env.ORIGIN_URL}/api/inventory/${productId}`);
         const data = await originResponse.json();

         await env.INVENTORY_KV.put(productId, JSON.stringify(data), {expirationTtl: 60});

         return new Response(JSON.stringify(data), {
           headers: {'Content-Type': 'application/json', 'X-Edge-Cache': 'MISS'},
         });
       }

       // All other requests proxy to origin
       return fetch(request);
     },
   };
   ```

   Configure Workers KV bindings in `wrangler.toml`:
   ```toml
   name = "commerce-edge"
   main = "src/index.ts"
   compatibility_date = "2025-01-01"

   [[kv_namespaces]]
   binding = "INVENTORY_KV"
   id = "your-kv-namespace-id"

   [[kv_namespaces]]
   binding = "CATALOG_KV"
   id = "your-catalog-kv-id"

   [triggers]
   crons = ["*/1 * * * *"]  # Update inventory every minute
   ```

4. **Edge-side personalization without breaking cache**

   Personalizing pages at the edge avoids the latency of a round-trip to the origin but requires care to avoid cache pollution:

   ```typescript
   // Technique: Cache the "shell" and inject personalization at the edge
   // 1. The origin serves a cached HTML shell with placeholders
   // 2. The edge Worker injects personalization using cookies/headers

   export default {
     async fetch(request: Request, env: Env): Promise<Response> {
       const url = new URL(request.url);

       if (url.pathname.startsWith('/products/')) {
         // Fetch cached page shell from origin or cache
         const cacheKey = new Request(url.toString(), {method: 'GET'});
         const cache = caches.default;
         let response = await cache.match(cacheKey);

         if (!response) {
           response = await fetch(request);
           // Cache the shell (without personalization)
           const cloned = response.clone();
           env.ctx?.waitUntil(cache.put(cacheKey, cloned));
         }

         // Read personalization from edge KV (populated at login)
         const customerId = request.headers.get('x-customer-id');
         if (customerId) {
           const prefs = await env.PREFS_KV.get(customerId, 'json') as CustomerPrefs | null;

           if (prefs) {
             // Inject customer tier into the response HTML
             const html = await response.text();
             const personalized = html.replace(
               '<!--CUSTOMER_TIER-->',
               `<span class="tier-badge" data-tier="${prefs.tier}">${prefs.tier}</span>`
             );

             return new Response(personalized, {
               headers: {...Object.fromEntries(response.headers), 'Vary': 'x-customer-id'},
             });
           }
         }

         return response;
       }

       return fetch(request);
     },
   };
   ```

5. **Implement edge request coalescing for hot catalog items**

   During a product drop, the same popular product URL is requested by thousands of users simultaneously. Edge coalescing serves one origin request to all concurrent waiters:

   ```typescript
   // Cloudflare Worker with request coalescing using Durable Objects
   import {DurableObjectNamespace, DurableObjectState} from '@cloudflare/workers-types';

   export class CatalogCoalescer {
     state: DurableObjectState;
     inflight: Map<string, Promise<Response>> = new Map();

     constructor(state: DurableObjectState) {
       this.state = state;
     }

     async fetch(request: Request): Promise<Response> {
       const url = new URL(request.url);
       const key = url.pathname + url.search;

       // If there's already an in-flight request for this key, wait for it
       const existing = this.inflight.get(key);
       if (existing) {
         const result = await existing;
         return result.clone();
       }

       // First request: fetch origin and coalesce subsequent waiters
       const fetchPromise = fetch(request).then(async res => {
         const body = await res.arrayBuffer();
         // Store in cache
         this.inflight.delete(key);
         return new Response(body, res);
       });

       this.inflight.set(key, fetchPromise);
       const result = await fetchPromise;
       return result.clone();
     }
   }
   ```

6. **Monitor edge performance and cache hit rates**

   ```typescript
   // Add cache telemetry to every Worker response
   export default {
     async fetch(request: Request, env: Env): Promise<Response> {
       const startTime = Date.now();
       const cacheStatus = await checkCache(request);
       const response = await handleRequest(request, env, cacheStatus);

       const duration = Date.now() - startTime;

       // Log to Cloudflare Workers Analytics Engine
       await env.ANALYTICS.writeDataPoint({
         blobs: [
           new URL(request.url).pathname,
           request.headers.get('cf-ipcountry') ?? 'unknown',
           cacheStatus,
         ],
         doubles: [duration, response.status],
         indexes: [new URL(request.url).hostname],
       });

       return response;
     },
   };
   ```

## Examples

### Vercel Edge Config for feature flags

```typescript
// Use Vercel Edge Config for ultra-fast feature flag reads at the edge
import {get} from '@vercel/edge-config';

export async function middleware(request: NextRequest) {
  // Edge Config reads are ~0ms — stored in the PoP
  const maintenanceMode = await get<boolean>('maintenance_mode');
  const checkoutDisabled = await get<boolean>('checkout_disabled');

  if (maintenanceMode) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  if (checkoutDisabled && request.nextUrl.pathname === '/checkout') {
    return NextResponse.rewrite(new URL('/checkout-unavailable', request.url));
  }

  return NextResponse.next();
}
```

### Cloudflare Workers dynamic pricing by region

```typescript
// Apply region-specific pricing rules at the edge without origin round-trip
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const country = request.headers.get('CF-IPCountry') ?? 'US';

    // Regional price multipliers stored in KV
    const pricingConfig = await env.PRICING_KV.get(country, 'json') as {
      currency: string;
      taxRate: number;
      dutyRate: number;
    } | null;

    if (pricingConfig) {
      // Add pricing context to request headers forwarded to origin
      const modifiedRequest = new Request(request, {
        headers: {
          ...Object.fromEntries(request.headers),
          'x-currency': pricingConfig.currency,
          'x-tax-rate': pricingConfig.taxRate.toString(),
          'x-duty-rate': pricingConfig.dutyRate.toString(),
        },
      });
      return fetch(modifiedRequest);
    }

    return fetch(request);
  },
};
```

## Best Practices

- **Use Edge Middleware for routing decisions, not business logic** — edge functions are best for fast decisions based on request metadata (country, cookie, header); complex business logic belongs at the origin
- **Keep edge functions small and fast** — edge workers have memory and CPU limits; functions exceeding 10ms CPU time may be killed; keep them under 5MB bundle size
- **Warm KV caches before product launches** — Workers KV has eventual consistency; pre-populate the edge KV cache before a flash sale using the KV API from your origin
- **Use `Vary` headers carefully** — if edge responses vary by header (e.g., `Vary: x-customer-tier`), each variant is cached separately; this multiplies cache storage requirements
- **Test geo-routing from multiple locations** — use a VPN or `cf-ipcountry` spoofing in development; production geo-routing mistakes affect all users in a region
- **Monitor edge error rates separately from origin errors** — edge errors (e.g., KV read failures) have a different failure mode than origin errors; instrument them separately
- **Apply idempotency to edge-side writes** — edge workers may execute more than once per user request due to retries; ensure any writes (cookie setting, analytics events) are idempotent

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Edge Middleware making external API calls on every request | Cache external data in Edge Config or Workers KV; never make a synchronous fetch to a third-party API from edge middleware on the critical path |
| Personalized responses cached without `Vary` header | Set `Vary: Cookie` or a custom header that differentiates personalized responses; without it, one user's personalized page is served to all users |
| Workers KV eventually-consistent reads causing stale inventory | Accept stale inventory at the edge and validate against the source of truth at checkout time; never use edge KV as the authoritative inventory count |
| A/B variant flickering on first load | Set the variant cookie in the response and redirect to the same URL on the first request to avoid the page rendering before the cookie is set |
| Edge function bundle too large | Tree-shake dependencies; avoid importing large libraries (lodash, moment); use native Web APIs available in the Workers runtime |

## Related Skills

- @jamstack-storefront
- @image-optimization-cdn
- @flash-sale-scaling
- @commerce-api-gateway
- @monitoring-alerting-commerce
