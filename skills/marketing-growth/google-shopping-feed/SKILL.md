---
name: google-shopping-feed
description: "Generate and optimize a product feed for Google Merchant Center so your products appear in Google Shopping ads with correct attributes"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [google-shopping, merchant-center, product-feed, pla, google-ads, rss, content-api, feed-optimization]
triggers: ["google shopping", "google merchant center", "product feed", "shopping ads", "google PLA", "google shopping feed"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Google Shopping Feed

## Overview

Google Merchant Center requires a product data feed in RSS 2.0 (XML) or TSV format with specific Google-defined attributes to serve Shopping ads. This skill covers generating a standards-compliant feed, implementing optimization rules that improve impression share and ROAS, and using the Content API for real-time updates so inventory and price changes propagate in minutes rather than 24 hours.

## When to Use This Skill

- When setting up Google Shopping Ads for the first time
- When products are being disapproved in Merchant Center due to feed quality issues
- When price or availability in the feed is lagging behind the live website
- When optimizing feed titles and descriptions to capture more relevant search queries
- When managing feeds for multiple countries or currencies
- When automating feed updates after bulk catalog imports

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Google Merchant Center account, product catalog API access

## Core Instructions

1. **Install the Google APIs client and configure credentials**

   ```bash
   npm install googleapis
   ```

   ```typescript
   import { google } from 'googleapis';

   const auth = new google.auth.GoogleAuth({
     keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
     scopes: ['https://www.googleapis.com/auth/content'],
   });

   const content = google.content({ version: 'v2.1', auth });
   ```

2. **Generate a Google-compliant XML feed endpoint**

   Google crawls a URL you register in Merchant Center. Serve the feed dynamically:

   ```typescript
   import { create } from 'xmlbuilder2';

   export async function generateGoogleShoppingFeed(req: Request, res: Response) {
     const products = await db.products.findAll({
       where: { status: 'active' },
       include: ['variants', 'images', 'shipping'],
     });

     const root = create({ version: '1.0', encoding: 'UTF-8' })
       .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
       .ele('channel')
       .ele('title').txt(process.env.STORE_NAME!).up()
       .ele('link').txt(process.env.STORE_URL!).up()
       .ele('description').txt(`${process.env.STORE_NAME} product feed`).up();

     for (const product of products) {
       for (const variant of product.variants) {
         const item = root.ele('item');
         item.ele('g:id').txt(variant.sku).up();
         item.ele('g:title').txt(buildOptimizedTitle(product, variant)).up();
         item.ele('g:description').txt(product.description.slice(0, 5000)).up();
         item.ele('g:link').txt(`${process.env.STORE_URL}/products/${product.slug}?variant=${variant.id}`).up();
         item.ele('g:image_link').txt(product.images[0]?.url ?? '').up();
         product.images.slice(1, 10).forEach((img) => item.ele('g:additional_image_link').txt(img.url).up());
         item.ele('g:condition').txt('new').up();
         item.ele('g:availability').txt(variant.inventory > 0 ? 'in_stock' : 'out_of_stock').up();
         item.ele('g:price').txt(`${(variant.priceInCents / 100).toFixed(2)} USD`).up();
         if (variant.salePriceInCents) {
           item.ele('g:sale_price').txt(`${(variant.salePriceInCents / 100).toFixed(2)} USD`).up();
         }
         item.ele('g:brand').txt(product.brand ?? process.env.STORE_NAME!).up();
         item.ele('g:google_product_category').txt(product.googleProductCategory).up();
         item.ele('g:product_type').txt(product.categories.map((c) => c.name).join(' > ')).up();
         item.ele('g:item_group_id').txt(product.id).up();
         if (variant.color) item.ele('g:color').txt(variant.color).up();
         if (variant.size) item.ele('g:size').txt(variant.size).up();
         item.ele('g:shipping_weight').txt(`${product.weightKg} kg`).up();
         item.ele('g:identifier_exists').txt(product.gtin ? 'yes' : 'no').up();
         if (product.gtin) item.ele('g:gtin').txt(product.gtin).up();
         if (product.mpn) item.ele('g:mpn').txt(product.mpn).up();
         root.up();
       }
     }

     res.setHeader('Content-Type', 'application/xml; charset=utf-8');
     res.setHeader('Cache-Control', 'public, max-age=3600');
     res.send(root.end({ prettyPrint: false }));
   }
   ```

3. **Optimize feed titles with attribute injection**

   Title quality directly affects search match rate. Google's algorithm matches product titles to search queries:

   ```typescript
   function buildOptimizedTitle(product: Product, variant: Variant): string {
     // Format: Brand + Product Name + Key Attribute + Size/Color
     // Max 150 characters; most critical keywords at the front
     const parts: string[] = [];

     if (product.brand) parts.push(product.brand);
     parts.push(product.name);
     if (variant.color) parts.push(variant.color);
     if (variant.size) parts.push(variant.size);
     if (product.material) parts.push(product.material);

     const title = parts.join(' ');
     return title.slice(0, 150);
   }

   // Example output: "Nike Air Max 90 White 10.5 Leather"
   ```

4. **Push real-time updates via the Content API**

   Batch updates for up to 1,000 products per request when prices or inventory change:

   ```typescript
   async function pushProductsToMerchantCenter(skus: string[]) {
     const variants = await db.variants.findBySKUs(skus, { include: ['product'] });

     const entries = variants.map((v, i) => ({
       batchId: i,
       merchantId: process.env.GOOGLE_MERCHANT_ID,
       method: 'insert',
       product: {
         offerId: v.sku,
         title: buildOptimizedTitle(v.product, v),
         description: v.product.description,
         link: `${process.env.STORE_URL}/products/${v.product.slug}?variant=${v.id}`,
         imageLink: v.product.images[0]?.url,
         contentLanguage: 'en',
         targetCountry: 'US',
         channel: 'online',
         availability: v.inventory > 0 ? 'in_stock' : 'out_of_stock',
         price: { value: (v.priceInCents / 100).toFixed(2), currency: 'USD' },
         brand: v.product.brand ?? process.env.STORE_NAME,
         condition: 'new',
         googleProductCategory: v.product.googleProductCategory,
         itemGroupId: v.product.id,
         color: v.color,
         sizes: v.size ? [v.size] : [],
       },
     }));

     await content.products.custombatch({
       requestBody: { entries },
     });
   }
   ```

5. **Set up supplemental feed for promotions**

   Use a supplemental feed to overlay sale prices without modifying the primary feed:

   ```typescript
   export async function generateSupplementalFeed(req: Request, res: Response) {
     const activeSales = await db.promotions.findActive({ type: 'sale' });

     const rows = ['id,sale_price,sale_price_effective_date'];
     for (const sale of activeSales) {
       for (const variant of sale.variants) {
         const startIso = sale.startsAt.toISOString();
         const endIso = sale.endsAt.toISOString();
         rows.push(`${variant.sku},${(sale.salePriceInCents / 100).toFixed(2)} USD,${startIso}/${endIso}`);
       }
     }

     res.setHeader('Content-Type', 'text/csv; charset=utf-8');
     res.send(rows.join('\n'));
   }
   ```

## Examples

### Detect and fix common disapproval reasons

```typescript
async function auditMerchantCenterIssues() {
  const response = await content.productstatuses.list({
    merchantId: process.env.GOOGLE_MERCHANT_ID,
    maxResults: 250,
  });

  const issues: Record<string, number> = {};

  for (const status of response.data.resources ?? []) {
    for (const dest of status.destinationStatuses ?? []) {
      if (dest.status === 'disapproved') {
        for (const issue of status.itemLevelIssues ?? []) {
          issues[issue.code!] = (issues[issue.code!] ?? 0) + 1;
        }
      }
    }
  }

  // Common codes: 'incorrect_image_link', 'missing_gtin', 'price_mismatch',
  //               'landing_page_error', 'image_link_broken'
  console.table(Object.entries(issues).sort((a, b) => b[1] - a[1]));
}
```

### Multi-country feed with currency conversion

```typescript
const COUNTRY_CONFIGS = [
  { country: 'US', currency: 'USD', language: 'en', multiplier: 1.0 },
  { country: 'GB', currency: 'GBP', language: 'en', multiplier: 0.79 },
  { country: 'CA', currency: 'CAD', language: 'en', multiplier: 1.36 },
];

async function pushToAllCountries(sku: string) {
  const variant = await db.variants.findBySKU(sku, { include: ['product'] });

  for (const config of COUNTRY_CONFIGS) {
    await content.products.insert({
      merchantId: process.env.GOOGLE_MERCHANT_ID,
      requestBody: {
        offerId: `${sku}-${config.country}`,
        contentLanguage: config.language,
        targetCountry: config.country,
        channel: 'online',
        price: {
          value: ((variant.priceInCents / 100) * config.multiplier).toFixed(2),
          currency: config.currency,
        },
      },
    });
  }
}
```

## Best Practices

- **Front-load keywords in titles** — Google truncates titles at ~70 characters in the UI; put brand and product name first
- **Set `identifier_exists: no` only when truly absent** — misusing it causes disapproval for products that do have GTINs/MPNs
- **Provide all available images** — feeds with 3+ images get higher quality scores and better ad placement
- **Use Google Product Taxonomy IDs, not names** — use the numeric ID (e.g., `187` for Shoes) for the `google_product_category` field
- **Register a supplemental feed for promotions** instead of editing the primary feed — it reduces crawl lag for sale prices
- **Ensure landing page price matches the feed price exactly** — even $0.01 discrepancy triggers price-mismatch disapproval
- **Cache the feed with a 1-hour TTL** — Merchant Center fetches frequently; avoid database hammering on every request
- **Monitor disapproval rate daily** — a spike often means a recent code deploy changed URL patterns or price formatting

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| `price_mismatch` disapproval | Ensure the `<g:price>` in the feed exactly matches the schema.org `offers.price` on the product page |
| Products missing from Shopping ads despite approval | Check that `targetCountry` and `contentLanguage` match the linked Google Ads campaign targeting |
| Feed fetch returns 404 after deployment | The feed URL is registered in Merchant Center as a fixed path — ensure your route still exists after deploys |
| GTIN required errors for private-label products | Set `identifier_exists: no` and provide a brand + MPN instead; Google accepts this for manufacturer exclusives |
| Variants showing as separate products instead of grouped | Ensure all variants share the same `item_group_id` and differ only by `color`, `size`, or `pattern` attributes |

## Related Skills

- @social-commerce
- @product-analytics
- @attribution-modeling
- @conversion-rate-optimization
- @sales-reporting-dashboard
