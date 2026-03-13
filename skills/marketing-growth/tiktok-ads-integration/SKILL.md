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
platforms: [platform-agnostic]
difficulty: advanced
---

# TikTok Ads Integration

## Overview

TikTok has become a primary discovery channel for ecommerce, particularly for fashion, beauty, home, and consumer goods. Like Meta, reliable attribution requires pairing the browser-based TikTok Pixel with the server-side Events API (EAPI). This skill covers Pixel installation, Events API server-side tracking with deduplication, TikTok Catalog Manager feed sync, Spark Ads (boosted organic content), Shopping Ads formats, campaign structure for ecommerce, and iOS attribution with SKAdNetwork.

## When to Use This Skill

- When launching TikTok as a new paid acquisition channel
- When TikTok Pixel is under-reporting conversions and you need Events API
- When setting up Product Shopping Ads or Video Shopping Ads
- When boosting organic creator content as Spark Ads
- When syncing your product catalog for Dynamic Showcase Ads
- When wanting to leverage LIVE Shopping events for real-time commerce

## Core Instructions

### 1. Install TikTok Pixel (browser-side)

Add the TikTok Pixel base code in the `<head>` of every page:

```html
<script>
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
    ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
    ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
    ttq._o=ttq._o||{};ttq._o[e]=n||{};
    n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;
    e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
    ttq.load('YOUR_PIXEL_ID');
    ttq.page();
  }(window, document, 'ttq');
</script>
```

Fire standard ecommerce events:

```javascript
// Product detail page
ttq.track('ViewContent', {
  content_id:   product.sku,
  content_type: 'product',
  content_name: product.name,
  value:        product.price,
  currency:     'USD',
});

// Add to cart
ttq.track('AddToCart', {
  content_id:   cart.items[0].sku,    // use primary item or array
  content_type: 'product',
  value:        cart.totalValue,
  currency:     'USD',
});

// Initiate checkout
ttq.track('InitiateCheckout', {
  content_type: 'product',
  value:        cart.totalValue,
  currency:     'USD',
});

// Purchase — fire with event_id for deduplication
const purchaseEventId = `purchase-${order.id}-${Date.now()}`;
ttq.track('CompletePayment', {
  content_id:   order.lineItems.map(i => i.sku).join(','),
  content_type: 'product',
  value:        order.subtotal,
  currency:     order.currencyCode,
  order_id:     order.id,
}, { event_id: purchaseEventId });
```

### 2. Events API (server-side) implementation

Install the TikTok Business API SDK or call the REST endpoint directly:

```bash
npm install tiktok-business-api
```

```typescript
// tiktok-events.ts
interface TikTokEventUser {
  email?:      string;  // SHA-256 hashed
  phone?:      string;  // SHA-256 hashed
  ip?:         string;
  userAgent?:  string;
  ttclid?:     string;  // TikTok click ID from URL param
  externalId?: string;  // your internal user ID, hashed
}

async function sendTikTokEvent(params: {
  pixelCode:    string;
  accessToken:  string;
  eventName:    'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'CompletePayment' | 'PlaceAnOrder';
  eventId:      string;     // must match Pixel event_id for deduplication
  eventTime:    number;     // Unix timestamp in seconds
  pageUrl:      string;
  user:         TikTokEventUser;
  properties?: {
    value?:       number;
    currency?:    string;
    contentIds?:  string[];
    contentType?: string;
    orderId?:     string;
  };
}) {
  const { createHash } = await import('crypto');
  const sha256 = (val: string) => createHash('sha256').update(val.toLowerCase().trim()).digest('hex');

  const payload = {
    pixel_code:  params.pixelCode,
    event_time:  params.eventTime,
    event:       params.eventName,
    event_id:    params.eventId,
    page: {
      url: params.pageUrl,
    },
    user: {
      email:       params.user.email    ? sha256(params.user.email)    : undefined,
      phone_number:params.user.phone    ? sha256(params.user.phone)    : undefined,
      ip:          params.user.ip,
      user_agent:  params.user.userAgent,
      ttclid:      params.user.ttclid,
      external_id: params.user.externalId ? sha256(params.user.externalId) : undefined,
    },
    properties: {
      value:        params.properties?.value,
      currency:     params.properties?.currency,
      contents:     params.properties?.contentIds?.map(id => ({ content_id: id, content_type: 'product' })),
      order_id:     params.properties?.orderId,
    },
  };

  const response = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/pixel/track/?business_id=YOUR_BUSINESS_ID`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Access-Token':  params.accessToken,
      },
      body: JSON.stringify({ data: [payload] }),
    }
  );

  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(`TikTok Events API error: ${result.message}`);
  }
  return result;
}
```

Fire server-side on the purchase webhook:

```typescript
// In order.paid webhook handler
async function trackTikTokPurchase(order: Order, req: Request) {
  const eventId = `purchase-${order.id}`; // must match Pixel event_id

  await sendTikTokEvent({
    pixelCode:   process.env.TIKTOK_PIXEL_ID!,
    accessToken: process.env.TIKTOK_ACCESS_TOKEN!,
    eventName:   'CompletePayment',
    eventId,
    eventTime:   Math.floor(Date.now() / 1000),
    pageUrl:     `${process.env.STORE_URL}/checkout/thank-you`,
    user: {
      email:      order.customerEmail,
      phone:      order.customerPhone,
      ip:         req.ip,
      userAgent:  req.headers['user-agent'],
      ttclid:     req.cookies['ttclid'],
      externalId: order.customerId,
    },
    properties: {
      value:      order.subtotal,
      currency:   order.currencyCode,
      contentIds: order.lineItems.map(i => i.sku),
      orderId:    order.id,
    },
  });
}
```

### 3. TikTok Catalog Manager feed sync

Generate a product catalog feed compatible with TikTok's spec:

```typescript
async function generateTikTokCatalogFeed(): Promise<string> {
  const products = await db.products.findAll({ where: { active: true }, include: ['images', 'variants'] });

  const items = products.flatMap(p =>
    p.variants.map(v => ({
      sku_id:      v.sku,
      title:       `${p.name}${v.title !== 'Default' ? ` - ${v.title}` : ''}`,
      description: p.description.replace(/<[^>]*>/g, '').substring(0, 1000),
      availability: v.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition:   'new',
      price:       `${v.price.toFixed(2)} USD`,
      link:        `${process.env.STORE_URL}/products/${p.slug}?variant=${v.id}`,
      image_link:  v.images?.[0]?.url ?? p.images[0]?.url,
      brand:       p.brandName ?? process.env.STORE_NAME,
      google_product_category: p.gpcCategory,
    }))
  );

  // Return as JSON Lines (JSONL format preferred by TikTok)
  return items.map(i => JSON.stringify(i)).join('\n');
}
```

Register the feed URL in TikTok Business Center > Catalogs > Add Catalog. Set auto-sync every 24 hours.

### 4. Campaign structure for TikTok ecommerce

```
Campaign 1: Video Shopping Ads — Catalog
  Objective: Product Sales
  Ad Group 1: Prospecting — Broad (US, 18-44)
    Bidding: Lowest Cost (spend to learn) or Cost Cap $30 CPA
    Ads: Dynamic Product videos from catalog (auto-generated)
  Ad Group 2: Interest Targeting — Fashion/Beauty/Home
    Bidding: Cost Cap
    Ads: UGC-style 9:16 video ads

Campaign 2: Spark Ads — Boosted Organic
  Objective: Conversions
  Ad Group: Retargeting — Video Viewers (30 days) + Website Visitors
    Ads: Spark authorization of top-performing organic posts

Campaign 3: LIVE Shopping Ads (during live events)
  Objective: LIVE Shopping
  Ad Group: Broad + lookalike purchasers
    Ads: Dynamic LIVE ad showing current featured product
```

### 5. Spark Ads setup (boosting organic content)

To run a creator's organic post as a Spark Ad, obtain authorization:

```typescript
// Request Spark Ad authorization from creator
async function requestSparkAdAuth(params: {
  creatorTikTokId: string;
  videoId:         string;
  accessToken:     string;
}) {
  const response = await fetch(
    'https://business-api.tiktok.com/open_api/v1.3/tt_video/authorize/',
    {
      method:  'POST',
      headers: {
        'Access-Token':  params.accessToken,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        advertiser_id:  process.env.TIKTOK_ADVERTISER_ID,
        tiktok_item_id: params.videoId,
      }),
    }
  );

  return response.json();  // Returns auth_code — valid for 30 days
}
```

### 6. Attribution windows and SKAdNetwork

For iOS campaigns, TikTok supports SKAdNetwork attribution. Configure in Ads Manager:

- **Click-through window**: 7 days (recommended for ecommerce)
- **View-through window**: 1 day
- **Enable SKAN**: toggle on in campaign settings; TikTok will decode conversion values automatically if you configure the schema in the pixel settings

## Best Practices

- **Mirror Meta's CAPI approach** — TikTok Events API works identically; sending both Pixel + EAPI doubles match quality
- **Pass `ttclid` parameter** — capture the TikTok click ID from landing page URLs and store in a cookie; it is the strongest attribution signal
- **Use 9:16 vertical video for all ads** — horizontal or square ads significantly underperform on TikTok's full-screen feed
- **Refresh creatives every 2–4 weeks** — TikTok audiences fatigue faster than Meta; plan a continuous creative production pipeline
- **Start with Lowest Cost bidding** — before you have enough conversion data for Cost Cap, Lowest Cost spends budget and generates the conversion history the algorithm needs
- **Exclude recent purchasers from prospecting** — add a 30-day purchaser custom audience as an exclusion
- **Use Spark Ads for UGC at scale** — authentic creator content consistently outperforms polished brand ads on TikTok
- **Test catalog-driven video ads** — TikTok can auto-generate product videos from your catalog; these often match hand-crafted video performance at a fraction of the production cost

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Double-counting purchases | Ensure `event_id` in Pixel and Events API match exactly for the same event |
| Events API returning 40100 (invalid token) | Access tokens expire; implement OAuth refresh flow or use long-lived tokens from Business Center |
| Catalog feed rejections | Check that `price` format is `"XX.XX USD"` with space between amount and currency code |
| Spark Ad authorization expired | Request new auth code every 30 days; set a calendar reminder or automate via the API |
| Low match rate in Events Manager | Send `ttclid` (click ID), `ip`, and `user_agent` in addition to hashed email for maximum match |
| LIVE Shopping ads not delivering | Ensure the TikTok account linked to the LIVE is authorized in Business Center and has Shopping features enabled |
| High CPMs but low CTR | TikTok audiences require hook-first creatives; first 2 seconds must be visually arresting — no logo cards or slow intros |

## Related Skills

- @meta-ads-integration
- @tiktok-shop-integration
- @google-ads-ecommerce
- @ugc-campaign-management
- @marketing-attribution-dashboard
