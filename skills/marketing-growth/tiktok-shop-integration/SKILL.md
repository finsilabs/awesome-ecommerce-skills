---
name: tiktok-shop-integration
description: "Sync your product catalog to TikTok Shop, manage orders and inventory, and enable shoppable content with live shopping and affiliate creator programs"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [tiktok-shop, social-commerce, live-shopping]
triggers: ["set up TikTok Shop", "enable live shopping"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# TikTok Shop Integration

## Overview

TikTok Shop transforms TikTok from a discovery channel into a direct commerce platform where users purchase without leaving the app — via shoppable video posts, LIVE shopping events, product showcase tabs, and creator affiliate programs. For Shopify and WooCommerce, official TikTok integrations handle catalog sync, order management, and inventory updates automatically. The strategic work is applying to TikTok Seller Center, structuring your affiliate program, and running LIVE shopping events.

## When to Use This Skill

- When launching TikTok as a native commerce channel (not just a traffic referral)
- When your products are suited to impulse purchase via short-form video
- When enabling creators to tag and earn commissions on your products
- When running LIVE shopping events for product launches or flash sales
- When needing to sync inventory and orders between TikTok Shop and your primary platform

## Core Instructions

### Step 1: Register on TikTok Shop Seller Center

Before any integration:

1. Go to `seller.tiktokshop.com` and create a seller account
2. Complete identity verification (government ID + business registration)
3. Connect your TikTok Business Account to the Seller Center
4. Wait for seller approval — typically 1–3 business days; some categories require additional documentation (food, supplements, electronics)

**Note:** TikTok Shop is currently available in the US, UK, Southeast Asia, and select other markets. Availability changes — check TikTok's current supported markets before starting.

### Step 2: Connect your platform to TikTok Shop

---

#### Shopify

1. Go to **Shopify Admin → Sales Channels → + → TikTok**
2. Install TikTok for Shopify and connect your TikTok Seller Center account
3. Under **Catalog Sync**, Shopify syncs your product catalog to TikTok Shop automatically
4. Shopify also syncs TikTok Shop orders back to Shopify Admin so you manage fulfillment in one place
5. Go to **TikTok → Products** to review which products were approved and which have issues
6. Products that fail TikTok's content review (image quality, prohibited categories) appear in **TikTok → Products → Rejected** with the reason

---

#### WooCommerce

1. Install **TikTok for WooCommerce** from the WordPress plugin directory
2. Go to **WooCommerce → TikTok → Seller Center** and connect your TikTok Seller Center account
3. The plugin syncs your WooCommerce products to TikTok Shop and pulls TikTok orders back into WooCommerce
4. Go to **WooCommerce → TikTok → Products** to monitor sync status and resolve any rejected products

---

#### BigCommerce

1. Go to **BigCommerce Admin → Channel Manager → Add a Channel → TikTok**
2. Connect your TikTok Seller Center account
3. BigCommerce automatically syncs products and inventory to TikTok Shop
4. TikTok orders appear in **BigCommerce → Orders** for unified fulfillment management

---

#### Custom / Headless

Use the TikTok Shop API directly for custom catalog management and order handling:

```typescript
const TIKTOK_SHOP_BASE = 'https://open-api.tiktokglobalshop.com';

async function syncProductToTikTokShop(product: Product) {
  // TikTok Shop API requires HMAC-SHA256 request signing
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = {
    title: product.name.substring(0, 255),
    description: product.description.replace(/<[^>]*>/g, '').substring(0, 5000),
    category_id: product.tikTokCategoryId, // find IDs in TikTok Seller Center → Products → Categories
    images: product.images.map(img => ({ url: img.url })),
    skus: product.variants.map(v => ({
      sales_attributes: v.options.map(opt => ({ attribute_name: opt.name, value_name: opt.value })),
      stock_infos: [{ available_stock: v.stockQuantity, warehouse_id: process.env.TIKTOK_WAREHOUSE_ID }],
      seller_sku: v.sku,
      original_price: v.price.toFixed(2),
    })),
  };

  return tiktokShopRequest('/api/products', body);
}

// Handle TikTok Shop order webhooks
// POST /webhooks/tiktok-shop
export async function handleTikTokShopWebhook(req: Request, res: Response) {
  const { type, data } = req.body;

  if (type === 'ORDER_STATUS_CHANGE') {
    // Sync TikTok order to your OMS
    await syncTikTokOrder(data.order_id, data.order_status);
  }

  res.json({ code: 0 }); // TikTok requires this exact response format
}
```

### Step 3: Set up product listings for TikTok Shop

After catalog sync, optimize each product for TikTok Shop:

**Product images:**
- Use square (1:1) or vertical (9:16) product images — landscape images underperform
- White or clean background for the main product image
- No text overlays, watermarks, or price callouts on images (TikTok rejects these)
- Minimum 500×500px; 1000×1000px recommended

**Product titles:**
- Include the primary keyword in the first 20 characters
- TikTok Shop displays titles in search and shopping feeds
- 255 character maximum

**Shipping:**
- Set up a warehouse in **TikTok Seller Center → Settings → Logistics**
- Link a TikTok-approved shipping carrier (UPS, USPS, FedEx for US sellers)
- TikTok buyers expect free shipping — set a free shipping threshold that makes economic sense (e.g., orders over $25)

### Step 4: Enable the creator affiliate program

TikTok Shop's Open Collaboration model lets any creator discover your products and tag them in content for a commission — no prior relationship needed.

1. Go to **TikTok Seller Center → Affiliate → Open Plan**
2. Set a commission rate per product category (typically 10–20% for ecommerce)
3. Products with enabled affiliate commissions automatically appear in the **TikTok Affiliate Marketplace** where creators browse for products to promote
4. Review affiliate creator applications under **Seller Center → Affiliate → Creators**

**For targeted partnerships:**
1. Go to **Seller Center → Affiliate → Targeted Collaboration**
2. Browse creator profiles and send collaboration invites with a custom commission rate
3. You can provide product samples and set specific posting requirements in the invitation

### Step 5: Run a LIVE Shopping event

LIVE Shopping events drive high-urgency sales with real-time product featuring:

**Before going live:**
1. In TikTok Seller Center, go to **Products** and ensure all products you plan to feature are "Active" status (product review takes 24–48 hours)
2. Go to **TikTok LIVE Studio** (download the app) or use the TikTok mobile app
3. Under **Shopping**, select the products to feature during the LIVE
4. Promote the LIVE 24–48 hours in advance via regular posts and Stories

**During the LIVE:**
1. Start the LIVE from TikTok app or LIVE Studio
2. Pin featured products using the shopping cart icon — viewers tap the pinned card to add to cart
3. Change the featured product in real time as you demo different items
4. Respond to comments about pricing, sizing, and availability to drive urgency

**Best times for LIVE Shopping events:** Tuesday, Wednesday, or Thursday evenings (7–9pm EST for US audience). Consistent scheduling builds a returning audience.

### Step 6: Manage TikTok Shop orders

TikTok requires fulfillment within 2 business days of order confirmation. Late shipments damage your seller rating.

**Fulfillment process:**
1. TikTok Shop orders appear in your platform admin (Shopify/WooCommerce) automatically if using the native integration
2. Print shipping labels from your platform admin — TikTok accepts tracking numbers from all major carriers
3. Enter the tracking number in TikTok Seller Center → Orders within 2 days
4. TikTok automatically updates the buyer on shipping status

**Returns:**
- Accept returns within 30 days of delivery (TikTok's default return window)
- Configure return logistics in **Seller Center → Settings → Returns**

## Best Practices

- **Keep inventory in sync within 5 minutes** — overselling on TikTok damages your seller rating and can result in account suspension; use your platform's native TikTok integration for real-time sync
- **Use Open Collaboration for discovery** — set a 10–15% commission rate on all products to attract micro-creators who discover your brand organically without outreach
- **Include dedicated TikTok Shop images** — square or 9:16 product images outperform landscape images; prepare TikTok-specific creative assets separate from your Shopify product images
- **Run LIVE events consistently** — 2× per week builds a returning audience; ad-hoc live events get low attendance
- **Monitor affiliate content for brand safety** — creators in Open Collaboration post without prior approval; review tagged content regularly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products stuck "Under Review" | Ensure product images are on white/clean backgrounds with no text overlays; prohibited categories (alcohol, certain supplements) require special approval |
| TikTok orders not appearing in Shopify | Disconnect and reconnect the TikTok for Shopify channel; check that Seller Center is linked to the correct TikTok Business account |
| Affiliate creators posting incorrect prices | Any price changes require creator content to be re-tagged; notify active affiliates before changing prices |
| LIVE Shopping products not showing on stream | Products must be "Active" status before going LIVE; review takes 24–48 hours, so activate products in advance |
| High return rate | TikTok buyers expect products to match the video exactly; avoid over-editing product images and ensure LIVE demos are accurate |

## Related Skills

- @tiktok-ads-integration
- @ugc-campaign-management
- @influencer-marketplace-integration
- @social-commerce
- @video-commerce-integration
