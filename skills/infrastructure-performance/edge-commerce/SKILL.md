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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Edge Commerce

## Overview

Edge computing executes code in the CDN PoP closest to each user, reducing latency from hundreds of milliseconds (round-trip to a central origin) to under 50ms. For e-commerce, this enables geo-routing (redirect UK users to a UK storefront), edge-side personalization (inject user tier into cached pages), instant A/B testing without origin round-trips, and distributed inventory caching via edge KV stores.

## When to Use This Skill

- When pages routed through a central origin have high TTFB (>300ms) for international users
- When you need to redirect users to region-specific storefronts or localized product catalogs
- When you want to run A/B tests without adding JavaScript that delays page rendering
- When building a multi-region deployment where each region needs its own origin but shares a single domain

## Core Instructions

### Step 1: Determine your platform and what edge computing can do for you

| Platform | Edge Capabilities | How to Use Them |
|----------|-----------------|----------------|
| **Shopify** | Shopify's CDN (Fastly) already serves stores from global edge locations | Use Shopify Markets for geo-routing and multi-currency without custom edge code; Markets handles currency, language, and domain routing natively |
| **WooCommerce** | Add Cloudflare as your CDN/proxy to get edge capabilities | Cloudflare Workers (free tier: 100k requests/day) adds edge logic; configure in Cloudflare dashboard after adding your domain |
| **BigCommerce** | BigCommerce uses Fastly CDN globally | Use BigCommerce's built-in multi-storefront feature for geo-routing; for custom edge logic add Cloudflare in front |
| **Custom / Headless** | Full control — choose Cloudflare Workers, Vercel Edge Middleware, or Fastly Compute | Build custom geo-routing, A/B testing, and personalization at the edge; see implementation below |

### Step 2: Configure geo-routing on your platform

---

#### Shopify: Use Shopify Markets

1. Go to **Settings → Markets** in your Shopify admin
2. Click **Add market** and select the countries/regions for your new market
3. Configure per-market settings:
   - **Currency**: set the local currency (Shopify handles conversion automatically)
   - **Language**: assign a translated theme version
   - **Domain/subdomain**: e.g., `uk.yourstore.com` routes UK visitors automatically
4. Shopify automatically redirects users to their market based on IP geolocation — no custom code needed
5. For manual market URL overrides: Shopify's cookie-based market selector handles users who want to change their market

---

#### WooCommerce: Cloudflare Workers geo-routing

1. Add your domain to **Cloudflare** (free plan is sufficient for geo-routing)
2. Go to **Workers & Pages → Create Worker** in the Cloudflare dashboard
3. Add a simple geo-redirect rule:
```javascript
// Cloudflare Worker — deploy via Cloudflare dashboard
export default {
  async fetch(request) {
    const country = request.headers.get('CF-IPCountry') ?? 'US';
    const url = new URL(request.url);

    // Redirect UK users to UK store variant
    if (country === 'GB' && !url.pathname.startsWith('/uk')) {
      return Response.redirect(`https://${url.hostname}/uk${url.pathname}`, 302);
    }

    return fetch(request);
  }
};
```
4. In Worker settings, add a **Route** that matches your domain: `*yourstore.com/*`
5. For currency/language: use a WooCommerce multi-currency plugin (WPML + WooCommerce Multilingual, or Aelia Currency Switcher) that reads the URL path or a cookie set by the Worker

---

#### Custom / Headless

**Vercel Edge Middleware (Next.js) for geo-routing:**
```typescript
// middleware.ts — runs at the edge globally, <5ms
import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

const REGION_MAP: Record<string, string> = {
  GB: 'uk', DE: 'de', FR: 'fr', CA: 'ca', AU: 'au',
};

export function middleware(request: NextRequest) {
  const { country } = geolocation(request);
  const region = country ? REGION_MAP[country] : null;

  // Redirect root to regional store
  if (region && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${region}`;
    return NextResponse.redirect(url, { status: 302 });
  }

  // Pass country to origin for catalog/pricing logic
  const response = NextResponse.next();
  if (country) response.headers.set('x-user-country', country);
  return response;
}

export const config = { matcher: ['/', '/products/:path*', '/collections/:path*'] };
```

**Edge A/B testing (assign variant once, persist in cookie):**
```typescript
// In middleware.ts — no origin round-trip needed
const EXPERIMENTS = [
  { id: 'checkout-cta', buckets: [{ name: 'control', weight: 0.5 }, { name: 'variant-a', weight: 0.5 }] },
];

function assignVariant(buckets: Array<{name: string; weight: number}>) {
  let r = Math.random(), cumulative = 0;
  for (const b of buckets) {
    cumulative += b.weight;
    if (r < cumulative) return b.name;
  }
  return buckets[0].name;
}

// Add to existing middleware function:
for (const exp of EXPERIMENTS) {
  const cookieName = `ab_${exp.id}`;
  let variant = request.cookies.get(cookieName)?.value;
  if (!variant) {
    variant = assignVariant(exp.buckets);
    response.cookies.set(cookieName, variant, { maxAge: 30 * 24 * 3600, httpOnly: true });
  }
  response.headers.set(`x-ab-${exp.id}`, variant); // available in your app for rendering
}
```

**Cloudflare Workers KV for edge inventory caching:**
```typescript
// cloudflare-worker.ts — inventory cached at every Cloudflare PoP globally
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/inventory/')) {
      const productId = url.pathname.replace('/api/inventory/', '');
      const cached = await env.INVENTORY_KV.get(productId, 'json');

      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { 'Content-Type': 'application/json', 'X-Edge-Cache': 'HIT' },
        });
      }

      // Cache miss — fetch from origin and store for 60 seconds
      const data = await fetch(`${env.ORIGIN_URL}/api/inventory/${productId}`).then(r => r.json());
      await env.INVENTORY_KV.put(productId, JSON.stringify(data), { expirationTtl: 60 });
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'X-Edge-Cache': 'MISS' },
      });
    }

    return fetch(request);
  },
};
```
KV namespace wrangler.toml:
```toml
name = "commerce-edge"
main = "src/index.ts"
compatibility_date = "2025-01-01"
[[kv_namespaces]]
binding = "INVENTORY_KV"
id = "your-kv-namespace-id"
```

**Vercel Edge Config for instant feature flags:**
```typescript
// Read feature flags at edge — ~0ms latency (stored in PoP)
import { get } from '@vercel/edge-config';

export async function middleware(request: NextRequest) {
  const maintenanceMode = await get<boolean>('maintenance_mode');
  if (maintenanceMode) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }
  return NextResponse.next();
}
```

### Step 3: Monitor edge performance

Regardless of platform, measure these metrics:

1. **TTFB from multiple regions** — use tools like WebPageTest.org with test locations in US, EU, and Asia; target under 200ms TTFB from each region
2. **CDN cache hit rate** — Cloudflare: **Analytics → Performance → Cache hit rate** (target 90%+); Shopify: check Lighthouse via **Online Store → Themes → View report**
3. **Edge error rate** — Cloudflare: **Workers → Metrics**; Vercel: **Deployments → Functions** tab
4. **Geographic latency breakdown** — Cloudflare Analytics shows latency by country; use this to identify regions that would benefit from an additional origin

## Best Practices

- **Use edge for routing decisions, not business logic** — edge functions are best for fast decisions based on request metadata (country, cookie, header); complex business logic (pricing, inventory) belongs at the origin with a result cached at the edge
- **Keep edge functions fast** — Cloudflare Workers have 10ms CPU limit on free plan, 30ms on paid; avoid synchronous external API calls from edge middleware on the critical path
- **Pre-populate KV before product launches** — Workers KV has eventual consistency; pre-populate edge inventory cache before a flash sale via the KV REST API
- **Test geo-routing from multiple locations** — use a VPN to verify redirect logic; production geo-routing mistakes affect all users in a region

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Edge making external API calls on every request | Cache external data in Edge Config or Workers KV; never make synchronous third-party API calls from edge middleware on the critical path |
| Personalized responses cached without `Vary` header | Set `Vary: Cookie` or a custom header that differentiates personalized responses; without it, one user's content can be served to others |
| Workers KV stale inventory causing oversells | Use edge KV only for displaying inventory status; always validate against the authoritative inventory source at checkout time |
| A/B variant flickering on first load | Set the variant cookie in the response before the page renders; on first visit, set the cookie and redirect to ensure consistent rendering |

## Related Skills

- @ecommerce-caching
- @flash-sale-scaling
- @monitoring-alerting-commerce
- @image-optimization-cdn
