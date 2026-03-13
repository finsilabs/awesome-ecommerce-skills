---
name: ecommerce-seo
description: "Maximize organic search traffic with optimized product page meta tags, JSON-LD structured data for Google Shopping, and automated XML sitemaps"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [seo, structured-data, json-ld, sitemap, canonical, meta-tags, schema-org]
triggers: ["optimize ecommerce SEO", "add structured data", "generate sitemap", "fix product page SEO", "improve organic search ranking"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# E-commerce SEO

## Overview

E-commerce SEO covers the technical and content foundations that help search engines understand and rank your product pages: meta tags, structured data (JSON-LD), canonical URLs, XML sitemaps, and Core Web Vitals. Shopify and WooCommerce handle most technical SEO automatically; your effort should focus on optimizing titles, descriptions, and structured data quality — not plumbing.

## When to Use This Skill

- When building product pages that need to rank in Google Shopping and organic search
- When implementing JSON-LD structured data for rich snippets (price, availability, reviews)
- When handling canonical URLs for products with multiple variants or filter combinations
- When generating XML sitemaps for a large catalog (10K+ products)
- When diagnosing why products are not appearing in Google Shopping rich results

## Core Instructions

### Step 1: Check what your platform handles automatically

Before installing anything, understand what is already built in:

| Feature | Shopify | WooCommerce | BigCommerce |
|---------|---------|-------------|-------------|
| XML sitemap | Auto-generated at `/sitemap.xml` | Auto-generated at `/sitemap_index.xml` (with Yoast SEO) | Auto-generated at `/xmlsitemap.xml` |
| Canonical URLs | Yes (built-in) | Yes (with Yoast SEO) | Yes (built-in) |
| Meta title/description editing | Yes (via product editor) | Yes (via Yoast SEO fields) | Yes (via product editor) |
| JSON-LD product schema | Basic (varies by theme) | Requires WooCommerce + Yoast or Rank Math | Basic (varies by theme) |
| robots.txt | Editable in Online Store settings | Editable via file or Yoast | Editable via admin |

### Step 2: Install an SEO foundation

---

#### Shopify

Shopify handles sitemaps, canonicals, and basic schema automatically. Focus on:

1. **Install a SEO app** for enhanced structured data and bulk editing:
   - **Yoast SEO for Shopify** ($19/mo) — most comprehensive
   - **Schema Plus** (free tier) — focused on JSON-LD structured data
   - **SEO Manager** ($20/mo) — bulk meta editing + structured data
2. Go to **Shopify Admin → Online Store → Preferences** and verify:
   - Your homepage title and meta description are set
   - Google Analytics is connected
3. Go to each product's page in admin and fill in the **SEO** section at the bottom:
   - Write unique meta titles following: `[Brand] [Product Name] - [Key Attribute] | [Store Name]`
   - Write unique meta descriptions (150–160 characters) that include price range, key benefit, and a call to action
4. Submit your sitemap to Google Search Console: go to **search.google.com/search-console** → Sitemaps → Add `yourstore.com/sitemap.xml`

---

#### WooCommerce

1. Install **Yoast SEO** (free) or **Rank Math** (free) from the WordPress plugin directory — these are required for proper WooCommerce SEO
2. After installing Yoast SEO:
   - Go to **Yoast SEO → Search Appearance → WooCommerce** and configure product page templates
   - Enable JSON-LD structured data under **Yoast SEO → Search Appearance → Schema**
   - Go to **Yoast SEO → Tools → Bulk Editor** to edit meta titles and descriptions for all products at once
3. For enhanced product schema (price, availability, reviews):
   - Install **Rank Math** which includes WooCommerce Product Schema with review aggregation built in
4. Submit sitemap to Google Search Console: Yoast auto-generates `/sitemap_index.xml`

---

#### BigCommerce

1. BigCommerce includes basic SEO features built-in. Go to **BigCommerce Admin → Products → [Edit Product] → SEO** tab
2. For enhanced structured data: install **SEO Expert** from the BigCommerce App Marketplace
3. Go to **Store Setup → Search Engine Optimization** to configure global defaults
4. Submit your sitemap at `yourstore.com/xmlsitemap.xml` to Google Search Console

---

#### Custom / Headless

For headless storefronts, implement structured data manually. Serve JSON-LD on every product page:

```typescript
function buildProductJsonLd(product: Product, reviews: ReviewSummary) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images.map(img => img.src),
    description: product.metaDescription || product.description.slice(0, 200),
    sku: product.variants[0]?.sku,
    brand: { '@type': 'Brand', name: product.vendor },
    offers: product.variants.length === 1
      ? {
          '@type': 'Offer',
          url: `https://yourstore.com/products/${product.slug}`,
          priceCurrency: 'USD',
          price: (product.variants[0].priceInCents / 100).toFixed(2),
          availability: product.variants[0].inventoryQuantity > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        }
      : {
          '@type': 'AggregateOffer',
          lowPrice: (Math.min(...product.variants.map(v => v.priceInCents)) / 100).toFixed(2),
          highPrice: (Math.max(...product.variants.map(v => v.priceInCents)) / 100).toFixed(2),
          priceCurrency: 'USD',
          offerCount: product.variants.length,
        },
    ...(reviews.count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviews.average.toFixed(1),
        reviewCount: reviews.count,
        bestRating: '5',
      },
    } : {}),
  };
}
```

For canonical URL handling on variant pages — strip variant parameters:
```typescript
// Always use the base product URL as canonical
// /products/blue-widget?variant=123 → canonical: /products/blue-widget
function getCanonicalUrl(path: string): string {
  // Strip variant query parameters
  return `https://yourstore.com${path.split('?')[0]}`;
}
```

For large catalogs (10k+ products), use a sitemap index:
```typescript
// Serve /sitemap.xml as a sitemap index pointing to paginated product sitemaps
// Each child sitemap: max 50,000 URLs
// Regenerate every 6 hours or on product publish/unpublish events
```

### Step 3: Optimize product titles and descriptions

This is the highest-ROI SEO work. Follow these title formats:

- **Product title format**: `[Brand] [Product Name] [Key Attribute] - [Store Name]`
  - Example: "Nike Air Max 90 White - Running Store"
- **Meta description format**: Include price range, key benefit, and CTA in 150–160 characters
  - Example: "Shop Nike Air Max 90 from $120. Lightweight cushioning for daily runs. Free shipping on orders over $75. Shop now."

**Common issues to fix:**
- Duplicate meta titles across variants (fix: add variant-specific attributes to the title)
- Meta descriptions that are just the product description truncated (fix: write purposeful descriptions)
- Missing alt text on product images (fix: use `[Product Name] - [Color/View]` format)

### Step 4: Handle technical SEO issues

**Canonical URLs for filter pages:**
- Collection pages with active filters (`/collections/shoes?color=red`) should use self-referencing canonicals
- Pages with sort order only (`/collections/shoes?sort=price-asc`) should canonical back to the unfiltered collection URL

In Shopify, this is handled automatically. In WooCommerce with Yoast, go to **Yoast SEO → Search Appearance → Taxonomies** and configure canonical behavior for filtered pages.

**Robots.txt — block these paths:**
- `/cart` and `/checkout` — not indexable
- `/account` and `/search?` — not indexable
- Collection filter combinations with 3+ active filters — use `noindex, follow` meta tag

In Shopify: **Online Store → Themes → Edit Code → robots.txt.liquid**
In WooCommerce: Yoast SEO manages robots.txt automatically

### Step 5: Verify with Google tools

1. **Google Rich Results Test** (search.google.com/test/rich-results): paste any product URL and verify structured data is correct
2. **Google Search Console**: check for structured data errors under **Enhancements → Products**
3. **PageSpeed Insights**: test Core Web Vitals — target LCP under 2.5 seconds, CLS under 0.1

## Best Practices

- **Write unique meta descriptions for every product** — avoid duplicating the product title; include key attributes (size, material, price) that help click-through rate
- **Compress and properly size product images** — oversized images are the #1 cause of slow LCP scores; Shopify compresses automatically; WooCommerce use ShortPixel or Imagify plugin
- **Use JSON-LD over microdata** — easier to maintain and Google recommends it
- **Set canonical URLs on every page** — self-referencing canonicals prevent duplicate content from URL parameters
- **Update sitemaps automatically** — Shopify and WooCommerce + Yoast do this; for custom builds, regenerate on product publish/unpublish events
- **Add image sitemaps** — include product images with descriptive alt text for Google Image search traffic

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products not appearing in Google Shopping rich results | Check Google Search Console → Enhancements → Products for structured data errors; use Rich Results Test to validate |
| Faceted navigation creating millions of indexable URLs | Shopify/WooCommerce handle this automatically with canonicals; for custom builds, use `noindex, follow` on heavily filtered pages |
| Out-of-stock products returning 404 | Keep the page live at 200 status; show "out of stock" and suggest alternatives; remove from sitemap only if permanently discontinued |
| Schema.org validation errors | Test with Google's Rich Results Test; ensure price and availability are always present and correctly formatted |
| Slow Core Web Vitals hurting ranking | Preload hero images, compress product images, use lazy loading below fold; Shopify's CDN helps significantly |

## Related Skills

- @google-shopping-feed
- @google-ads-ecommerce
- @content-commerce
- @social-proof-widgets
