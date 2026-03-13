---
name: social-commerce
description: "Sync your catalog to Instagram, TikTok, and Facebook to enable shoppable posts and in-app checkout directly from your social content"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [social-commerce, instagram, tiktok, facebook, catalog, shoppable-posts, meta, product-tagging]
triggers: ["social commerce", "instagram shopping", "tiktok shop", "shoppable posts", "social checkout", "facebook catalog", "instagram product tagging"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Social Commerce

## Overview

Social commerce integrates your product catalog with Instagram, TikTok, and Facebook so customers can discover and purchase products without leaving those platforms. Shopify, WooCommerce, and BigCommerce all have official integrations that sync your catalog automatically — no custom code required. The strategic work is setting up the catalog correctly, enabling product tagging in posts, and monitoring catalog health.

## When to Use This Skill

- When adding Instagram Shopping or TikTok Shop to an existing store
- When syncing a product catalog to Meta Commerce Manager for the first time
- When product tags in Instagram posts are returning "product not found" errors
- When price or availability in social product listings is lagging behind your store
- When building a custom headless storefront without native platform integrations

## Core Instructions

### Step 1: Choose your social commerce channels

| Platform | Setup Via | In-App Checkout | Best For |
|----------|----------|----------------|---------|
| **Instagram Shopping** | Meta Commerce Manager | Yes (US only) | Fashion, beauty, lifestyle |
| **Facebook Shop** | Meta Commerce Manager | Yes (US only) | All categories |
| **TikTok Shop** | TikTok Seller Center | Yes | Viral/impulse products |
| **Pinterest Shopping** | Pinterest Ads Manager | No (links to your store) | Home, fashion, food |

**Shopify users:** One integration (Facebook & Instagram channel) enables both Instagram and Facebook Shopping simultaneously. TikTok requires a separate integration.

### Step 2: Connect your platform to Instagram and Facebook Shopping

---

#### Shopify

1. Go to **Shopify Admin → Sales Channels → + → Facebook & Instagram**
2. Install the channel and connect your Meta Business Manager account
3. Under **Commerce → Catalog**, Shopify automatically syncs your product catalog to Meta Commerce Manager — every product, variant, price, and inventory update syncs automatically
4. In **Meta Commerce Manager → Catalog → Items**, check that products are appearing and approved
5. In **Instagram → Settings → Business → Shopping**: connect your Meta catalog to your Instagram profile — this enables product tagging in posts
6. Wait for Instagram Shop review approval (typically 1–5 business days)
7. Once approved, go to **Instagram → Create Post → Tag Products** to add product tags to any photo or reel

**For TikTok Shop:**
1. Go to **Shopify Admin → Sales Channels → + → TikTok**
2. Install the TikTok for Shopify channel
3. Connect your TikTok Seller Central account
4. Shopify syncs your product catalog to TikTok Shop automatically

---

#### WooCommerce

1. Install **Facebook for WooCommerce** (free, official Meta plugin) from WordPress plugin directory
2. Go to **WooCommerce → Facebook → Get Started** and connect your Meta Business Manager
3. The plugin syncs your WooCommerce product catalog to Meta Commerce Manager automatically
4. Enable shopping in your Instagram settings → link the Meta catalog created by the plugin
5. For TikTok: install **TikTok for WooCommerce** plugin and connect your TikTok Seller Central account

---

#### BigCommerce

1. Go to **BigCommerce Admin → Channel Manager → Add a Channel**
2. Select **Facebook & Instagram** and connect your Meta Business Manager account
3. BigCommerce automatically creates a product feed and syncs it to Meta Commerce Manager
4. For TikTok: go to **Channel Manager → TikTok** and connect your TikTok Seller Central account
5. Check catalog sync status in **Channel Manager → Facebook & Instagram → Products**

---

#### Custom / Headless

Generate a Meta-compatible XML feed and register it in Meta Commerce Manager:

```typescript
import { XMLBuilder } from 'fast-xml-parser';

export async function generateMetaCatalogFeed(req: Request, res: Response) {
  const products = await db.products.findAll({
    where: { status: 'active', availableForSale: true },
    include: ['variants', 'images'],
  });

  const items = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.sku,                    // Use SKU as the catalog item ID — must be stable
      title: p.name,
      description: p.description.slice(0, 9999),
      availability: v.inventory > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: `${(v.priceInCents / 100).toFixed(2)} USD`,
      link: `${process.env.STORE_URL}/products/${p.slug}?variant=${v.id}`,
      image_link: p.images[0]?.url,
      brand: p.brand ?? process.env.STORE_NAME,
      google_product_category: p.googleProductCategory,
      item_group_id: p.id,          // Required: groups variants together in Meta
      color: v.color,
      size: v.size,
    }))
  );

  const builder = new XMLBuilder({ arrayNodeName: 'item', ignoreAttributes: false });
  const xml = builder.build({ rss: { channel: { item: items } } });

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
}
```

Register the feed URL in **Meta Commerce Manager → Catalog → Data Sources → Add Data Feed** with hourly refresh schedule.

For real-time price and inventory updates (rather than waiting for the hourly crawl), use Meta's Catalog Batch API:

```typescript
// Push individual product updates immediately when price or inventory changes
async function pushProductUpdateToMeta(variantSku: string, inventory: number, priceInCents: number) {
  await fetch(`https://graph.facebook.com/v18.0/${process.env.META_CATALOG_ID}/items_batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: process.env.META_ACCESS_TOKEN,
      item_type: 'PRODUCT_ITEM',
      requests: [{
        method: 'UPDATE',
        retailer_id: variantSku,
        data: {
          availability: inventory > 0 ? 'in stock' : 'out of stock',
          price: `${(priceInCents / 100).toFixed(2)} USD`,
        },
      }],
    }),
  });
}
```

### Step 3: Enable product tagging in Instagram posts

After catalog is approved in Instagram Shop:

1. Create an Instagram post or reel as normal
2. On the sharing screen, tap **Tag Products**
3. Tap on the product visible in the image
4. Search for the product name and select it from your catalog
5. Up to 5 products can be tagged per image post, 1 per video

**For Stories:** tap the sticker icon → Product → search your catalog

**For Reels:** same as video posts — add the product link sticker

### Step 4: Set up TikTok Shop product tagging

After TikTok Seller Central is approved and catalog is synced:

1. Create a TikTok video in the TikTok app
2. Tap **Products** during upload → select the product from your synced catalog
3. TikTok adds a shopping bag icon to the video — viewers tap it to see the product and purchase in-app
4. For Live Shopping: go to TikTok Live → tap the cart icon → add products to your live session

### Step 5: Monitor catalog health

Catalog errors prevent products from being tagged or shown in shops. Check weekly:

**Meta Commerce Manager:**
1. Go to **Commerce Manager → Catalog → Diagnostics**
2. Review errors by category:
   - Missing required field (typically brand or google_product_category)
   - Policy violation (image shows text overlay, product makes restricted claims)
   - Price mismatch (feed price differs from landing page price)
3. For Shopify/WooCommerce with native integration: fix product data in your platform admin — changes sync automatically

**TikTok Seller Center:**
1. Go to **Products → All Products** and filter by "Under Review" or "Rejected"
2. Fix flagged issues (usually image quality or prohibited product categories)

### Step 6: Measure social commerce performance

| Metric | Where to Find |
|--------|---------------|
| Revenue from Instagram Shopping | Meta Commerce Manager → Analytics → Sales |
| Revenue from TikTok Shop | TikTok Seller Center → Analytics |
| Product tag click-through rate | Meta Business Suite → Content → Posts |
| Catalog item rejection rate | Commerce Manager → Catalog → Diagnostics |

## Best Practices

- **Use SKU as the catalog item ID** — SKUs are stable across systems and match your warehouse; using database IDs causes mismatches when data migrates
- **Always include `item_group_id` for variant products** — Meta and TikTok use this to group color/size options into a single product display instead of showing duplicates
- **Ensure product images have no text overlay** — Meta's catalog policy rejects images with overlaid promotional text, watermarks, or collages
- **Enable real-time batch updates for price changes** — if you run frequent promotions, the hourly feed crawl creates a price mismatch window; use the Batch API to push changes immediately
- **Complete TikTok Seller Central approval before linking your store** — TikTok requires a separate seller review process; catalog sync alone does not unlock TikTok Shop

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products stuck "under review" in Instagram Shop | Ensure product images show the item clearly with no overlaid text; review Meta's Commerce Policies for prohibited categories |
| Price mismatch error in Meta | The price in your feed must exactly match the price on the landing page; if running a sale, update both simultaneously |
| TikTok catalog items not appearing in TikTok Shop | TikTok requires separate Seller Center account approval — catalog sync is not sufficient; apply for TikTok Shop separately |
| Product tags not showing on Instagram posts | Your Instagram Shop must be approved before tagging works; check **Instagram → Settings → Business → Shopping** for status |
| Feed URL returns 403 after deployment | Add the Meta crawler's IP range to your CDN allowlist, or ensure the feed URL is publicly accessible without authentication |

## Related Skills

- @meta-ads-integration
- @google-shopping-feed
- @tiktok-ads-integration
- @influencer-tracking
- @ugc-campaign-management
