---
name: faceted-navigation
description: "Let shoppers filter products by multiple attributes simultaneously with URL-shareable filter state, instant results, and mobile-friendly controls"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [facets, filters, navigation, search, url-state, product-listing, plp]
triggers: ["add product filters", "faceted search", "filter by category", "product listing filters", "multi-select facets", "filterable products"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Faceted Navigation

## Overview

Build a filterable product listing page (PLP) where shoppers can narrow results by multiple attributes simultaneously — size, color, brand, price range, rating — while keeping the URL in sync so filters are shareable, bookmarkable, and crawlable by search engines. Good faceted navigation drives measurable conversion lift on catalogs with more than 50 SKUs.

## When to Use This Skill

- When a product catalog exceeds ~50 SKUs and browse-only navigation causes shopper frustration
- When building or redesigning a category/collection listing page
- When SEO requires crawlable faceted URLs (e.g., `/shoes/running?color=black&size=10`)
- When replacing a legacy faceted implementation that breaks the back button
- When implementing Algolia InstantSearch or a custom faceting layer on Elasticsearch

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Enable native collection filters (Online Store 2.0 themes) + install **Search & Discovery** app (free) | Dawn, Sense, and other OS2.0 themes support native storefront filtering via the Storefront API; Search & Discovery adds synonym, boosting, and filter configuration from the admin |
| **WooCommerce** | Install **FiboSearch** (paid, $49/yr) or **WooCommerce Product Filters** (free) plugin | FiboSearch adds AJAX-powered facets with price slider, color swatches, and stock filter; the free Product Filters plugin covers basic attribute filtering with URL state |
| **BigCommerce** | Enable **Faceted Search** in **Storefront → Search** settings (built-in on Cornerstone and most themes) | BigCommerce Faceted Search is native to the platform — configure which product attributes appear as facets in the admin; no app required |
| **Custom / Headless** | Build with Algolia InstantSearch or Elasticsearch + URL state management | Full control over facet logic, disjunctive filtering, and count freshness; see implementation details below |

### Step 2: Configure facets on your platform

---

#### Shopify

**Using Search & Discovery app (recommended):**

1. Install **Search & Discovery** from the Shopify App Store (free, by Shopify)
2. Go to **Apps → Search & Discovery → Filters**
3. Click **Add filter** and select the product attributes to use as facets (e.g., Color, Size, Brand, Price)
4. Drag to reorder filters — put the most-used ones first
5. Set **Availability** and **Price** filters to appear by default; keep variant-specific filters collapsed
6. In **Online Store → Themes → Customize**, ensure your theme's collection template has the **Filters** section enabled in the sidebar or drawer

**Theme-level filter configuration (Dawn theme):**
1. Go to **Online Store → Themes → Customize**
2. Navigate to a collection page template
3. In the sidebar, click **Product grid** and enable **Enable filtering** and **Enable sorting**
4. Set **Filter layout** to **Drawer** (recommended for mobile) or **Sidebar** (desktop)

**For Shopify Plus:** Use Shopify Flow to tag products with filterable attributes automatically when new products are added.

---

#### WooCommerce

**Option A: FiboSearch (recommended for advanced filtering):**
1. Install **FiboSearch – AJAX Search for WooCommerce** from WordPress.org or the plugin marketplace
2. Go to **FiboSearch → Settings → Filters** and enable the filter bar
3. Configure which attributes appear as facets: product categories, price range, custom attributes (e.g., Color, Size), and stock status
4. Set **Filter style** to checkbox list or color swatches per attribute
5. Enable **AJAX filtering** so results update without page reload
6. Place the filter widget via **Appearance → Widgets → Shop Sidebar** or in a Gutenberg block

**Option B: WooCommerce Product Filters (free):**
1. Install from WordPress.org
2. Go to **Products → Filters → Add New Filter Group**
3. Add filters for: Category, Attribute (e.g., Color, Size), Price range, Product tag, Stock status
4. Place the filter shortcode `[woof]` in your shop page sidebar or above the product grid

**URL state:** Both plugins write active filters to the URL as query parameters, making results shareable and bookmarkable.

---

#### BigCommerce

1. Go to **Storefront → Search** in your BigCommerce control panel
2. Under **Faceted Search**, toggle it **On**
3. Select which product fields appear as facets: **Brand**, **Category**, **Price**, **Rating**, and any custom **Product Custom Fields**
4. Set the maximum number of values shown per facet before a "Show more" link appears
5. For price facets, configure the price range buckets (e.g., $0-$25, $25-$50, $50-$100)
6. In your theme settings (**Storefront → My Themes → Customize**), configure the filter sidebar layout and mobile drawer behavior

**Note:** Faceted Search requires Stencil-based themes (Cornerstone and most modern BigCommerce themes). Legacy Blueprint themes do not support it.

---

#### Custom / Headless

For headless storefronts, implement URL-state-driven filtering with your search backend:

**URL state schema — all active filters live in query params:**
```
/products/shoes?brand=Nike&brand=Adidas&color=black&size=10&price_min=50&price_max=150&sort=price_asc&page=1
```

**Parse and build URL state:**
```javascript
// lib/facetUrl.js
export function parseFiltersFromUrl(searchParams) {
  const filters = {};
  for (const [key, value] of searchParams.entries()) {
    if (['sort', 'page', 'q'].includes(key)) continue;
    if (!filters[key]) filters[key] = [];
    filters[key].push(value);
  }
  return filters;
}

export function buildUrlFromFilters(filters, sort, page) {
  const params = new URLSearchParams();
  for (const [facetKey, values] of Object.entries(filters)) {
    values.forEach(v => params.append(facetKey, v));
  }
  if (sort) params.set('sort', sort);
  if (page && page > 1) params.set('page', String(page));
  return `?${params.toString()}`;
}
```

**Algolia query with disjunctive facets (OR within a facet, AND between facets):**
```javascript
const result = await index.search(query ?? '', {
  facets: ['brand', 'color', 'size', 'price_range'],
  // facetFilters = OR within a facet group, AND between groups
  facetFilters: Object.entries(filters)
    .filter(([k]) => !['price_min', 'price_max'].includes(k))
    .map(([key, values]) => values.map(v => `${key}:${v}`)),
  filters: [
    filters.price_min ? `price >= ${filters.price_min[0]}` : null,
    filters.price_max ? `price <= ${filters.price_max[0]}` : null,
  ].filter(Boolean).join(' AND '),
  hitsPerPage: 24,
  page: page - 1,
});
```

**Toggle filter and push URL state:**
```javascript
function toggleFilter(facetKey, value, currentFilters, sort) {
  const current = currentFilters[facetKey] ?? [];
  const next = current.includes(value)
    ? current.filter(v => v !== value)
    : [...current, value];
  const updated = next.length
    ? { ...currentFilters, [facetKey]: next }
    : (({ [facetKey]: _, ...rest }) => rest)(currentFilters);
  // Push new URL — each filter change gets its own history entry for back-button support
  window.history.pushState({}, '', buildUrlFromFilters(updated, sort, 1));
  return updated;
}
```

### Step 3: Configure mobile filter experience

On mobile, the filter panel should appear as a bottom drawer triggered by a "Filter" button — not an always-visible sidebar that takes up half the screen.

- **Shopify (Dawn):** Set **Filter layout** to **Drawer** in the Theme Customizer — this is already the default on mobile
- **WooCommerce (FiboSearch):** Enable **Mobile filter button** in FiboSearch settings; the plugin adds a collapsible filter panel
- **BigCommerce:** In theme settings, enable **Filter drawer on mobile**; Cornerstone handles this natively
- **Custom:** Render filters in a `position: fixed; bottom: 0` drawer on screens below 640px; trigger with a "Filter (N)" button where N is the active filter count

### Step 4: Add active filter pills and clear controls

All platforms should show applied filters as dismissible pills above the product grid:

- **Shopify (Search & Discovery):** Active filter pills are built into the OS2.0 filter section — enable them in the Theme Customizer
- **WooCommerce:** FiboSearch shows active filter tags by default; add `[woof_active_filters]` shortcode to show them separately
- **BigCommerce:** Cornerstone displays active refinements automatically; add the **Active Facets** section to your template if missing
- **Custom:** Render pills from URL filter state; each pill has an × button that calls `toggleFilter` to remove it

## Best Practices

- **Encode filter state in the URL** — never store active filters only in JavaScript state; the URL is the source of truth for sharing, bookmarking, and back-button behavior
- **Use disjunctive facets within a group** — selecting Nike AND Adidas should show products from either brand, not an empty intersection
- **Return facet counts in every response** — counts must reflect the current filter context, not the global catalog
- **Limit facet overflow to top 10 values** — show a "Show more" toggle to prevent overwhelming mobile users
- **Debounce price range sliders** — commit the range only on mouseup/touchend, not on every tick
- **Add a "Clear all" affordance** — always visible when any filter is active

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Back button reloads page instead of removing last filter | Use `history.pushState` (not `replaceState`) for each filter change |
| Facet counts go stale after first filter selection | Re-fetch facet counts on every filter change using Algolia disjunctive faceting or Search & Discovery's built-in count refresh |
| Mobile filter panel overlaps content | Use a drawer/modal on mobile triggered by a "Filters" button; never show a sidebar on screens below 640px |
| SEO duplicate content from facet URLs | Add `rel="noindex"` or canonical tags for non-primary facet combinations; this is configured in Shopify's Search & Discovery SEO settings |
| Price range thumbs overlap | Clamp max thumb minimum to current min+step and min thumb maximum to current max-step on every change |

## Related Skills

- @search-autocomplete
- @product-categorization
- @accessibility-commerce
- @product-page-design
