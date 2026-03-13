---
name: tiktok-ads-integration
description: "Launch TikTok ad campaigns for ecommerce with Events API server-side tracking, Spark Ads, catalog sync, and shopping ads for product discovery"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [tiktok, tiktok-ads, spark-ads, social-advertising]
triggers: ["set up TikTok ads", "implement TikTok pixel", "create TikTok shopping ads"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# TikTok Ads Integration

## Overview

TikTok is a primary discovery channel for ecommerce, particularly for fashion, beauty, home, and consumer goods. Reliable attribution requires pairing the browser-based TikTok Pixel with the server-side Events API (EAPI) — similar to Meta's CAPI approach. For Shopify, WooCommerce, and BigCommerce, the official TikTok integrations install both Pixel and EAPI automatically. Custom implementation only belongs in the Custom/Headless section.

## When to Use This Skill

- When launching TikTok as a new paid acquisition channel
- When TikTok Pixel is under-reporting conversions and you need Events API
- When setting up Product Shopping Ads or Video Shopping Ads
- When boosting organic creator content as Spark Ads
- When syncing your product catalog for Dynamic Showcase Ads

## Core Instructions

### Step 1: Connect your platform to TikTok

| Platform | Integration Method | Pixel + EAPI | Catalog Sync |
|----------|--------------------|-------------|-------------|
| **Shopify** | TikTok for Shopify (official app) | Yes (built-in) | Yes (automatic) |
| **WooCommerce** | TikTok for WooCommerce plugin | Yes (built-in) | Yes (automatic) |
| **BigCommerce** | TikTok channel in Channel Manager | Yes (built-in) | Yes (automatic) |
| **Custom / Headless** | TikTok Pixel JS + Events API REST | Manual implementation | Manual feed generation |

### Step 2: Set up TikTok Ads

---

#### Shopify

1. Go to **Shopify Admin → Sales Channels → + → TikTok**
2. Install TikTok for Shopify and connect your TikTok Business account and Ad account
3. Under **Pixel & Events**, select **Maximum Data Sharing** — this enables server-side Events API alongside the browser Pixel
4. Shopify automatically:
   - Installs the TikTok Pixel on all pages
   - Fires ViewContent, AddToCart, InitiateCheckout, and CompletePayment events
   - Sends the same events via EAPI from Shopify's servers
   - Syncs your product catalog to TikTok Catalog Manager for Shopping Ads
5. Go to **TikTok Ads Manager → Assets → Events** and check your Pixel's event quality score — aim for 7+/10
6. Check catalog sync status in **TikTok Business Center → Catalogs**

---

#### WooCommerce

1. Install **TikTok for WooCommerce** from the WordPress plugin directory (official TikTok plugin)
2. Go to **WooCommerce → TikTok → Connect** and sign in with your TikTok Business account
3. Enable **Enhanced Matching** (EAPI) under the data sharing settings
4. The plugin syncs your WooCommerce product catalog to TikTok Catalog Manager automatically
5. Verify events in **TikTok Events Manager → Data Sources → [Your Pixel]**

---

#### BigCommerce

1. Go to **BigCommerce Admin → Channel Manager → Add a Channel → TikTok**
2. Connect your TikTok Business account and Ad account
3. Enable server-side event tracking during setup
4. BigCommerce syncs your product catalog to TikTok automatically
5. Check product sync status in **Channel Manager → TikTok → Products**

---

#### Custom / Headless

For headless stores, install both the browser Pixel and server-side Events API:

**Browser Pixel (add to `<head>` on every page):**
```javascript
ttq.load('YOUR_PIXEL_ID');
ttq.page();

// Product page
ttq.track('ViewContent', {
  content_id: product.sku,
  content_type: 'product',
  content_name: product.name,
  value: product.price,
  currency: 'USD',
});

// Purchase — pass event_id for deduplication with Events API
const purchaseEventId = `purchase-${order.id}`;
ttq.track('CompletePayment', {
  content_id: order.lineItems.map(i => i.sku).join(','),
  value: order.subtotal,
  currency: order.currencyCode,
  order_id: order.id,
}, { event_id: purchaseEventId });
```

**Server-side Events API (send from your order webhook):**
```typescript
async function trackTikTokPurchase(order: Order, req: Request) {
  const eventId = `purchase-${order.id}`; // MUST match Pixel event_id for deduplication
  const { createHash } = await import('crypto');
  const sha256 = (val: string) => createHash('sha256').update(val.toLowerCase().trim()).digest('hex');

  await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/pixel/track/?business_id=${process.env.TIKTOK_BUSINESS_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': process.env.TIKTOK_ACCESS_TOKEN!,
      },
      body: JSON.stringify({
        data: [{
          pixel_code: process.env.TIKTOK_PIXEL_ID,
          event: 'CompletePayment',
          event_id: eventId,
          event_time: Math.floor(Date.now() / 1000),
          user: {
            email: sha256(order.customerEmail),
            phone_number: sha256(order.customerPhone?.replace(/\D/g, '') ?? ''),
            ip: req.ip,
            user_agent: req.headers['user-agent'],
            ttclid: req.cookies['ttclid'], // TikTok click ID — strongest attribution signal
          },
          properties: {
            value: order.subtotal,
            currency: order.currencyCode,
            contents: order.lineItems.map(i => ({ content_id: i.sku, content_type: 'product' })),
            order_id: order.id,
          },
          page: { url: `${process.env.STORE_URL}/checkout/thank-you` },
        }],
      }),
    }
  );
}
```

### Step 3: Build your TikTok campaign structure

In **TikTok Ads Manager**, build a three-tier campaign structure:

**Campaign 1: Prospecting — Video Shopping Ads**
- Objective: Product Sales
- Ad Group audience: Broad (target country, age 18–45, no interest targeting)
- Bidding: Lowest Cost (let the algorithm learn for the first 2 weeks)
- Ads: Video Shopping Ads — TikTok auto-generates product videos from your catalog, or upload your own UGC-style vertical videos
- Budget: 60% of total TikTok budget

**Campaign 2: Retargeting — Engaged Users**
- Objective: Conversions
- Ad Group 1: Viewed product in last 7 days but did not add to cart
  - Custom Audience: Website Event → ViewContent, last 7 days
- Ad Group 2: Added to cart but did not purchase (last 3 days)
  - Custom Audience: AddToCart, last 3 days; exclude CompletePayment
- Ads: Dynamic product ads showing the specific product the viewer engaged with
- Budget: 30% of total TikTok budget

**Campaign 3: Spark Ads — Boost Organic Content**
- Objective: Conversions
- Use Spark Ads to boost your top-performing organic TikTok posts or authorized creator posts
- Spark Ads outperform most polished brand content because the social proof (likes, comments) carries over
- Budget: 10% of total TikTok budget

### Step 4: Set up Spark Ads (boosting organic content)

1. In TikTok Ads Manager, go to **Assets → Creative → Spark Ads**
2. To boost your own organic posts: search for the post URL and request authorization
3. To boost creator posts: the creator must grant Spark Ad authorization via TikTok's authorization process — they go to **Creator Tools → TikTok for Business** and generate an authorization code
4. Authorization codes are valid for 30 days — plan renewal into your workflow

### Step 5: Measure TikTok Ads performance

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Pixel Event Quality Score | 7+/10 | TikTok Events Manager → Pixel |
| Video play rate (2s) | > 25% | Ads Manager → Campaign Analytics |
| Click-through rate | > 1% | Ads Manager |
| Cost per Purchase | Your target CPA | Ads Manager → Conversions |
| ROAS | > 2× for broad / > 4× for retargeting | Ads Manager → Revenue |

## Best Practices

- **Use Maximum Data Sharing** in Shopify/WooCommerce TikTok integration settings — this enables EAPI and is the most important single setting for attribution quality
- **Pass `ttclid` in all EAPI events** — capture the TikTok click ID from landing page URLs (`?ttclid=xxx`) and store in a cookie; it is the strongest attribution signal after iOS 14
- **Use 9:16 vertical video exclusively** — horizontal or square ads significantly underperform in TikTok's full-screen feed
- **Refresh creatives every 3–4 weeks** — TikTok audiences fatigue faster than Meta; plan a continuous creative pipeline
- **Start with Lowest Cost bidding** — before you have enough conversion data for Cost Cap bidding, Lowest Cost generates the purchase history the algorithm needs
- **Exclude recent purchasers (30 days) from prospecting** — upload a customer list as a custom audience exclusion in all prospecting ad sets

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Double-counting purchases in Events Manager | Ensure `event_id` in Pixel and Events API match exactly for the same event |
| Catalog feed rejections | Check that `price` format is `"XX.XX USD"` (space between amount and currency code is required) |
| Low match rate in Events Manager | Send `ttclid`, `ip`, and `user_agent` in addition to hashed email for maximum attribution |
| High CPMs but low click-through rate | First 2 seconds of video must be visually arresting — no logo cards or slow product reveal intros |
| Spark Ad authorization expired | Request new auth codes every 30 days; set calendar reminders for creator-authorized content |

## Related Skills

- @meta-ads-integration
- @tiktok-shop-integration
- @google-ads-ecommerce
- @ugc-campaign-management
- @marketing-attribution-dashboard
