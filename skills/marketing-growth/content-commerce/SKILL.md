---
name: content-commerce
description: "Turn your blog into a sales channel by embedding shoppable product cards in editorial content and tracking content-influenced revenue"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [content-commerce, shoppable-content, blog, editorial, seo, product-embedding, cms, headless]
triggers: ["content commerce", "shoppable blog", "shoppable content", "editorial merchandising", "blog to commerce", "product embedding in blog"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Content Commerce

## Overview

Content commerce bridges editorial content — blog posts, buying guides, lookbooks — with direct product purchasing, capturing high-intent organic traffic and shortening the path from discovery to purchase. This skill covers embedding shoppable product widgets in CMS content, managing the relationship between articles and products, implementing schema.org markup for Google rich results, and tracking content-driven revenue attribution.

## When to Use This Skill

- When a blog drives significant organic traffic but contributes little to revenue
- When building a headless commerce setup where the CMS and storefront are separate systems
- When editorial team needs a no-code way to embed products inside articles
- When implementing SEO-optimized buying guides that rank for "best [product category]" queries
- When building a lookbook or collection page with editorial text and shoppable product grids
- When needing to track which content pieces drive the most revenue (content attribution)

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store with a blog/CMS, product catalog API access, analytics tracking

## Core Instructions

1. **Design the content-product relationship model**

   ```typescript
   // CMS content model (e.g., Contentful, Sanity, or custom)
   interface Article {
     id: string;
     slug: string;
     title: string;
     body: string;              // Rich text with product embeds as custom nodes
     featuredProductIds: string[];  // Curated products for the sidebar/footer
     categories: string[];
     publishedAt: Date;
   }

   interface ProductEmbed {
     type: 'product_embed';
     productId: string;
     displayStyle: 'card' | 'inline' | 'full';
     ctaText?: string;           // e.g., "Shop Now", "View Details"
     position: 'inline' | 'sidebar' | 'post_body';
   }

   // Database table: article_products (many-to-many)
   // article_id | product_id | embed_type | sort_order
   ```

2. **Build a CMS product embed component**

   For rich-text editors (e.g., Contentful Rich Text, Portable Text in Sanity), register a custom block type:

   ```typescript
   // Sanity schema definition for a product embed block
   // schemas/productEmbed.ts
   export const productEmbedType = {
     name: 'productEmbed',
     title: 'Product Embed',
     type: 'object',
     fields: [
       {
         name: 'product',
         title: 'Product',
         type: 'reference',
         to: [{ type: 'product' }],
       },
       {
         name: 'displayStyle',
         title: 'Display Style',
         type: 'string',
         options: { list: ['card', 'inline', 'full'] },
         initialValue: 'card',
       },
       {
         name: 'ctaText',
         title: 'CTA Text',
         type: 'string',
         initialValue: 'Shop Now',
       },
     ],
   };
   ```

   React renderer for the product embed:

   ```tsx
   // components/ProductEmbed.tsx
   import { useEffect, useState } from 'react';

   interface ProductEmbedProps {
     productId: string;
     displayStyle: 'card' | 'inline' | 'full';
     ctaText: string;
     articleId: string; // for attribution tracking
   }

   export function ProductEmbed({ productId, displayStyle, ctaText, articleId }: ProductEmbedProps) {
     const [product, setProduct] = useState<Product | null>(null);

     useEffect(() => {
       fetch(`/api/products/${productId}?fields=name,price,images,slug,inStock`)
         .then((r) => r.json())
         .then(setProduct);
     }, [productId]);

     if (!product) return <div className="product-embed-skeleton" />;

     const handleClick = () => {
       // Track content-to-commerce click for attribution
       fetch('/api/analytics/content-click', {
         method: 'POST',
         body: JSON.stringify({ articleId, productId, ctaText }),
       });
     };

     return (
       <div className={`product-embed product-embed--${displayStyle}`} data-product-id={productId}>
         <img src={product.images[0]?.url} alt={product.name} />
         <div className="product-embed__info">
           <h3>{product.name}</h3>
           <p className="price">${(product.priceInCents / 100).toFixed(2)}</p>
           {!product.inStock && <span className="out-of-stock">Out of stock</span>}
         </div>
         <a
           href={`/products/${product.slug}?ref=article&article_id=${articleId}`}
           onClick={handleClick}
           className="btn btn-primary"
         >
           {ctaText}
         </a>
       </div>
     );
   }
   ```

3. **Implement schema.org Article and Product markup for SEO**

   Rich results in Google Search require structured data. Add both Article and ItemList schema:

   ```typescript
   function buildArticleSchema(article: Article, products: Product[]) {
     return {
       '@context': 'https://schema.org',
       '@graph': [
         {
           '@type': 'Article',
           headline: article.title,
           datePublished: article.publishedAt.toISOString(),
           dateModified: article.updatedAt.toISOString(),
           author: { '@type': 'Organization', name: process.env.STORE_NAME },
         },
         {
           '@type': 'ItemList',
           name: `Products featured in: ${article.title}`,
           itemListElement: products.map((p, i) => ({
             '@type': 'ListItem',
             position: i + 1,
             item: {
               '@type': 'Product',
               name: p.name,
               image: p.images[0]?.url,
               url: `${process.env.STORE_URL}/products/${p.slug}`,
               offers: {
                 '@type': 'Offer',
                 price: (p.priceInCents / 100).toFixed(2),
                 priceCurrency: 'USD',
                 availability: p.inventory > 0
                   ? 'https://schema.org/InStock'
                   : 'https://schema.org/OutOfStock',
               },
             },
           })),
         },
       ],
     };
   }
   ```

4. **Build an editorial merchandising API for curated collections**

   Allow editors to create curated product selections tied to an article or campaign:

   ```typescript
   // POST /api/cms/articles/:articleId/products
   export async function setArticleProducts(req: Request, res: Response) {
     const { articleId } = req.params;
     const { productIds, displayConfig } = req.body;

     await db.articleProducts.deleteWhere({ articleId });
     await db.articleProducts.createMany(
       productIds.map((productId: string, i: number) => ({
         articleId,
         productId,
         sortOrder: i,
         displayConfig,
       }))
     );

     // Purge the article's edge cache
     await purgeCache(`/blog/${articleId}`);
     res.json({ ok: true });
   }

   // GET /api/cms/articles/:articleId/products
   export async function getArticleProducts(req: Request, res: Response) {
     const { articleId } = req.params;
     const products = await db.articleProducts.findByArticle(articleId, {
       include: ['product.images', 'product.variants'],
       orderBy: 'sortOrder',
     });
     res.json(products);
   }
   ```

5. **Track content-driven revenue with UTM attribution**

   Append UTM parameters to all in-content product links and track at the order level:

   ```typescript
   function buildContentProductUrl(product: Product, article: Article): string {
     const params = new URLSearchParams({
       utm_source: 'content',
       utm_medium: 'article',
       utm_campaign: article.slug,
       utm_content: product.slug,
     });
     return `${process.env.STORE_URL}/products/${product.slug}?${params}`;
   }

   // In the order webhook handler, capture UTM source for reporting
   async function captureOrderAttribution(orderId: string, utmParams: Record<string, string>) {
     await db.orderAttribution.create({
       orderId,
       source: utmParams.utm_source,
       medium: utmParams.utm_medium,
       campaign: utmParams.utm_campaign,
       content: utmParams.utm_content,
     });
   }
   ```

## Examples

### Auto-generate product recommendations from article keywords

Use product tags and article keywords to automatically suggest related products without manual curation:

```typescript
async function getAutoRecommendedProducts(article: Article, limit = 6): Promise<Product[]> {
  // Extract keywords from article title and categories
  const keywords = [
    ...article.title.toLowerCase().split(' '),
    ...article.categories,
  ].filter((k) => k.length > 3); // filter stop words by length

  // Find products whose tags overlap with article keywords
  const products = await db.products.findByTags(keywords, {
    limit,
    orderBy: { salesCount: 'desc' },
    where: { status: 'active', inventory: { gt: 0 } },
  });

  return products;
}
```

### Buying guide performance report

```sql
-- Content attribution: revenue driven by each article
SELECT
  oa.campaign AS article_slug,
  COUNT(DISTINCT o.id) AS orders,
  SUM(o.subtotal_cents) / 100.0 AS revenue,
  AVG(o.subtotal_cents) / 100.0 AS aov
FROM orders o
JOIN order_attribution oa ON o.id = oa.order_id
WHERE oa.source = 'content'
  AND o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY oa.campaign
ORDER BY revenue DESC
LIMIT 20;
```

## Best Practices

- **Load product embeds lazily** — product price and inventory change frequently; fetch live data at render time, not at CMS publish time
- **Cache product embed data at the edge with a short TTL** (5–15 minutes) — balances freshness with performance
- **Use UTM `utm_content` = product slug** so you can attribute which specific embedded product drove the conversion, not just which article
- **Add nofollow to in-content product links** if the content is written by affiliates or partners — this protects your PageRank
- **Provide an "out of stock" fallback** in the embed — show related products or a "notify me" button rather than a broken-looking card
- **Enable editorial team self-service** — build a product picker UI in the CMS so writers can embed products without engineering help
- **Track scroll depth on buying guides** — knowing that 60% of users drop off before reaching the embedded products tells you to move them higher up the page

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Product prices in articles are stale | Fetch prices from the storefront API at render time; never embed prices as static CMS content |
| Out-of-stock products remain embedded in live articles | Add an inventory check to the article rendering pipeline and replace out-of-stock embeds with alternatives |
| Article schema.org markup fails Google validation | Test with the Google Rich Results Test; ensure product `offers.price` is a number, not a formatted string with currency symbols |
| CMS editors can't find products to embed | Build a product search/picker in the CMS editor that queries the storefront API — don't rely on editors knowing SKUs or product IDs |
| Content attribution double-counts — same order attributed to both content and email | Use a priority hierarchy: paid search > email > content > organic; the first paid touch overrides content attribution |

## Related Skills

- @social-commerce
- @influencer-tracking
- @sms-marketing
- @email-marketing-automation
- @attribution-modeling
