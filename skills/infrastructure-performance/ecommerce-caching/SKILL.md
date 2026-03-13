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
platforms: [platform-agnostic]
difficulty: advanced
---

# E-commerce Caching

## Overview

Implement multi-layer caching for e-commerce applications covering CDN edge caching, application-level caching (Redis/Memcached), database query caching, and full-page caching with cart-aware invalidation. This skill addresses the unique challenges of caching commerce pages — personalized content (cart count, logged-in state), frequently changing inventory and prices, dynamic promotions, and the need for instant cache purging when products or prices change.

## When to Use This Skill

- When product and collection pages are slow due to database queries and API calls
- When implementing a CDN or edge caching strategy for a storefront
- When adding Redis caching for product data, inventory, and session management
- When building cache invalidation logic that reacts to product, price, or inventory changes
- When optimizing time-to-first-byte (TTFB) for high-traffic sale events

## Core Instructions

1. **Design the caching layer architecture**

   ```
   Request flow with caching layers:

   Browser --> CDN (edge cache) --> Reverse Proxy (Varnish/Nginx) --> Application --> Redis --> Database
       |                              |                              |          |
   Static assets              Full-page cache              Object cache    Query cache
   (CSS, JS, images)          (HTML for anonymous)         (products,      (materialized
    TTL: 1 year                TTL: 5-15 min               prices)         views)
                                                           TTL: 1-5 min
   ```

   ```typescript
   // Cache configuration by content type
   const CACHE_CONFIG = {
     // Static assets: long TTL, immutable when content-hashed
     staticAssets: {
       cdnTtl: 365 * 24 * 60 * 60,  // 1 year
       headers: 'public, max-age=31536000, immutable',
     },
     // Product pages: short TTL, stale-while-revalidate for fast responses
     productPage: {
       cdnTtl: 300,                   // 5 minutes at edge
       appTtl: 60,                    // 1 minute in app cache
       headers: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
     },
     // Collection pages: moderate TTL
     collectionPage: {
       cdnTtl: 600,                   // 10 minutes
       appTtl: 120,                   // 2 minutes
       headers: 'public, max-age=120, s-maxage=600, stale-while-revalidate=1200',
     },
     // Cart and checkout: never cache
     cart: {
       headers: 'private, no-store, no-cache, must-revalidate',
     },
     // API responses for product data
     productApi: {
       redisTtl: 300,                 // 5 minutes
       headers: 'public, max-age=60, s-maxage=300',
     },
   };
   ```

2. **Implement Redis-based application caching**

   ```typescript
   import Redis from 'ioredis';

   class ProductCache {
     private redis: Redis;
     private prefix = 'product:';

     constructor(redisUrl: string) {
       this.redis = new Redis(redisUrl, {
         maxRetriesPerRequest: 3,
         enableReadyCheck: true,
         retryStrategy: (times) => Math.min(times * 50, 2000),
       });
     }

     async getProduct(productId: string): Promise<Product | null> {
       const cached = await this.redis.get(`${this.prefix}${productId}`);
       if (cached) {
         return JSON.parse(cached);
       }
       return null;
     }

     async setProduct(product: Product, ttlSeconds = 300): Promise<void> {
       const key = `${this.prefix}${product.id}`;
       await this.redis.setex(key, ttlSeconds, JSON.stringify(product));

       // Also index by slug for URL-based lookups
       await this.redis.setex(
         `${this.prefix}slug:${product.slug}`,
         ttlSeconds,
         product.id
       );
     }

     async invalidateProduct(productId: string): Promise<void> {
       const product = await this.getProduct(productId);
       const keys = [`${this.prefix}${productId}`];

       if (product) {
         keys.push(`${this.prefix}slug:${product.slug}`);
         // Invalidate any collection pages that include this product
         for (const collectionId of product.collectionIds || []) {
           keys.push(`collection:${collectionId}`);
         }
       }

       if (keys.length > 0) {
         await this.redis.del(...keys);
       }
     }

     // Cache-aside pattern with stale-while-revalidate
     async getOrFetch(
       productId: string,
       fetchFn: () => Promise<Product>
     ): Promise<Product> {
       const cached = await this.getProduct(productId);
       if (cached) return cached;

       const product = await fetchFn();
       // Don't await cache write — serve response immediately
       this.setProduct(product).catch(err =>
         console.warn('Cache write failed:', err)
       );
       return product;
     }

     // Bulk cache warm for collection pages
     async warmCollection(products: Product[]): Promise<void> {
       const pipeline = this.redis.pipeline();
       for (const product of products) {
         pipeline.setex(
           `${this.prefix}${product.id}`,
           300,
           JSON.stringify(product)
         );
       }
       await pipeline.exec();
     }
   }
   ```

3. **Configure CDN caching with surrogate keys for targeted purging**

   ```typescript
   // Middleware to set cache headers based on page type
   function cacheHeaders(req: Request, res: Response, next: NextFunction) {
     const path = req.path;

     // Cart and checkout — never cache
     if (path.startsWith('/cart') || path.startsWith('/checkout') || path.startsWith('/account')) {
       res.setHeader('Cache-Control', CACHE_CONFIG.cart.headers);
       // Surrogate-Control tells CDN to not cache even if Cache-Control is lax
       res.setHeader('Surrogate-Control', 'no-store');
       return next();
     }

     // Product pages
     if (path.match(/^\/products\/[\w-]+$/)) {
       res.setHeader('Cache-Control', CACHE_CONFIG.productPage.headers);
       // Surrogate-Key for targeted CDN purging (Fastly, Cloudflare Enterprise)
       const slug = path.split('/').pop();
       res.setHeader('Surrogate-Key', `product product-${slug}`);
       return next();
     }

     // Collection pages
     if (path.match(/^\/collections\/[\w-]+$/)) {
       res.setHeader('Cache-Control', CACHE_CONFIG.collectionPage.headers);
       const collectionSlug = path.split('/').pop();
       res.setHeader('Surrogate-Key', `collection collection-${collectionSlug}`);
       return next();
     }

     // Static assets
     if (path.match(/\.(js|css|png|jpg|webp|woff2|svg)$/)) {
       res.setHeader('Cache-Control', CACHE_CONFIG.staticAssets.headers);
       return next();
     }

     next();
   }
   ```

   ```typescript
   // CDN cache purging via Fastly API
   class FastlyCachePurger {
     constructor(
       private apiKey: string,
       private serviceId: string
     ) {}

     // Purge by surrogate key (instant, targeted)
     async purgeByKey(key: string): Promise<void> {
       await fetch(
         `https://api.fastly.com/service/${this.serviceId}/purge/${key}`,
         {
           method: 'POST',
           headers: {
             'Fastly-Key': this.apiKey,
             'Fastly-Soft-Purge': '1',  // Soft purge: serve stale while revalidating
           },
         }
       );
     }

     // Purge all product pages for a specific product
     async purgeProduct(slug: string): Promise<void> {
       await this.purgeByKey(`product-${slug}`);
     }

     // Purge all collection pages (e.g., after a bulk price change)
     async purgeAllCollections(): Promise<void> {
       await this.purgeByKey('collection');
     }
   }
   ```

4. **Handle personalized content with client-side hydration**

   ```typescript
   // Strategy: Serve cached pages with a placeholder for personalized content,
   // then hydrate on the client side via a fast API call

   // Server: Render the page without personalized data
   function renderProductPage(product: Product): string {
     return `
       <html>
       <body>
         <header>
           <!-- Cart count placeholder — hydrated client-side -->
           <span id="cart-count" data-hydrate="cart-count">0</span>
         </header>
         <main>
           <h1>${escapeHtml(product.title)}</h1>
           <p>${formatPrice(product.price)}</p>
           <!-- Inventory status: hydrated client-side for real-time accuracy -->
           <div id="inventory-status" data-hydrate="inventory"
                data-product-id="${product.id}">
             Loading availability...
           </div>
         </main>
         <script>
           // Hydrate personalized elements after cached page loads
           fetch('/api/personalization?productId=${product.id}', { credentials: 'include' })
             .then(function(r) { return r.json(); })
             .then(function(data) {
               document.getElementById('cart-count').textContent = data.cartCount;
               document.getElementById('inventory-status').textContent =
                 data.inventory > 0 ? 'In Stock' : 'Out of Stock';
             });
         </script>
       </body>
       </html>
     `;
   }

   // Personalization API endpoint: NOT cached, fast response from Redis
   // GET /api/personalization?productId=123
   async function personalizationApi(req: Request, res: Response) {
     res.setHeader('Cache-Control', 'private, no-store');

     const productId = req.query.productId as string;
     const sessionId = req.cookies.session_id;

     const [cartCount, inventory] = await Promise.all([
       sessionId ? redis.get(`cart:count:${sessionId}`) : Promise.resolve('0'),
       redis.get(`inventory:${productId}`),
     ]);

     res.json({
       cartCount: parseInt(cartCount || '0'),
       inventory: parseInt(inventory || '0'),
     });
   }
   ```

5. **Build event-driven cache invalidation**

   ```typescript
   // Cache invalidation bus — react to product, price, and inventory changes
   class CacheInvalidator {
     constructor(
       private productCache: ProductCache,
       private cdnPurger: FastlyCachePurger,
       private logger: Logger
     ) {}

     // Product updated (title, description, images)
     async onProductUpdated(event: { productId: string; slug: string }): Promise<void> {
       await Promise.all([
         this.productCache.invalidateProduct(event.productId),
         this.cdnPurger.purgeProduct(event.slug),
       ]);
       this.logger.info(`Cache invalidated for product ${event.slug}`);
     }

     // Price changed — invalidate product + all collections containing it
     async onPriceChanged(event: {
       productId: string;
       slug: string;
       collectionSlugs: string[];
     }): Promise<void> {
       await Promise.all([
         this.productCache.invalidateProduct(event.productId),
         this.cdnPurger.purgeProduct(event.slug),
         ...event.collectionSlugs.map(s => this.cdnPurger.purgeByKey(`collection-${s}`)),
       ]);
     }

     // Inventory changed — update Redis inventory counter, soft-purge if stock status changed
     async onInventoryChanged(event: {
       productId: string;
       slug: string;
       previousQty: number;
       newQty: number;
     }): Promise<void> {
       // Update real-time inventory in Redis (used by personalization API)
       await redis.set(`inventory:${event.productId}`, String(event.newQty), 'EX', 3600);

       // Only purge full page cache if stock status changed (in-stock <-> out-of-stock)
       const wasInStock = event.previousQty > 0;
       const isInStock = event.newQty > 0;

       if (wasInStock !== isInStock) {
         await Promise.all([
           this.productCache.invalidateProduct(event.productId),
           this.cdnPurger.purgeProduct(event.slug),
         ]);
         this.logger.info(`Stock status changed for ${event.slug}: ${wasInStock} -> ${isInStock}`);
       }
     }

     // Bulk operation (e.g., catalog import) — purge everything
     async onBulkCatalogUpdate(): Promise<void> {
       await this.cdnPurger.purgeByKey('product');
       await this.cdnPurger.purgeByKey('collection');
       this.logger.warn('Full product/collection cache purge triggered by bulk catalog update');
     }
   }
   ```

6. **Implement database query caching with materialized views**

   ```sql
   -- Materialized view for collection page data (PostgreSQL)
   -- Pre-computes product listing data to avoid expensive JOINs on every page load
   CREATE MATERIALIZED VIEW collection_product_listing AS
   SELECT
     cp.collection_id,
     p.id AS product_id,
     p.title,
     p.slug,
     p.status,
     MIN(v.price) AS min_price,
     MAX(v.price) AS max_price,
     SUM(v.inventory_quantity) AS total_inventory,
     BOOL_OR(v.inventory_quantity > 0) AS in_stock,
     (SELECT pi.src FROM product_images pi
      WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS featured_image,
     p.updated_at
   FROM collection_products cp
   JOIN products p ON p.id = cp.product_id
   JOIN product_variants v ON v.product_id = p.id
   WHERE p.status = 'active'
   GROUP BY cp.collection_id, p.id, p.title, p.slug, p.status, p.updated_at, cp.position
   ORDER BY cp.position;

   CREATE UNIQUE INDEX idx_collection_listing
     ON collection_product_listing(collection_id, product_id);

   -- Refresh on a schedule (every 5 minutes) or after product changes
   REFRESH MATERIALIZED VIEW CONCURRENTLY collection_product_listing;
   ```

   ```typescript
   // Refresh materialized view on product change
   async function refreshCollectionListings(): Promise<void> {
     await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY collection_product_listing');
   }

   // Use in collection page handler
   async function getCollectionProducts(collectionId: string, page: number, limit: number) {
     const offset = (page - 1) * limit;
     const result = await db.query(
       `SELECT * FROM collection_product_listing
        WHERE collection_id = $1
        ORDER BY min_price ASC
        LIMIT $2 OFFSET $3`,
       [collectionId, limit, offset]
     );
     return result.rows;
   }
   ```

## Examples

### Varnish VCL for e-commerce full-page caching

```vcl
# varnish.vcl — Full-page cache with cart-awareness
vcl 4.1;

backend default {
    .host = "127.0.0.1";
    .port = "3000";
}

sub vcl_recv {
    # Never cache cart, checkout, or account pages
    if (req.url ~ "^/(cart|checkout|account|api/)") {
        return (pass);
    }

    # Never cache POST requests
    if (req.method != "GET" && req.method != "HEAD") {
        return (pass);
    }

    # Strip marketing query params for better cache hit rates
    if (req.url ~ "\?(utm_|fbclid|gclid|mc_)") {
        set req.url = regsub(req.url, "\?.*$", "");
    }

    # Remove cookies for cacheable pages (product, collection, home)
    if (req.url ~ "^/(products|collections|$)") {
        unset req.http.Cookie;
        return (hash);
    }
}

sub vcl_backend_response {
    # Cache product pages for 5 minutes
    if (bereq.url ~ "^/products/") {
        set beresp.ttl = 300s;
        set beresp.grace = 600s;
    }

    # Cache collection pages for 10 minutes
    if (bereq.url ~ "^/collections/") {
        set beresp.ttl = 600s;
        set beresp.grace = 1200s;
    }

    # Cache homepage for 2 minutes
    if (bereq.url == "/") {
        set beresp.ttl = 120s;
        set beresp.grace = 300s;
    }
}

sub vcl_deliver {
    # Add debug header to see cache status
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
}
```

### Redis cache warming script for flash sales

```typescript
// scripts/warm-cache.ts
// Run before a flash sale to pre-populate caches

async function warmCacheForSale(collectionSlug: string) {
  const collection = await db.collections.findBySlug(collectionSlug);
  const products = await db.products.findByCollection(collection.id, { limit: 500 });

  console.log(`Warming cache for ${products.length} products in "${collectionSlug}"`);

  // 1. Warm Redis product cache
  const productCache = new ProductCache(process.env.REDIS_URL!);
  await productCache.warmCollection(products);

  // 2. Warm inventory counters
  const pipeline = redis.pipeline();
  for (const product of products) {
    for (const variant of product.variants) {
      pipeline.setex(
        `inventory:${product.id}:${variant.id}`,
        3600,
        String(variant.inventoryQuantity)
      );
    }
  }
  await pipeline.exec();

  // 3. Pre-render pages and warm CDN by fetching them
  for (const product of products) {
    await fetch(`https://store.example.com/products/${product.slug}`, {
      headers: { 'X-Cache-Warm': 'true' },
    });
    // Small delay to avoid overwhelming the origin
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('Cache warming complete.');
}

warmCacheForSale('flash-sale-spring-2026').catch(console.error);
```

## Best Practices

- **Use `stale-while-revalidate`** -- serve cached content instantly while fetching a fresh version in the background; this eliminates cache miss latency for users
- **Separate static assets from dynamic content** -- static assets (CSS/JS/images) get long TTLs with content-hash filenames; dynamic pages get short TTLs with surrogate keys
- **Cache the page shell, hydrate personalization client-side** -- cache the full HTML for anonymous users and load cart count, inventory, and logged-in state via a fast API call
- **Use surrogate keys for targeted invalidation** -- tag responses with `Surrogate-Key` headers so you can purge specific products without flushing the entire CDN cache
- **Soft-purge instead of hard-purge** -- soft purges mark content as stale but keep serving it while a fresh version is fetched; this prevents thundering herd during invalidation
- **Invalidate on stock-status change, not every inventory update** -- a quantity change from 50 to 49 doesn't need a page purge, but 1 to 0 (out-of-stock) does
- **Use Redis pipelines for bulk operations** -- when warming or invalidating many keys, pipeline commands to reduce round trips from N to 1
- **Monitor cache hit rates** -- target >90% hit rate at the CDN layer; use `X-Cache` headers and CDN analytics to identify cache misses and fix them

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart count shows 0 on cached product pages | Don't embed personalized data in the cached HTML; load cart state client-side via a fast `no-store` API endpoint |
| Product price changed but CDN still shows old price | Implement event-driven cache invalidation that purges CDN on price change events; don't rely on TTL expiration alone |
| Thundering herd on cache expiration (all requests hit origin) | Use `stale-while-revalidate` in Cache-Control and `grace` period in Varnish so only one request revalidates while others get stale content |
| Cache keys vary too much, causing low hit rates | Normalize URLs (strip tracking params, lowercase paths) and minimize Vary headers; `Vary: Cookie` effectively disables caching |
| Materialized view refresh blocks reads | Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` (requires a unique index) to allow reads during refresh |
| Redis memory grows unbounded | Set `maxmemory` and `maxmemory-policy allkeys-lru` in Redis config; monitor memory usage and eviction rate |

## Related Skills

- @ecommerce-seo
- @shipping-rate-calculator
- @product-data-modeling
- @ecommerce-data-warehouse
- @shopify-theme-development
