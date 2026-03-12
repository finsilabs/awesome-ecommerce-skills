---
name: ecommerce-seo
description: "Product page SEO, structured data (JSON-LD), canonical URLs, and sitemap generation"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [seo, structured-data, json-ld, sitemap, canonical, meta-tags, schema-org]
triggers: ["optimize ecommerce SEO", "add structured data", "generate sitemap", "fix product page SEO"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# E-commerce SEO

## Overview

Implement technical SEO for e-commerce sites including product page meta tags, Schema.org structured data (JSON-LD), canonical URL management for variant/filter pages, XML sitemap generation, and internal linking strategies. This skill focuses on the engineering side of SEO — the markup, configuration, and automation that help search engines understand and rank your product pages.

## When to Use This Skill

- When building product pages that need to rank in Google Shopping and organic search
- When implementing JSON-LD structured data for rich snippets (price, availability, reviews)
- When handling canonical URLs for products with multiple variants or filter combinations
- When generating XML sitemaps for a large catalog (10K+ products)
- When optimizing Core Web Vitals for product and collection pages

## Core Instructions

1. **Set up meta tags for product pages**

   ```typescript
   interface ProductSeoData {
     title: string;
     description: string;
     canonicalUrl: string;
     ogImage: string;
     price: number;
     currency: string;
     availability: 'in_stock' | 'out_of_stock' | 'preorder';
   }

   function generateProductMetaTags(product: ProductSeoData): string {
     const availabilityMap = {
       in_stock: 'instock',
       out_of_stock: 'oos',
       preorder: 'preorder',
     };

     return `
       <title>${escapeHtml(product.title)} | Your Store</title>
       <meta name="description" content="${escapeHtml(product.description)}" />
       <link rel="canonical" href="${product.canonicalUrl}" />

       <!-- Open Graph -->
       <meta property="og:type" content="product" />
       <meta property="og:title" content="${escapeHtml(product.title)}" />
       <meta property="og:description" content="${escapeHtml(product.description)}" />
       <meta property="og:url" content="${product.canonicalUrl}" />
       <meta property="og:image" content="${product.ogImage}" />
       <meta property="product:price:amount" content="${(product.price / 100).toFixed(2)}" />
       <meta property="product:price:currency" content="${product.currency}" />
       <meta property="product:availability" content="${availabilityMap[product.availability]}" />

       <!-- Twitter -->
       <meta name="twitter:card" content="summary_large_image" />
       <meta name="twitter:title" content="${escapeHtml(product.title)}" />
       <meta name="twitter:image" content="${product.ogImage}" />
     `;
   }
   ```

2. **Implement JSON-LD structured data for products**

   ```typescript
   function buildProductJsonLd(product: Product, reviews: ReviewSummary) {
     const schema: Record<string, any> = {
       '@context': 'https://schema.org',
       '@type': 'Product',
       name: product.title,
       image: product.images.map(img => img.src),
       description: product.metaDescription || product.description.slice(0, 200),
       sku: product.variants[0]?.sku,
       mpn: product.variants[0]?.barcode,
       brand: {
         '@type': 'Brand',
         name: product.vendor,
       },
       offers: product.variants.length === 1
         ? buildSingleOffer(product.variants[0])
         : buildAggregateOffer(product.variants),
     };

     if (reviews.count > 0) {
       schema.aggregateRating = {
         '@type': 'AggregateRating',
         ratingValue: reviews.average.toFixed(1),
         reviewCount: reviews.count,
         bestRating: '5',
         worstRating: '1',
       };
     }

     return schema;
   }

   function buildSingleOffer(variant: ProductVariant) {
     return {
       '@type': 'Offer',
       url: `https://yourstore.com/products/${variant.productSlug}`,
       priceCurrency: 'USD',
       price: (variant.price / 100).toFixed(2),
       availability: variant.inventoryQuantity > 0
         ? 'https://schema.org/InStock'
         : 'https://schema.org/OutOfStock',
       seller: {
         '@type': 'Organization',
         name: 'Your Store',
       },
     };
   }

   function buildAggregateOffer(variants: ProductVariant[]) {
     const prices = variants.map(v => v.price);
     const anyInStock = variants.some(v => v.inventoryQuantity > 0);
     return {
       '@type': 'AggregateOffer',
       lowPrice: (Math.min(...prices) / 100).toFixed(2),
       highPrice: (Math.max(...prices) / 100).toFixed(2),
       priceCurrency: 'USD',
       offerCount: variants.length,
       availability: anyInStock
         ? 'https://schema.org/InStock'
         : 'https://schema.org/OutOfStock',
     };
   }
   ```

3. **Handle canonical URLs for variants and filtered pages**

   ```typescript
   // Canonical URL strategy:
   // - Product page: /products/blue-widget (canonical, no variant in URL)
   // - Variant selected: /products/blue-widget?variant=123 (canonical points to base product URL)
   // - Collection + filter: /collections/shoes?color=red&size=10 (canonical = self without sort/page params)
   // - Paginated: /collections/shoes?page=2 (canonical = self, with prev/next links)

   function getCanonicalUrl(path: string, query: Record<string, string>): string {
     const baseUrl = 'https://yourstore.com';

     // For product pages, strip variant parameters
     if (path.startsWith('/products/')) {
       return `${baseUrl}${path}`;
     }

     // For collection pages, keep filter params but strip sort/page
     if (path.startsWith('/collections/')) {
       const allowedParams = ['color', 'size', 'brand', 'material', 'price'];
       const filtered = Object.entries(query)
         .filter(([key]) => allowedParams.includes(key))
         .sort(([a], [b]) => a.localeCompare(b));

       if (filtered.length === 0) return `${baseUrl}${path}`;
       const qs = new URLSearchParams(filtered).toString();
       return `${baseUrl}${path}?${qs}`;
     }

     return `${baseUrl}${path}`;
   }

   // Pagination with rel prev/next
   function getPaginationLinks(basePath: string, page: number, totalPages: number) {
     const links: string[] = [];
     if (page > 1) {
       const prevUrl = page === 2
         ? basePath
         : `${basePath}?page=${page - 1}`;
       links.push(`<link rel="prev" href="${prevUrl}" />`);
     }
     if (page < totalPages) {
       links.push(`<link rel="next" href="${basePath}?page=${page + 1}" />`);
     }
     return links.join('\n');
   }
   ```

4. **Generate XML sitemaps for large catalogs**

   ```typescript
   import { createGzip } from 'zlib';
   import { SitemapStream, streamToPromise } from 'sitemap';

   // For large catalogs, split into sitemap index + child sitemaps
   // Each child sitemap should have max 50,000 URLs

   async function generateSitemapIndex(): Promise<string> {
     const totalProducts = await db.products.countActive();
     const sitemapCount = Math.ceil(totalProducts / 50000);

     let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
     xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

     // Product sitemaps
     for (let i = 1; i <= sitemapCount; i++) {
       xml += `  <sitemap>\n`;
       xml += `    <loc>https://yourstore.com/sitemaps/products-${i}.xml.gz</loc>\n`;
       xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
       xml += `  </sitemap>\n`;
     }

     // Collection sitemap
     xml += `  <sitemap>\n`;
     xml += `    <loc>https://yourstore.com/sitemaps/collections.xml.gz</loc>\n`;
     xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
     xml += `  </sitemap>\n`;

     // Pages sitemap
     xml += `  <sitemap>\n`;
     xml += `    <loc>https://yourstore.com/sitemaps/pages.xml.gz</loc>\n`;
     xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
     xml += `  </sitemap>\n`;

     xml += '</sitemapindex>';
     return xml;
   }

   async function generateProductSitemap(page: number): Promise<Buffer> {
     const limit = 50000;
     const offset = (page - 1) * limit;
     const products = await db.products.findActive({ limit, offset });

     const stream = new SitemapStream({ hostname: 'https://yourstore.com' });

     for (const product of products) {
       stream.write({
         url: `/products/${product.slug}`,
         lastmod: product.updatedAt.toISOString(),
         changefreq: 'daily',
         priority: 0.8,
         img: product.images.map(img => ({
           url: img.src,
           title: img.alt || product.title,
         })),
       });
     }

     stream.end();
     return streamToPromise(stream);
   }
   ```

5. **Implement breadcrumb structured data**

   ```typescript
   function buildBreadcrumbJsonLd(breadcrumbs: { name: string; url: string }[]) {
     return {
       '@context': 'https://schema.org',
       '@type': 'BreadcrumbList',
       itemListElement: breadcrumbs.map((crumb, index) => ({
         '@type': 'ListItem',
         position: index + 1,
         name: crumb.name,
         item: `https://yourstore.com${crumb.url}`,
       })),
     };
   }

   // Example usage:
   const breadcrumbs = [
     { name: 'Home', url: '/' },
     { name: 'Shoes', url: '/collections/shoes' },
     { name: 'Running Shoes', url: '/collections/running-shoes' },
     { name: 'Air Max 90', url: '/products/air-max-90' },
   ];
   ```

6. **Set up robots.txt and meta robots for e-commerce**

   ```typescript
   // Robots.txt generator
   function generateRobotsTxt(baseUrl: string): string {
     return `User-agent: *
   Allow: /

   # Block faceted navigation duplicate content
   Disallow: /collections/*?sort=
   Disallow: /collections/*?page=
   Disallow: /search?
   Disallow: /cart
   Disallow: /checkout
   Disallow: /account

   # Block internal API routes
   Disallow: /api/

   Sitemap: ${baseUrl}/sitemap.xml
   `;
   }

   // Use meta robots for fine-grained control
   function getMetaRobots(page: PageContext): string {
     // Don't index filtered collection pages with many active filters
     if (page.type === 'collection' && page.activeFilterCount > 2) {
       return 'noindex, follow';
     }

     // Don't index search results
     if (page.type === 'search') {
       return 'noindex, follow';
     }

     // Don't index out-of-stock products (optional strategy)
     if (page.type === 'product' && !page.inStock) {
       return 'noindex, follow';  // Or keep indexed but mark as OutOfStock in structured data
     }

     return 'index, follow';
   }
   ```

## Examples

### Next.js product page with SEO

```typescript
// pages/products/[slug].tsx
import Head from 'next/head';
import type { GetStaticProps, GetStaticPaths } from 'next';

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await db.products.getAllActiveSlugs();
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const product = await db.products.findBySlug(params.slug as string);
  if (!product || product.status !== 'active') {
    return { notFound: true };
  }

  return {
    props: { product: serialize(product) },
    revalidate: 300, // ISR: regenerate every 5 minutes
  };
};

export default function ProductPage({ product }) {
  const canonicalUrl = `https://yourstore.com/products/${product.slug}`;
  const productSchema = buildProductJsonLd(product, product.reviews);
  const breadcrumbSchema = buildBreadcrumbJsonLd(product.breadcrumbs);

  return (
    <>
      <Head>
        <title>{product.seoTitle || product.title} | Your Store</title>
        <meta name="description" content={product.seoDescription || product.description.slice(0, 160)} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.title} />
        <meta property="og:image" content={product.images[0]?.src} />
        <meta property="og:url" content={canonicalUrl} />
        <script
          type="application/ld+json"
          key="product-schema"
        >
          {JSON.stringify(productSchema)}
        </script>
        <script
          type="application/ld+json"
          key="breadcrumb-schema"
        >
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Head>
      {/* Product page content */}
    </>
  );
}
```

### Automated sitemap regeneration with cron

```typescript
// scripts/regenerate-sitemaps.ts
// Run via cron: 0 */6 * * * (every 6 hours)

import { writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { join } from 'path';

async function regenerateSitemaps() {
  const outputDir = join(process.cwd(), 'public', 'sitemaps');

  // 1. Generate sitemap index
  const index = await generateSitemapIndex();
  writeFileSync(join(process.cwd(), 'public', 'sitemap.xml'), index);

  // 2. Generate product sitemaps
  const totalProducts = await db.products.countActive();
  const sitemapCount = Math.ceil(totalProducts / 50000);

  for (let i = 1; i <= sitemapCount; i++) {
    const sitemap = await generateProductSitemap(i);
    writeFileSync(
      join(outputDir, `products-${i}.xml.gz`),
      gzipSync(sitemap)
    );
  }

  // 3. Generate collection sitemap
  const collections = await db.collections.findPublished();
  const collectionSitemap = buildCollectionSitemap(collections);
  writeFileSync(
    join(outputDir, 'collections.xml.gz'),
    gzipSync(collectionSitemap)
  );

  // 4. Ping search engines
  await fetch('https://www.google.com/ping?sitemap=https://yourstore.com/sitemap.xml');

  console.log(`Sitemaps regenerated: ${totalProducts} products, ${collections.length} collections`);
}

regenerateSitemaps().catch(console.error);
```

## Best Practices

- **Write unique meta descriptions for every product** — avoid duplicating the product title as the description; include key attributes (size, material, price) that help click-through rate
- **Use JSON-LD over microdata** — Google recommends JSON-LD for structured data; it's easier to maintain and doesn't clutter your HTML
- **Set canonical URLs on every page** — self-referencing canonicals prevent duplicate content from URL parameters (tracking codes, sort options)
- **Compress sitemaps with gzip** — large sitemaps must be gzipped and split at 50,000 URLs per file
- **Update sitemaps automatically** — regenerate sitemaps on product publish/unpublish, not just on a schedule
- **Add image sitemaps** — include product images in your sitemap with descriptive titles for Google Image search traffic
- **Use hreflang for multi-language stores** — if you sell in multiple languages/regions, implement hreflang tags to avoid duplicate content penalties
- **Monitor with Google Search Console** — verify structured data, check for crawl errors, and monitor indexing status regularly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Faceted navigation creates millions of indexable URLs | Use `noindex, follow` on heavily filtered pages and block filter params in robots.txt |
| Out-of-stock products return 404 | Keep the page live with a 200 status; show "out of stock" and suggest alternatives; remove from sitemap only if permanently discontinued |
| Duplicate content from product variants | Use a single canonical URL for the product regardless of selected variant; don't give each variant its own indexable URL |
| Schema.org validation errors in Google Search Console | Test structured data with Google's Rich Results Test tool before deploying; ensure price and availability are always present |
| Slow page load hurts Core Web Vitals | Preload hero images, lazy-load below-fold content, and inline critical CSS; target LCP under 2.5 seconds |
| Missing alt text on product images | Auto-generate alt text from product title + variant options (e.g., "Blue Running Shoe - Front View") but allow manual overrides |

## Related Skills

- @product-page-design
- @ecommerce-caching
- @product-data-modeling
- @storefront-performance
- @headless-storefront
