# WooCommerce Featured Products Widget with Caching

## Problem Description

A home goods retailer has a custom "Featured Products" widget on their homepage that currently causes serious performance problems. Every page load executes a separate database query for each featured product, and the rendered HTML is re-generated from scratch on every request — even though featured products rarely change. On high-traffic days the widget alone accounts for over 40% of page-level database queries.

The team needs this widget rewritten to be cache-friendly. They want the product data fetched in as few queries as possible and the rendered HTML cached so repeated requests serve it from memory. When a featured product is updated in the admin, the cache for that product's rendered output must be invalidated. The current broken implementation is provided below.

Additionally, the store's admin has a report page that loops through orders to generate a revenue summary. That query is currently written to fetch all orders at once and has caused MySQL timeouts on stores with large order histories. The admin report code also needs to be corrected.

## Output Specification

Produce two PHP files:
- `featured-products-widget.php` — the corrected widget implementation with fragment caching
- `admin-order-report.php` — the corrected order query for the admin revenue report

Also produce `optimization-notes.md` briefly describing the caching strategy used for the widget (cache key scheme, group name, TTL, and invalidation approach).

## Input Files

The following files are provided. Extract them before beginning.

=============== FILE: inputs/featured-products-widget-broken.php ===============
<?php
/**
 * Broken Featured Products Widget
 * Problems: N+1 queries, no caching, no cache invalidation
 */

function render_featured_products(): string {
    $product_ids = wc_get_featured_product_ids();
    $html = '';

    foreach ($product_ids as $id) {
        // N+1: separate DB query per product
        $product = wc_get_product($id);
        if (!$product) continue;

        ob_start();
        wc_get_template('content-product.php', ['product' => $product]);
        $html .= ob_get_clean();
    }

    return $html;
}

=============== FILE: inputs/admin-order-report-broken.php ===============
<?php
/**
 * Broken Admin Order Report
 * Problem: fetches all orders at once — causes MySQL timeouts on large stores
 */

function get_revenue_summary(): array {
    // BAD: loads every order into memory at once
    $orders = wc_get_orders([
        'status' => ['wc-completed', 'wc-processing'],
        'limit'  => -1,
        'return' => 'objects',
    ]);

    $total = 0;
    $count = 0;
    foreach ($orders as $order) {
        $total += $order->get_total();
        $count++;
    }

    return ['total' => $total, 'count' => $count];
}
