---
name: magento-indexing-caching
description: "Speed up Magento by managing indexers correctly, configuring Varnish full-page cache, and using Redis for session and object caching"
category: platform-magento
risk: safe
source: curated
date_added: "2026-03-12"
tags: [magento, indexing, varnish, full-page-cache, fpc, redis, cache-management, performance]
triggers: ["magento indexing", "magento varnish", "magento full page cache", "magento cache", "magento slow", "magento reindex", "adobe commerce cache"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [magento]
difficulty: advanced
---

# Magento Indexing and Caching

## Overview

Magento's performance architecture relies on two distinct layers: indexers that pre-compute denormalized data (product prices, search indexes, category paths) into flat tables, and the Full-Page Cache (FPC) that stores complete rendered HTML pages. Varnish is the recommended FPC backend for production, replacing Magento's built-in file-based cache. Redis is the recommended backend for application cache, session storage, and the default cache (block HTML, config, layout). Misconfigured or stale indexes are one of the most common causes of incorrect pricing and product visibility issues.

## When to Use This Skill

- When products appear with wrong prices or are invisible after catalog updates
- When implementing Varnish for the first time on a Magento production server
- When diagnosing slow category page loads caused by on-the-fly price calculation
- When configuring Redis for Magento's session and block cache storage
- When setting up cache invalidation after catalog or CMS updates via Magento's cache tags
- When managing indexer schedules on large catalogs (> 50,000 products) to prevent full reindex locking

## Core Instructions

1. **Understand Magento's indexers and their modes**

   ```bash
   # List all indexers and their status
   bin/magento indexer:info
   bin/magento indexer:status

   # Example output:
   # catalog_category_product    Category Products    valid    Update on Save
   # catalog_product_category    Product Categories   valid    Update on Save
   # catalog_product_price       Product Price        invalid  Update by Schedule
   # catalogsearch_fulltext      Catalog Search       valid    Update by Schedule
   # catalogrule_product         Catalog Rule Product invalid  Update on Save
   ```

   Set all production indexers to `Update by Schedule` mode to prevent checkout blocking:

   ```bash
   bin/magento indexer:set-mode schedule catalog_category_product
   bin/magento indexer:set-mode schedule catalog_product_price
   bin/magento indexer:set-mode schedule catalogsearch_fulltext
   bin/magento indexer:set-mode schedule catalog_product_flat
   bin/magento indexer:set-mode schedule catalog_category_flat

   # Verify modes
   bin/magento indexer:show-mode
   ```

2. **Manage indexers and partial reindexing**

   ```bash
   # Reindex a single indexer (less disruptive than full reindex)
   bin/magento indexer:reindex catalog_product_price

   # Reindex all (avoid on production during business hours)
   bin/magento indexer:reindex

   # Reset indexer to "invalid" to force next scheduled run
   bin/magento indexer:reset catalog_product_price

   # Check mview (materialized view) changelog tables — lists pending rows to process
   bin/magento indexer:show-changelog
   ```

   For very large catalogs, use parallel indexing:

   ```bash
   # app/etc/env.php — enable parallel processing
   # In Admin → System → Index Management → Indexers → Configure
   # Or via config:
   bin/magento config:set dev/grid/async_indexing 1
   ```

   ```php
   <?php
   // app/etc/env.php
   return [
       // ...
       'indexer' => [
           'batch_size' => [
               'catalog_product_price' => ['simple' => 200, 'configurable' => 50],
               'catalogsearch_fulltext' => ['simple' => 500],
           ],
       ],
   ];
   ```

3. **Configure Varnish as Full-Page Cache**

   ```bash
   # In Admin → System → Configuration → Advanced → System → Full Page Cache
   # Set Caching Application: Varnish Cache
   # Export Varnish configuration:
   bin/magento varnish:vcl:generate --export-version=6 --output-file=/etc/varnish/magento.vcl
   ```

   Key sections of the generated VCL to understand:

   ```vcl
   # /etc/varnish/magento.vcl (excerpts from generated config)

   sub vcl_recv {
       # Do not cache if private cookie is set (logged-in customer)
       if (req.http.cookie ~ "X-Magento-Vary=") {
           # Magento sets this cookie to vary cache by context (customer group, currency)
           # The cookie value changes only when the context changes — not per session
       }

       # Strip _ga, fbclid, utm_* params from cache key to prevent cache fragmentation
       set req.url = regsuball(req.url, "(\?|&)(utm_[^&]+|fbclid|gclid|mc_[^&]+)(&|$)", "\1");
   }

   sub vcl_hash {
       # Include Magento's context cookie in the cache hash
       if (req.http.cookie ~ "X-Magento-Vary=") {
           hash_data(regsub(req.http.cookie, ".*X-Magento-Vary=([^;]+).*", "\1"));
       }
   }

   sub vcl_backend_response {
       # Respect Magento's Cache-Control headers
       if (beresp.http.Cache-Control ~ "no-store") {
           set beresp.uncacheable = true;
           set beresp.ttl = 120s;
       }

       # Strip Set-Cookie on cacheable responses
       if (beresp.ttl > 0s) {
           unset beresp.http.set-cookie;
       }
   }
   ```

4. **Configure Redis for application cache and sessions**

   ```php
   <?php
   // app/etc/env.php — Redis cache and session configuration

   return [
       'cache' => [
           'frontend' => [
               'default' => [
                   'id_prefix' => 'b0c_',
                   'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
                   'backend_options' => [
                       'server'            => '127.0.0.1',
                       'database'          => '0',
                       'port'              => '6379',
                       'password'          => '',
                       'compress_data'     => '1',
                       'compression_lib'   => 'gzip',
                       'persistent'        => 'mgto_cache',
                   ],
               ],
               'page_cache' => [
                   'id_prefix' => 'b0c_',
                   'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
                   'backend_options' => [
                       'server'        => '127.0.0.1',
                       'database'      => '1', // Separate DB for FPC
                       'port'          => '6379',
                       'compress_data' => '0', // FPC data is already compressed HTML
                   ],
               ],
           ],
       ],
       'session' => [
           'save'                  => 'redis',
           'redis' => [
               'host'              => '127.0.0.1',
               'port'              => '6379',
               'password'          => '',
               'timeout'           => '2.5',
               'persistent_identifier' => 'mgto_sessions',
               'database'          => '2', // Separate DB for sessions
               'compression_threshold' => '2048',
               'compression_library'   => 'gzip',
               'log_level'             => '1',
               'max_concurrency'       => '6',
               'break_after_frontend'  => '5',
               'max_lifetime'          => '7200',
               'disable_locking'       => '1', // Improves performance but reduces session safety
           ],
       ],
   ];
   ```

5. **Implement cache tag invalidation for custom modules**

   Magento uses cache tags to selectively invalidate cached pages when data changes. Custom modules should tag and clean caches properly:

   ```php
   <?php
   // Declare cache tags in your block/model
   namespace MyVendor\CustomModule\Block;

   use Magento\Framework\View\Element\Template;
   use Magento\Framework\DataObject\IdentityInterface;

   class CustomProductWidget extends Template implements IdentityInterface
   {
       private array $productIds = [];

       public function getIdentities(): array
       {
           // Return cache tags so Magento invalidates this block when any of these products change
           $tags = [\Magento\Catalog\Model\Product::CACHE_TAG];
           foreach ($this->productIds as $id) {
               $tags[] = \Magento\Catalog\Model\Product::CACHE_TAG . '_' . $id;
           }
           return $tags;
       }
   }
   ```

   ```php
   <?php
   // In your observer or command — flush only relevant pages after product update
   namespace MyVendor\CustomModule\Observer;

   use Magento\Framework\Event\ObserverInterface;
   use Magento\Framework\App\Cache\TypeListInterface;
   use Magento\PageCache\Model\Cache\Type as PageCacheType;

   class ProductSaveObserver implements ObserverInterface
   {
       public function __construct(
           private readonly TypeListInterface $cacheTypeList,
           private readonly \Magento\Framework\App\Cache\Tag\Resolver $tagResolver
       ) {}

       public function execute(\Magento\Framework\Event\Observer $observer): void
       {
           $product = $observer->getEvent()->getProduct();

           // Invalidate only pages tagged with this product's cache tag
           // Varnish will purge via PURGE request using X-Magento-Tags-Pattern header
           $this->cacheTypeList->invalidate(PageCacheType::TYPE_IDENTIFIER);
       }
   }
   ```

## Examples

### Diagnose index lag causing wrong prices

```bash
# Check if mview changelog has pending rows
bin/magento indexer:show-changelog

# If catalog_product_price has > 0 pending rows, prices are stale
# Run the indexer to catch up
bin/magento indexer:reindex catalog_product_price

# Check cron_schedule table for missed cron jobs (should run indexers every minute)
bin/magento cron:run --group index &
# Or manually via:
mysql -u root -e "SELECT job_code, status, finished_at FROM magento.cron_schedule WHERE job_code LIKE '%index%' ORDER BY finished_at DESC LIMIT 20;"
```

### Warm FPC after deployment

```bash
#!/bin/bash
# scripts/warm-cache.sh — warm the FPC after deploy
set -e

MAGENTO_BASE_URL="https://www.mystore.com"
SITEMAP_URL="$MAGENTO_BASE_URL/sitemap.xml"

echo "Flushing Magento caches..."
bin/magento cache:flush

echo "Warming FPC via sitemap..."
# Download sitemap and curl each URL with a warm-cache header
curl -s "$SITEMAP_URL" | \
  grep -oP '<loc>\K[^<]+' | \
  head -500 | \
  xargs -P 10 -I {} curl -s -o /dev/null -w "%{http_code} {}\n" \
    -H "X-Warm-Cache: 1" {}

echo "Cache warming complete."
```

## Best Practices

- **Always use `Update by Schedule` mode in production** — `Update on Save` reindexes synchronously during admin saves, causing timeouts on large catalogs
- **Separate Redis databases for cache, FPC, and sessions** — using database 0 for everything causes key conflicts and makes it impossible to flush only one type
- **Tag custom blocks with `IdentityInterface`** — this ensures Varnish and Magento's FPC invalidate the right pages when your data changes
- **Monitor indexer changelog table sizes** — a `catalog_product_price_cl` table with millions of rows indicates cron is not running; fix cron before the table size causes reindex timeouts
- **Use `bin/magento cache:clean` vs `cache:flush`** — `clean` removes only invalid cache entries (safe); `flush` nukes everything including other framework caches sharing the same Redis
- **Set distinct `id_prefix` per environment** — staging and production can share a Redis server if each has a unique prefix, preventing cache poisoning
- **Test Varnish with `curl -I` and `X-Cache` header** — a `HIT` response confirms Varnish is serving from cache; `MISS` means it's hitting Magento for every request

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products invisible or wrong price after import | Run `bin/magento indexer:reindex` after bulk imports — programmatic product saves don't always trigger indexer if using `ResourceModel\Product::save` directly |
| Varnish serving stale pages for logged-in customers | Ensure `X-Magento-Vary` cookie is in the Varnish VCL hash; logged-in customers get a different vary value that bypasses the shared cache |
| Redis running out of memory | Set `maxmemory-policy allkeys-lru` in `redis.conf` for cache databases; for session database use `noeviction` to prevent silent session loss |
| FPC not invalidating after product save | Check that Varnish's PURGE ACL allows requests from the Magento server's IP; test with `curl -X PURGE http://varnish-ip/`  |
| Full reindex takes hours and locks tables | Enable indexer batch sizes in `env.php` and run with `--mode realtime` for partial reindexing; schedule during off-peak windows |
| Cron indexers not running | Check `var/log/magento.cron.log` for errors; verify the system crontab entry runs `bin/magento cron:run` every minute as the web server user |

## Related Skills

- @magento-module-development
- @magento-graphql
- @magento-multi-store
- @caching-strategies
- @infrastructure-performance
