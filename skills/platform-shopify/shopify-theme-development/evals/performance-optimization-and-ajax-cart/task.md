# Optimize Shopify Theme Layout and Implement AJAX Cart

## Problem/Feature Description

A fashion e-commerce brand has been struggling with poor Core Web Vitals scores on their Shopify store. Their Google Search Console shows consistently low scores for Largest Contentful Paint and Total Blocking Time, which is hurting both SEO rankings and conversion rates. A performance audit identified that the main theme layout loads all CSS and JavaScript synchronously, there are no resource hints for the Shopify CDN, and the hero product image is not prioritized.

Additionally, their "Add to Cart" button does a full page reload, which creates a jarring experience. The team wants a seamless AJAX cart where clicking "Add to Cart" updates a cart count badge in the header without reloading the page. A known pain point from their previous AJAX implementation was that the cart badge count sometimes got out of sync after adding items — the old code read the count directly from the add response rather than verifying the true cart state.

Your task is to produce an optimized `layout/theme.liquid` file and a `assets/cart.js` file that address both problems.

## Output Specification

Produce the following files:

- `layout/theme.liquid` — a complete theme layout with performance optimizations in the `<head>` and body, including a cart count badge element in the header area
- `assets/cart.js` — a JavaScript cart manager class that handles add-to-cart, quantity updates, cart state retrieval, and header badge updates

The layout should handle both product and non-product pages appropriately. The cart implementation should expose a usable API (e.g. `window.cart`) for other scripts to call.
