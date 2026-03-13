---
name: ecommerce-caching
description: "Improve store performance with a layered caching strategy — CDN edge caching, Redis application cache, and smart cart-aware invalidation"
category: infrastructure-performance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [caching, cdn, redis, varnish, performance, cache-invalidation, edge-caching]
triggers: ["implement ecommerce caching", "add caching layer", "cache invalidation strategy", "CDN configuration for store"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# E-commerce Caching

## Overview

Implement multi-layer caching for e-commerce applications covering CDN edge caching, application-level caching (Redis), and full-page caching with cart-aware invalidation. This skill addresses the unique challenges of caching commerce pages — personalized content (cart count, logged-in state), frequently changing inventory and prices, and the need for instant cache purging when products or prices change.

## When to Use This Skill

- When product and collection pages are slow due to database queries and API calls
- When implementing a CDN or edge caching strategy for a storefront
- When adding Redis caching for product data, inventory, and session management
- When building cache invalidation logic that reacts to product, price, or inventory changes
- When optimizing time-to-first-byte (TTFB) for high-traffic sale events

## Core Instructions

### Step 1: Determine your platform and what you can control

| Platform | What's Managed For You | What You Control |
|----------|----------------------|-----------------|
| **Shopify** | CDN, full-page caching, server infrastructure | Liquid template efficiency, image optimization, app performance, HTTP cache headers on custom routes |
| **WooCommerce** | Nothing (you own the server) | Everything: page cache, object cache, CDN, database queries |
| **BigCommerce** | CDN, full-page caching, server infrastructure | Theme performance, image optimization, app overhead |
| **Custom / Headless** | Nothing (you own the server) | Everything: CDN configuration, Redis, Varnish, application cache, invalidation |

### Step 2: Platform-specific caching configuration

---

#### Shopify

Shopify handles CDN and full-page caching automatically. Your optimization levers are:

**Theme performance (Liquid):**
1. Reduce the number of Liquid `{% render %}` calls in your product and collection templates — each render tag adds rendering time
2. In **Online Store → Themes → Edit code**, avoid loops that query the catalog repeatedly; use `{% liquid %}` blocks for conditional logic
3. Enable Shopify's **Lazy loading** for product images in Theme settings — this prevents below-fold images from blocking page load

**App performance:**
1. Audit your installed apps in **Apps → App usage** or with **Shopify's Storefront Performance dashboard** (Online Store → Themes → View report)
2. Apps that inject scripts into every page (especially checkout) can add 200–500ms per page load
3. Remove unused apps — even inactive apps with installed scripts slow down your store
4. For apps that add storefront JavaScript, check if they support **Delayed loading** (loads after page interactive) in their settings

**CDN image optimization:**
Shopify automatically serves images via its CDN with WebP conversion and responsive sizing. To ensure you're using this:
1. Always use Shopify's Liquid `img_url` filter to generate image URLs — this routes through the Shopify CDN
2. Add `width` and `height` attributes to all `<img>` tags in your Liquid to prevent Cumulative Layout Shift
3. In **Online Store → Themes → Customize → Theme settings → Images**, verify lazy loading is enabled

---

#### WooCommerce

WooCommerce runs on your hosting infrastructure. Implement a three-layer caching stack:

**Layer 1: PHP Object Cache (Redis)**
1. Your hosting must support Redis (WP Engine, Kinsta, Cloudways, and most managed WordPress hosts do — check your control panel)
2. Install **Redis Object Cache** (free, wordpress.org)
3. Go to **Settings → Redis** and click **Enable Object Cache**
4. This caches all WordPress and WooCommerce database queries in Redis; most stores see 60–80% reduction in database load

**Layer 2: Page Cache**
1. Install **WP Rocket** ($59/yr — the most effective WordPress page cache plugin) or **LiteSpeed Cache** (free, if your host uses LiteSpeed)
2. In WP Rocket: go to **Cache → Enable caching for logged-in WordPress users** — keep this **off**; cached pages should only serve anonymous visitors
3. Enable **Preload cache**: WP Rocket will crawl and pre-cache your product and shop pages
4. Enable **Separate cache file for mobile** if your mobile and desktop layouts differ significantly

**Layer 3: CDN**
1. Configure **Cloudflare** (free tier available) as your CDN:
   - Add your domain to Cloudflare and point DNS to Cloudflare's nameservers
   - Install the **Cloudflare** WordPress plugin to enable cache purging from wp-admin
   - Set **Caching level** to Standard in Cloudflare dashboard
   - In WP Rocket, enable **Cloudflare** integration in the CDN settings — this allows WP Rocket to purge Cloudflare cache when you update products
2. Or use **BunnyCDN** ($1/mo for bandwidth) which integrates with WP Rocket natively

**Cache invalidation for WooCommerce:**
WP Rocket and LiteSpeed Cache automatically purge cached pages when products are updated via the wp-admin. For programmatic updates, add this to your child theme's `functions.php`:
```php
// Purge product page cache when inventory or price changes
add_action('woocommerce_product_set_stock', function($product) {
    if (function_exists('rocket_clean_post')) {
        rocket_clean_post($product->get_id()); // WP Rocket
    }
    if (class_exists('LiteSpeed_Cache_API')) {
        LiteSpeed_Cache_API::purge_post($product->get_id()); // LiteSpeed
    }
});
```

---

#### Custom / Headless

**Cache layers for a headless Node.js storefront:**

```
Browser → CDN (Cloudflare/Fastly) → Application server → Redis → Database
          [Static assets: 1yr]     [Product data: 5min]  [Catalog queries]
          [Product pages: 5min]
          [Cart: never]
```

**HTTP cache headers by content type:**
```javascript
// middleware/cacheHeaders.js
export function setCacheHeaders(req, res, next) {
  const path = req.path;

  // Cart, checkout, account — never cache (personalized)
  if (path.startsWith('/cart') || path.startsWith('/checkout') || path.startsWith('/account')) {
    res.setHeader('Cache-Control', 'private, no-store');
    return next();
  }

  // Product pages — 5 min at CDN, serve stale while revalidating
  if (path.match(/^\/products\/[\w-]+$/)) {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('Surrogate-Key', `product product-${path.split('/').pop()}`);
    return next();
  }

  // Collection pages
  if (path.match(/^\/collections\/[\w-]+$/)) {
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1200');
    res.setHeader('Surrogate-Key', `collection collection-${path.split('/').pop()}`);
    return next();
  }

  // Static assets with content hash in filename — immutable for 1 year
  if (path.match(/\.(js|css|png|jpg|webp|woff2|svg)(\?|$)/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return next();
  }

  next();
}
```

**Redis product cache (cache-aside pattern):**
```javascript
// lib/productCache.js
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function getCachedProduct(productId, fetchFn) {
  const key = `product:${productId}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const product = await fetchFn();
  // Non-blocking write — serve response immediately
  redis.setex(key, 300, JSON.stringify(product)).catch(() => {});
  return product;
}

export async function invalidateProduct(productId, productSlug, collectionIds = []) {
  const keys = [
    `product:${productId}`,
    `product:slug:${productSlug}`,
    ...collectionIds.map(id => `collection:${id}`),
  ];
  await redis.del(...keys);
}
```

**Personalized content (cart count, inventory) loaded client-side after cached page:**
```html
<!-- Serve the cached page with placeholder for personalized data -->
<span id="cart-count" data-hydrate="true">0</span>

<script>
  // Load personalized data after the cached page renders
  fetch('/api/session-data', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      document.getElementById('cart-count').textContent = data.cartCount;
    });
</script>
```
```javascript
// GET /api/session-data — NOT cached, reads from Redis
export async function sessionData(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const sessionId = req.cookies.session_id;
  const cartCount = sessionId ? await redis.get(`cart:count:${sessionId}`) : '0';
  res.json({ cartCount: parseInt(cartCount ?? '0') });
}
```

**Event-driven cache invalidation:**
```javascript
// React to product/price changes from your webhook or admin
export async function onProductUpdated({ productId, productSlug, collectionIds }) {
  // 1. Invalidate Redis cache
  await invalidateProduct(productId, productSlug, collectionIds);

  // 2. Purge CDN (Cloudflare example)
  await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: [`product-${productSlug}`] }), // tag-based purge (Cloudflare Enterprise)
    // For free/Pro Cloudflare, use files: [`https://store.com/products/${productSlug}`]
  });
}
```

## Best Practices

- **Use `stale-while-revalidate`** — serve cached content instantly while fetching a fresh version in the background; this eliminates cache miss latency for users
- **Cache the page, hydrate personalization client-side** — cache full HTML for anonymous visitors and load cart count / inventory via a fast `no-store` API call
- **Invalidate on stock-status change, not every inventory update** — a quantity change from 50 to 49 doesn't need a purge; 1 to 0 (out-of-stock) does
- **Strip tracking parameters for better CDN hit rates** — `?utm_source=email&utm_campaign=spring` creates unique cache entries; strip these at the CDN or in your URL normalization
- **Monitor cache hit rate** — target 90%+ at CDN; use `X-Cache` response headers to identify frequent cache misses

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart count shows 0 on cached pages | Never embed cart count in cached HTML; load it client-side via a fast `no-store` API endpoint after page load |
| Product price updated but CDN shows old price | Implement event-driven invalidation that purges CDN on price change; don't rely on TTL expiration alone |
| Thundering herd when cache expires | Use `stale-while-revalidate` so only one request revalidates while all others get slightly stale content |
| Low CDN hit rate | Normalize URLs by stripping tracking params; minimize `Vary` headers (e.g., `Vary: Cookie` effectively disables caching) |
| Redis memory grows unbounded | Set `maxmemory` and `maxmemory-policy allkeys-lru` in Redis config; monitor eviction rate |

## Related Skills

- @flash-sale-scaling
- @edge-commerce
- @database-optimization-commerce
- @monitoring-alerting-commerce
