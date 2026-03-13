---
name: meta-ads-integration
description: "Set up and optimize Meta (Facebook/Instagram) ad campaigns with Conversions API server-side tracking, dynamic product ads, and catalog sync for ecommerce"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [meta, facebook, instagram, advertising, capi, pixel]
triggers: ["set up Facebook ads", "implement Meta CAPI", "create dynamic product ads"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Meta Ads Integration

## Overview

Meta (Facebook/Instagram) is the dominant paid social channel for ecommerce, but reliable attribution requires pairing the browser-based Meta Pixel with the server-side Conversions API (CAPI). Post-iOS 14, browser signals alone under-report 30–60% of conversions; CAPI restores signal fidelity by sending purchase events directly from your server. This skill covers the full stack: Pixel setup, CAPI server-side events, Product Catalog Feed sync for Dynamic Product Ads, Custom and Lookalike Audiences, campaign structure for ecommerce, and ROAS optimization.

## When to Use This Skill

- When setting up Meta advertising for a new ecommerce store
- When conversion data in Ads Manager looks under-reported after iOS 14 rollout
- When launching Dynamic Product Ads (DPA) and needing catalog feed sync
- When rebuilding tracking after a platform migration (Shopify → headless, etc.)
- When ROAS is declining and you need to restore the signal quality Meta's algorithm relies on
- When adding retargeting audiences based on product viewers and add-to-cart events

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Meta Business Manager account, Meta Pixel and/or Conversions API credentials, product catalog feed URL

## Core Instructions

### 1. Install Meta Pixel (browser-side)

Load the base Pixel code in your `<head>` on every page. Replace `YOUR_PIXEL_ID` with the ID from Events Manager:

```html
<!-- Meta Pixel Base Code -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>
```

Fire standard events on key pages:

```javascript
// Product detail page
fbq('track', 'ViewContent', {
  content_ids: [product.sku],
  content_type: 'product',
  value: product.price,
  currency: 'USD',
  content_name: product.name,
});

// Add to cart
fbq('track', 'AddToCart', {
  content_ids: cart.items.map(i => i.sku),
  content_type: 'product',
  value: cart.totalValue,
  currency: 'USD',
  num_items: cart.items.length,
});

// Initiate checkout
fbq('track', 'InitiateCheckout', {
  content_ids: cart.items.map(i => i.sku),
  content_type: 'product',
  value: cart.totalValue,
  currency: 'USD',
  num_items: cart.items.length,
});

// Purchase — fire on order confirmation page
fbq('track', 'Purchase', {
  content_ids: order.lineItems.map(i => i.sku),
  content_type: 'product',
  value: order.subtotal,       // use subtotal, not total with tax
  currency: order.currencyCode,
  num_items: order.lineItems.length,
  order_id: order.id,          // deduplication key
});
```

### 2. Implement Conversions API (CAPI) — server-side

Install the official SDK:

```bash
npm install facebook-nodejs-business-sdk
```

Create a shared CAPI client:

```typescript
import { FacebookAdsApi, ServerSideApi, EventRequest, UserData, CustomData, Content } from 'facebook-nodejs-business-sdk';

const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN!;
const PIXEL_ID     = process.env.META_PIXEL_ID!;

FacebookAdsApi.init(ACCESS_TOKEN);

export async function sendCapiEvent(params: {
  eventName: string;
  eventId: string;       // MUST match fbq eventID for deduplication
  eventTime: number;     // Unix seconds
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;         // _fbp cookie value
    fbc?: string;         // _fbc cookie value
  };
  customData?: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    contentType?: string;
    numItems?: number;
    orderId?: string;
  };
}) {
  const userData = new UserData();
  if (params.userData.email)           userData.setEmail(params.userData.email);
  if (params.userData.phone)           userData.setPhone(params.userData.phone);
  if (params.userData.firstName)       userData.setFirstName(params.userData.firstName);
  if (params.userData.lastName)        userData.setLastName(params.userData.lastName);
  if (params.userData.zip)             userData.setZip(params.userData.zip);
  if (params.userData.country)         userData.setCountry(params.userData.country);
  if (params.userData.clientIpAddress) userData.setClientIpAddress(params.userData.clientIpAddress);
  if (params.userData.clientUserAgent) userData.setClientUserAgent(params.userData.clientUserAgent);
  if (params.userData.fbp)             userData.setFbp(params.userData.fbp);
  if (params.userData.fbc)             userData.setFbc(params.userData.fbc);

  const customData = new CustomData();
  if (params.customData?.value)        customData.setValue(params.customData.value);
  if (params.customData?.currency)     customData.setCurrency(params.customData.currency);
  if (params.customData?.contentIds)   customData.setContentIds(params.customData.contentIds);
  if (params.customData?.contentType)  customData.setContentType(params.customData.contentType);
  if (params.customData?.numItems)     customData.setNumItems(params.customData.numItems);
  if (params.customData?.orderId)      customData.setOrderId(params.customData.orderId);

  const event = new (require('facebook-nodejs-business-sdk').ServerEvent)()
    .setEventName(params.eventName)
    .setEventId(params.eventId)
    .setEventTime(params.eventTime)
    .setUserData(userData)
    .setCustomData(customData)
    .setActionSource('website');

  const request = new EventRequest(ACCESS_TOKEN, PIXEL_ID).setEvents([event]);
  return request.execute();
}
```

Fire CAPI on the purchase webhook (never rely solely on the pixel):

```typescript
// Called from order.paid webhook handler
async function trackPurchaseCapi(order: Order, req: Request) {
  const eventId = `purchase-${order.id}`;  // same ID passed to fbq() on confirmation page

  await sendCapiEvent({
    eventName: 'Purchase',
    eventId,
    eventTime: Math.floor(Date.now() / 1000),
    userData: {
      email:            order.customerEmail,
      phone:            order.customerPhone,
      firstName:        order.customerFirstName,
      lastName:         order.customerLastName,
      zip:              order.shippingAddress?.zip,
      country:          order.shippingAddress?.countryCode,
      clientIpAddress:  req.ip,
      clientUserAgent:  req.headers['user-agent'],
      fbp:              req.cookies['_fbp'],
      fbc:              req.cookies['_fbc'],
    },
    customData: {
      value:       order.subtotal,
      currency:    order.currencyCode,
      contentIds:  order.lineItems.map(i => i.sku),
      contentType: 'product',
      numItems:    order.lineItems.length,
      orderId:     order.id,
    },
  });
}
```

### 3. Event deduplication

Pass a unique `eventID` in both the Pixel call and the CAPI call. Meta will automatically deduplicate when both are received:

```javascript
// Client-side — generate once per event
const purchaseEventId = `purchase-${orderId}-${Date.now()}`;
fbq('track', 'Purchase', { order_id: orderId, value: subtotal, currency: 'USD' }, { eventID: purchaseEventId });

// Store in hidden form field or cookie so server can read it
document.cookie = `last_purchase_event_id=${purchaseEventId}`;
```

On the server, read `purchaseEventId` from the request and pass it as `eventId` in `sendCapiEvent`.

### 4. Product Catalog Feed for Dynamic Product Ads

Generate a feed file (CSV or XML) conforming to Meta's catalog spec:

```typescript
import { createObjectCsvWriter } from 'csv-writer';

async function generateMetaCatalogFeed(outputPath: string) {
  const products = await db.products.findAll({
    where: { active: true, stockQuantity: { gt: 0 } },
    include: ['images', 'categories'],
  });

  const writer = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'id',               title: 'id' },
      { id: 'title',            title: 'title' },
      { id: 'description',      title: 'description' },
      { id: 'availability',     title: 'availability' },
      { id: 'condition',        title: 'condition' },
      { id: 'price',            title: 'price' },
      { id: 'link',             title: 'link' },
      { id: 'image_link',       title: 'image_link' },
      { id: 'brand',            title: 'brand' },
      { id: 'google_product_category', title: 'google_product_category' },
    ],
  });

  const records = products.map(p => ({
    id:          p.sku,
    title:       p.name.substring(0, 150),
    description: p.description.replace(/<[^>]*>/g, '').substring(0, 5000),
    availability: p.stockQuantity > 0 ? 'in stock' : 'out of stock',
    condition:   'new',
    price:       `${p.price.toFixed(2)} USD`,
    link:        `${process.env.STORE_URL}/products/${p.slug}`,
    image_link:  p.images[0]?.url ?? '',
    brand:       p.brandName ?? process.env.STORE_NAME,
    google_product_category: p.gpcCategory ?? '5000',
  }));

  await writer.writeRecords(records);
}
```

Schedule feed regeneration every 4 hours via cron. Serve the file at a stable public URL and register it in Meta Commerce Manager > Catalog > Data Sources.

### 5. Campaign structure for ecommerce

Build a three-tier campaign structure:

```
Campaign 1: Prospecting (Advantage+ or broad targeting)
  Ad Set: US 18-65 broad (no interest targeting needed for Advantage+)
    Ads: 3-5 creatives (static, video carousel, UGC)

Campaign 2: Retargeting — Engaged Visitors (last 30 days)
  Ad Set: ViewContent but not AddToCart (7 days)
    Ads: DPA carousel with product images
  Ad Set: AddToCart but not Purchase (3 days)
    Ads: DPA + urgency copy

Campaign 3: Retention / LTV (existing customers)
  Ad Set: Customers — exclude last 30 days purchases
    Ads: New arrivals, cross-sell catalog
  Ad Set: Lookalike 1% of top purchasers
    Ads: Brand/prospecting creatives
```

### 6. Custom Audiences and Lookalikes

```typescript
// Create a customer list audience via Marketing API (run periodically)
import { CustomAudience } from 'facebook-nodejs-business-sdk';

async function syncCustomerAudience(adAccountId: string) {
  const customers = await db.customers.findAll({
    where: { emailVerified: true },
    select: ['email', 'phone', 'firstName', 'lastName'],
  });

  // Hash PII client-side before sending
  const { createHash } = await import('crypto');
  const hash = (val: string) => createHash('sha256').update(val.toLowerCase().trim()).digest('hex');

  const schema = ['EMAIL', 'PHONE', 'FN', 'LN'];
  const data = customers.map(c => [
    hash(c.email),
    c.phone ? hash(c.phone.replace(/\D/g, '')) : '',
    hash(c.firstName),
    hash(c.lastName),
  ]);

  const audience = new CustomAudience(adAccountId);
  await audience.createUser({ payload: { schema, data } });
}
```

## Best Practices

- **Always use CAPI + Pixel together** — dual signals improve Event Match Quality (EMQ) score in Events Manager; aim for 7+ out of 10
- **Hash all PII before sending** — email, phone, name must be SHA-256 hashed; the SDK does this automatically if you use the official client
- **Pass `fbp` and `fbc` cookies** — these are the strongest identity signals for matching, especially post-iOS 14
- **Use `order_id` as the deduplication key** — prevents duplicate conversion counting when both Pixel and CAPI fire
- **Exclude recent purchasers from prospecting** — add a 30-day purchaser exclusion to cold campaigns to protect budget
- **Use Advantage+ Shopping Campaigns (ASC)** — Meta's automated campaign type outperforms manual campaign structures in most ecommerce accounts
- **Test creatives in sets of 5** — run at least 5 ad variations per ad set; let the algorithm optimize before judging performance
- **Set a 7-day click / 1-day view attribution window** — align with the default window; tighter windows (1-day click) work better for lower-funnel retargeting
- **Monitor Event Match Quality weekly** — a drop below 6 signals a tracking issue; check CAPI payload completeness

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate purchase conversions in Ads Manager | Ensure `eventID` is identical in both Pixel and CAPI calls for the same event |
| CAPI purchases counted but Pixel not firing | Check Content Security Policy — `connect.facebook.net` must be allowed; also check cookie blockers in test |
| Dynamic Product Ads show wrong price | Regenerate catalog feed after price changes; do not cache the feed for more than 4 hours |
| "Invalid parameter" CAPI error on phone | Normalize phone to E.164 format (`+12125551234`) before hashing |
| Low EMQ score despite sending email | Also send `fbp` cookie, `ip`, and `user-agent` — these signals significantly boost match rate |
| Ad account disabled for policy violation | Never send raw (unhashed) PII; always use the SDK's built-in normalization and hashing |
| Attribution looks inflated | Compare Ads Manager data against Google Analytics and your order DB; use a 7-day click window for a fairer comparison |
| iOS 14+ campaign reach is low | Enable Aggregated Event Measurement; verify your domain and prioritize your top 8 conversion events |

## Related Skills

- @google-ads-ecommerce
- @tiktok-ads-integration
- @google-shopping-feed
- @email-marketing-automation
- @marketing-attribution-dashboard
