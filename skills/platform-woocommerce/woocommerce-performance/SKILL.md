---
name: woocommerce-performance
description: "Fix slow WooCommerce stores by optimizing database queries, clearing transients, enabling Redis object caching, and configuring page caching"
category: platform-woocommerce
risk: safe
source: curated
date_added: "2026-03-12"
tags: [woocommerce, performance, caching, redis, query-optimization, database, mysql, object-cache]
triggers: ["woocommerce performance", "slow woocommerce", "woocommerce speed", "woocommerce database optimization", "woocommerce caching", "woocommerce redis"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [woocommerce]
difficulty: advanced
---

# WooCommerce Performance

## Overview

WooCommerce performance problems typically stem from five sources: expensive product queries with un-indexed meta tables, unbounded AJAX cart/checkout calls, missing persistent object cache, bloated `wp_options` autoload data, and a growing `wp_woocommerce_sessions` and order table without cleanup. This skill covers profiling, query optimization, Redis object caching, and scheduled maintenance routines.

## When to Use This Skill

- When store pages are slow to load under moderate traffic (hundreds of concurrent users)
- When server CPU spikes during WooCommerce AJAX calls (add-to-cart, shipping calculation)
- When MySQL query time shows in New Relic or Query Monitor as the primary bottleneck
- When the `wp_options` table autoload size exceeds 1–2 MB
- When `wp_woocommerce_sessions` has millions of rows slowing down session lookups
- When implementing Redis or Memcached to reduce MySQL load on a high-traffic store

## Core Instructions

1. **Profile first with Query Monitor**

   Install Query Monitor plugin to identify slow queries in the admin and frontend:

   ```bash
   # Via WP-CLI
   wp plugin install query-monitor --activate
   ```

   Focus on:
   - Queries per page load (> 50 is a concern)
   - Duplicate queries (same query run multiple times)
   - Slow queries (> 100ms individual queries)
   - Large result sets (queries returning thousands of rows)

   For production profiling, enable MySQL slow query log:

   ```sql
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 0.5;
   SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
   ```

2. **Enable Redis persistent object cache**

   The single highest-impact optimization for WooCommerce. Without it, every page load re-fetches the same product data from MySQL:

   ```bash
   # Install Redis server
   sudo apt install redis-server

   # Install the Redis Object Cache plugin
   wp plugin install redis-cache --activate
   wp redis enable
   ```

   Configure in `wp-config.php`:

   ```php
   define('WP_REDIS_HOST', '127.0.0.1');
   define('WP_REDIS_PORT', 6379);
   define('WP_REDIS_DATABASE', 0);
   define('WP_REDIS_TIMEOUT', 1);
   define('WP_REDIS_READ_TIMEOUT', 1);
   define('WP_REDIS_MAXTTL', 86400); // 24 hours max TTL

   // Selective cache groups — exclude user sessions from Redis (they change constantly)
   define('WP_REDIS_IGNORED_GROUPS', ['wc_session_id', 'counts', 'plugins']);
   ```

3. **Optimize WooCommerce-specific database queries**

   ```php
   <?php

   // Add missing indexes for common WooCommerce product queries
   // Run once via WP-CLI: wp eval-file add-indexes.php

   global $wpdb;

   // Index for product meta queries (stock status, visibility, price)
   $wpdb->query("
       ALTER TABLE {$wpdb->postmeta}
       ADD INDEX wc_product_meta_lookup (meta_key(32), meta_value(64))
   ");

   // Index for order meta queries
   $wpdb->query("
       ALTER TABLE {$wpdb->postmeta}
       ADD INDEX wc_order_customer_lookup (meta_key(32), meta_value(100))
   ");
   ```

   Use WooCommerce's HPOS (High-Performance Order Storage) to move orders out of post meta:

   ```php
   // wp-config.php — enable HPOS (WooCommerce 7.1+)
   // This is configured via WooCommerce Settings → Advanced → Features
   // Enables dedicated order tables: wp_wc_orders, wp_wc_order_items, etc.
   ```

   ```bash
   # Check HPOS status
   wp wc hpos status
   # Migrate orders to HPOS
   wp wc hpos migrate --batch-size=500
   ```

4. **Clean up transients, sessions, and log tables**

   ```php
   <?php
   // Scheduled cleanup — run daily via Action Scheduler

   add_action('my_plugin_daily_cleanup', function () {
       global $wpdb;

       // Delete expired WooCommerce sessions (older than 48 hours)
       $expiry_threshold = time() - (48 * HOUR_IN_SECONDS);
       $wpdb->query($wpdb->prepare("
           DELETE FROM {$wpdb->prefix}woocommerce_sessions
           WHERE session_expiry < %d
           LIMIT 5000
       ", $expiry_threshold));

       // Delete expired transients
       $wpdb->query("
           DELETE FROM {$wpdb->options}
           WHERE option_name LIKE '_transient_timeout_%'
             AND option_value < UNIX_TIMESTAMP()
           LIMIT 5000
       ");
       $wpdb->query("
           DELETE t FROM {$wpdb->options} t
           LEFT JOIN {$wpdb->options} e
               ON e.option_name = REPLACE(t.option_name, '_transient_', '_transient_timeout_')
           WHERE t.option_name LIKE '_transient_%'
             AND e.option_id IS NULL
           LIMIT 5000
       ");

       // Rotate WooCommerce logs older than 30 days
       $wpdb->query("
           DELETE FROM {$wpdb->prefix}woocommerce_log
           WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)
           LIMIT 10000
       ");
   });

   // Register the scheduled event
   add_action('init', function () {
       if (!as_next_scheduled_action('my_plugin_daily_cleanup')) {
           as_schedule_recurring_action(strtotime('tomorrow midnight'), DAY_IN_SECONDS, 'my_plugin_daily_cleanup');
       }
   });
   ```

5. **Optimize the wp_options autoload table**

   Autoloaded options are loaded on every page request. Bloated autoload causes significant overhead:

   ```sql
   -- Find large autoloaded options
   SELECT option_name, LENGTH(option_value) as size_bytes
   FROM wp_options
   WHERE autoload = 'yes'
   ORDER BY LENGTH(option_value) DESC
   LIMIT 30;
   ```

   ```php
   <?php
   // Fix: Store plugin data as transients or post meta instead of autoloaded options

   // Bad — autoloaded, loaded on every request
   update_option('my_plugin_product_cache', $large_array, true);

   // Good — not autoloaded
   update_option('my_plugin_product_cache', $large_array, false);

   // Better — use transient with expiry
   set_transient('my_plugin_product_cache', $large_array, HOUR_IN_SECONDS);

   // Disable autoload for existing options
   global $wpdb;
   $wpdb->update(
       $wpdb->options,
       ['autoload' => 'no'],
       ['option_name' => 'woocommerce_attribute_taxonomies']
   );
   ```

## Examples

### Fragment caching for product loops

```php
<?php

// Cache rendered product card HTML in Redis to avoid re-rendering
function render_product_card_cached(int $product_id): string {
    $cache_key = "product_card_{$product_id}_" . get_locale();
    $cached = wp_cache_get($cache_key, 'product_cards');

    if ($cached !== false) {
        return $cached;
    }

    $product = wc_get_product($product_id);
    if (!$product) return '';

    ob_start();
    wc_get_template('content-product.php', ['product' => $product]);
    $html = ob_get_clean();

    // Cache for 30 minutes; invalidate on product update
    wp_cache_set($cache_key, $html, 'product_cards', 30 * MINUTE_IN_SECONDS);

    return $html;
}

// Purge cache when product is updated
add_action('woocommerce_update_product', function (int $product_id) {
    wp_cache_delete("product_card_{$product_id}_" . get_locale(), 'product_cards');
    // Also delete all locale variants
    wp_cache_flush_group('product_cards');
});
```

### Detect and fix N+1 product queries

```php
<?php

// Bad — triggers N+1 queries (one per product in loop)
$product_ids = wc_get_featured_product_ids();
foreach ($product_ids as $id) {
    $product = wc_get_product($id); // <-- separate query for each product
    echo $product->get_name();
}

// Good — prime the cache before the loop
$product_ids = wc_get_featured_product_ids();
// Pre-warm the object cache with all products in a single query
$products = array_map('wc_get_product', $product_ids); // Still N queries without this:

// Better — use WC_Product_Query with ID filter (single query)
$products = wc_get_products([
    'include' => $product_ids,
    'limit'   => count($product_ids),
    'return'  => 'objects',
]);

foreach ($products as $product) {
    echo $product->get_name(); // data already loaded
}
```

## Best Practices

- **Enable HPOS** (High-Performance Order Storage) on WooCommerce 7.1+ stores — it moves order data into dedicated tables with proper indexes, eliminating the `wp_postmeta` bottleneck for orders
- **Add Redis/Memcached object cache before anything else** — it eliminates redundant MySQL queries that WordPress and WooCommerce make on every request and often cuts DB load by 60–80%
- **Run cleanup on off-peak hours via Action Scheduler** — batch DELETE operations (limit 5000 rows per run) to avoid long table locks during cleanup
- **Use `WP_DEBUG_LOG` with `SAVEQUERIES` only on dev** — enabling these on production kills performance; use APM tools (New Relic, Datadog) for production profiling
- **Paginate admin order queries** — loading all orders in one go (`posts_per_page: -1`) locks MySQL and causes timeouts; always use `paged` with `posts_per_page` ≤ 100
- **Set `WP_REDIS_IGNORED_GROUPS`** to exclude volatile data (cart, session counters) from Redis to prevent cache stampedes on high-traffic checkout pages
- **Monitor `wp_options` table size weekly** — set up an alert if autoloaded data exceeds 800KB; common culprits are plugins that store large arrays as autoloaded options

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Redis cache not reducing MySQL queries | Check `wp_cache_get` hit rate in Query Monitor — a low hit rate means cache keys are being invalidated too aggressively or TTLs are too short |
| Cleanup queries cause table-level locks | Use row-level `LIMIT` clauses in DELETE queries (max 5000 rows per run) and schedule them during low-traffic windows |
| HPOS migration breaks third-party plugins | Audit all plugins for `get_post_meta(order_id, ...)` usage before enabling HPOS — these must be updated to use `$order->get_meta()` |
| Slow product listing despite indexes | Check whether `wc_lookup_table_enabled` is active; WooCommerce 3.7+ introduced `wp_wc_product_meta_lookup` table that dramatically speeds up product queries |
| Object cache stale after product import | Call `wp_cache_flush()` or `wp_cache_flush_group('products')` at the end of bulk import scripts to invalidate stale product caches |
| Session table grows despite cleanup | Ensure `WC_Session_Handler` is using the database backend (not PHP sessions); default cookie-based sessions don't create DB rows, but custom plugins may force DB sessions |

## Related Skills

- @woocommerce-plugin-development
- @woocommerce-rest-api
- @database-query-optimization
- @caching-strategies
- @infrastructure-performance
