---
name: google-shopping-feed
description: "Generate and optimize a product feed for Google Merchant Center so your products appear in Google Shopping ads with correct attributes"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [google-shopping, merchant-center, product-feed, pla, google-ads, feed-optimization]
triggers: ["google shopping", "google merchant center", "product feed", "shopping ads", "google PLA", "google shopping feed"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Google Shopping Feed

## Overview

Google Merchant Center requires a product data feed with specific attributes to serve Shopping ads. Shopify, WooCommerce, and BigCommerce all have official Google integrations that handle feed generation automatically. This skill covers setting up the integration, optimizing feed quality (the primary Shopping ranking factor), and fixing common disapproval issues.

## When to Use This Skill

- When setting up Google Shopping Ads for the first time
- When products are being disapproved in Merchant Center due to feed quality issues
- When price or availability in the feed is lagging behind the live website
- When optimizing feed titles and descriptions to capture more relevant search queries
- When managing feeds for multiple countries or currencies

## Core Instructions

### Step 1: Set up your Google Merchant Center account

1. Go to merchants.google.com and create an account
2. Verify and claim your store's domain under **Business Information → Website** (add a meta tag or upload a file to your store)
3. Accept the Merchant Center terms and policies
4. Link your Google Ads account: **Settings → Linked Accounts → Google Ads**

### Step 2: Connect your platform to Merchant Center

---

#### Shopify

1. Go to **Shopify Admin → Sales Channels → + → Google & YouTube**
2. Install the Google & YouTube channel
3. Connect your Google account and select your Merchant Center account
4. Under **Product Feed**, Shopify automatically syncs your entire catalog with all required attributes (title, price, availability, images, GTIN if provided)
5. Go to **Google & YouTube → Overview** to verify the feed sync status
6. Check **Products → Issues** in Merchant Center to see any disapproved products

**Improving feed quality on Shopify:**
- Ensure every product has: a clear title with brand + product name, a description, a main image, and the correct product type
- Add GTINs (barcodes) to products under **Products → [Product] → Variants → Barcode** — GTINs improve Shopping impression share significantly
- For Google product category: install **Google Shopping Feed** or **Feedonomics** app from the Shopify App Store to map Shopify product types to Google Taxonomy IDs

---

#### WooCommerce

1. Install the **Google Listings & Ads** plugin (free, official Google plugin) from the WordPress plugin directory
2. Go to **WooCommerce → Google Listings & Ads** and connect your Google account
3. Complete the setup wizard — it creates the Merchant Center account if you do not have one and submits your feed
4. Products are synced automatically from WooCommerce; check **Google Listings & Ads → Product Feed** for sync status

**For more control**: install **WooCommerce Product Feed Pro** ($70/yr) — it gives you full control over feed attributes, custom labels, and supplemental feeds for promotions.

**Add Google product category to WooCommerce products:**
- Go to each product or product category in WooCommerce admin
- The Google Listings & Ads plugin adds a "Google Category" field — fill this in using Google's product taxonomy

---

#### BigCommerce

1. Go to **BigCommerce Admin → Channel Manager**
2. Click **Add a Channel → Google Shopping**
3. Connect your Google Merchant Center account — BigCommerce automatically creates the feed at `yourstore.com/xmlfeed.xml`
4. Check **Channel Manager → Google Shopping → Products** for product status and disapprovals

For enhanced feed optimization: install **GoDataFeed** or **Feedonomics** from the BigCommerce App Marketplace.

---

#### Custom / Headless

Generate a standards-compliant XML feed endpoint that Google can crawl:

```typescript
import { create } from 'xmlbuilder2';

export async function generateGoogleShoppingFeed(req: Request, res: Response) {
  const products = await db.products.findAll({
    where: { status: 'active' },
    include: ['variants', 'images'],
  });

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
    .ele('channel')
    .ele('title').txt(process.env.STORE_NAME!).up()
    .ele('link').txt(process.env.STORE_URL!).up();

  for (const product of products) {
    for (const variant of product.variants) {
      const item = root.ele('item');
      item.ele('g:id').txt(variant.sku).up();
      // Title format: Brand + Product Name + Key Attribute (Color/Size)
      item.ele('g:title').txt(
        [product.brand, product.name, variant.color, variant.size].filter(Boolean).join(' ').slice(0, 150)
      ).up();
      item.ele('g:description').txt(product.description.slice(0, 5000)).up();
      item.ele('g:link').txt(`${process.env.STORE_URL}/products/${product.slug}?variant=${variant.id}`).up();
      item.ele('g:image_link').txt(product.images[0]?.url ?? '').up();
      item.ele('g:condition').txt('new').up();
      item.ele('g:availability').txt(variant.inventory > 0 ? 'in_stock' : 'out_of_stock').up();
      item.ele('g:price').txt(`${(variant.priceInCents / 100).toFixed(2)} USD`).up();
      item.ele('g:brand').txt(product.brand ?? process.env.STORE_NAME!).up();
      item.ele('g:google_product_category').txt(product.googleProductCategory).up();
      item.ele('g:item_group_id').txt(product.id).up(); // groups variants together
      if (variant.color) item.ele('g:color').txt(variant.color).up();
      if (variant.size) item.ele('g:size').txt(variant.size).up();
      if (product.gtin) item.ele('g:gtin').txt(product.gtin).up();
      item.ele('g:identifier_exists').txt(product.gtin ? 'yes' : 'no').up();
    }
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(root.end({ prettyPrint: false }));
}
```

Register this feed URL in Merchant Center under **Products → Feeds → Add a Primary Feed**.

Use the Content API to push real-time price/inventory updates instead of waiting for Google's scheduled crawl:
```typescript
import { google } from 'googleapis';

const content = google.content({ version: 'v2.1', auth: await new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/content'],
}).getClient() });

// Push updated product when inventory or price changes
await content.products.insert({
  merchantId: process.env.GOOGLE_MERCHANT_ID,
  requestBody: {
    offerId: variant.sku,
    availability: variant.inventory > 0 ? 'in_stock' : 'out_of_stock',
    price: { value: (variant.priceInCents / 100).toFixed(2), currency: 'USD' },
    contentLanguage: 'en',
    targetCountry: 'US',
    channel: 'online',
  },
});
```

### Step 3: Optimize feed quality

Feed quality is the primary Shopping ranking factor. Fix these in order of impact:

1. **Optimize product titles** — put brand and key attributes first (Google truncates after ~70 characters):
   - Good: "Nike Air Max 90 White Men's Size 10"
   - Bad: "Air Max 90 - Various Colors Available"

2. **Add GTINs/barcodes** — missing GTINs is the most common cause of reduced impression share; add barcodes to every product that has one

3. **Set Google product category** — use Google's taxonomy (search "Google Product Taxonomy") and map each product type; use numeric IDs for exact matching

4. **Ensure landing page price matches feed price** — even $0.01 discrepancy causes price-mismatch disapproval; check Merchant Center → Diagnostics weekly

5. **Add multiple product images** — products with 3+ images get higher quality scores; lifestyle images + white background images both help

### Step 4: Fix common disapproval issues

In Merchant Center, go to **Products → Diagnostics** to see all issues:

| Disapproval Reason | Fix |
|-------------------|-----|
| Price mismatch | Ensure feed price exactly matches schema.org price on the product page |
| Missing required attribute | Add missing fields: typically `brand`, `gtin`, or `google_product_category` |
| Image too small | Use images at least 500×500px; 1000×1000px recommended |
| Landing page error | Verify the product URL in the feed returns a 200 status code |
| Policy violation | Read the specific policy — common issues: drug claims, copyright images, counterfeit products |

## Best Practices

- **Front-load keywords in titles** — Google truncates titles at ~70 characters in the UI; put brand and product name first
- **Register a supplemental feed for promotions** — overlay sale prices without modifying the primary feed; reduces disapproval risk during sales
- **Cache the feed response with a 1-hour TTL** — Merchant Center crawls frequently; avoid hammering your database on every request
- **Monitor disapproval rate daily** — a spike often means a recent deploy changed URL patterns or price formatting
- **Set `identifier_exists: no` only for truly private-label products without any GTIN/MPN** — misusing it causes disapproval for products that do have identifiers

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products missing from Shopping ads despite being approved | Check that `targetCountry` and `contentLanguage` match the linked Google Ads campaign targeting |
| Feed fetch returns 404 after deployment | The feed URL is registered in Merchant Center — ensure your route still exists after deploys |
| GTIN required errors for private-label products | Set `identifier_exists: no` and provide a brand + MPN instead |
| Variants showing as separate products | Ensure all variants share the same `item_group_id` and differ only by `color`, `size`, or `pattern` |
| Shopify feed sync stuck | In Shopify, go to Google & YouTube → disconnect and reconnect the integration; or use a third-party feed app like Simprosys |

## Related Skills

- @google-ads-ecommerce
- @ecommerce-seo
- @meta-ads-integration
- @marketing-attribution-dashboard
