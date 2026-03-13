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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Meta Ads Integration

## Overview

Meta (Facebook/Instagram) is the dominant paid social channel for ecommerce, but reliable attribution requires pairing the browser-based Meta Pixel with server-side Conversions API (CAPI). Post-iOS 14, browser signals alone under-report 30–60% of conversions; CAPI restores signal fidelity by sending purchase events directly from your server. For Shopify, WooCommerce, and BigCommerce, official integrations handle both Pixel and CAPI automatically — no custom code required. Custom code only belongs in the Custom/Headless section.

## When to Use This Skill

- When setting up Meta advertising for a new ecommerce store
- When conversion data in Ads Manager looks under-reported after iOS 14 rollout
- When launching Dynamic Product Ads (DPA) and needing catalog feed sync
- When ROAS is declining and you need to restore the signal quality Meta's algorithm relies on
- When adding retargeting audiences based on product viewers and add-to-cart events

## Core Instructions

### Step 1: Choose your integration approach

| Platform | Recommended Method | CAPI Support | Catalog Sync |
|----------|--------------------|-------------|-------------|
| **Shopify** | Native Meta Sales Channel | Yes (built-in) | Yes (automatic) |
| **WooCommerce** | Facebook for WooCommerce plugin | Yes (built-in) | Yes (automatic) |
| **BigCommerce** | Meta channel in Channel Manager | Yes (built-in) | Yes (automatic) |
| **Custom / Headless** | Meta Pixel + facebook-nodejs-business-sdk | Manual CAPI implementation | Manual feed generation |

All three major platforms have official Meta integrations that install both the Pixel and CAPI in a single setup — use these rather than manually pasting Pixel code.

### Step 2: Connect your platform to Meta

---

#### Shopify

1. Go to **Shopify Admin → Sales Channels → + → Facebook & Instagram**
2. Install the Facebook & Instagram sales channel
3. Connect your Meta Business Manager account and select your Facebook Page and Ad Account
4. Under **Data Sharing**, select **Maximum** — this enables server-side CAPI in addition to the browser Pixel
5. Shopify automatically:
   - Installs the Meta Pixel on all pages
   - Fires ViewContent, AddToCart, InitiateCheckout, and Purchase events
   - Sends the same events via CAPI from Shopify's servers (deduplication handled automatically)
   - Syncs your product catalog to Meta Commerce Manager for Dynamic Product Ads
6. Go to **Facebook & Instagram → Overview** to verify pixel connection status
7. In **Meta Events Manager → Data Sources → [Your Pixel]**: check Event Match Quality (EMQ) score — aim for 7+/10

---

#### WooCommerce

1. Install **Facebook for WooCommerce** (free, official Meta plugin) from the WordPress plugin directory
2. Go to **WooCommerce → Facebook → Get Started** and connect your Meta Business Manager account
3. Under **Facebook Connection → Data Sharing Level**: select **Maximum**
4. The plugin installs the Meta Pixel across all pages and fires standard events automatically
5. CAPI is enabled automatically under the Maximum data sharing setting
6. Go to **WooCommerce → Facebook → Product Sync** to trigger an initial product catalog sync to Meta Commerce Manager
7. Verify catalog sync status in **Meta Commerce Manager → Catalog → Data Sources**

---

#### BigCommerce

1. Go to **BigCommerce Admin → Channel Manager → Add a Channel**
2. Select **Facebook & Instagram**
3. Connect your Meta Business Manager account
4. Enable **Enhanced Conversions** (CAPI) during setup
5. BigCommerce syncs your product catalog automatically and registers it in Meta Commerce Manager for Dynamic Product Ads
6. Check product sync status in **Channel Manager → Facebook & Instagram → Products**

---

#### Custom / Headless

For headless stores, you must install both the browser Pixel and server-side CAPI manually.

**Browser-side Pixel (add to `<head>` on every page):**
```javascript
// Replace YOUR_PIXEL_ID with your Pixel ID from Meta Events Manager
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');

// Product page
fbq('track', 'ViewContent', {
  content_ids: [product.sku],
  content_type: 'product',
  value: product.price,
  currency: 'USD',
});

// Purchase — pass eventID for deduplication with CAPI
const purchaseEventId = `purchase-${orderId}`;
fbq('track', 'Purchase', {
  content_ids: order.lineItems.map(i => i.sku),
  value: order.subtotal,
  currency: order.currencyCode,
  order_id: order.id,
}, { eventID: purchaseEventId });
```

**Server-side CAPI (send from your order webhook):**
```typescript
import { FacebookAdsApi, ServerEvent, UserData, CustomData, EventRequest } from 'facebook-nodejs-business-sdk';

FacebookAdsApi.init(process.env.META_CAPI_ACCESS_TOKEN!);

async function trackPurchaseCapi(order: Order, req: Request) {
  const eventId = `purchase-${order.id}`; // MUST match the eventID passed to fbq()

  const userData = new UserData()
    .setEmail(order.customerEmail)    // SDK hashes PII automatically (SHA-256)
    .setPhone(order.customerPhone)
    .setFirstName(order.customerFirstName)
    .setLastName(order.customerLastName)
    .setZip(order.shippingAddress?.zip)
    .setCountry(order.shippingAddress?.countryCode)
    .setClientIpAddress(req.ip)
    .setClientUserAgent(req.headers['user-agent'] as string)
    .setFbp(req.cookies['_fbp'])   // _fbp cookie = browser identity signal
    .setFbc(req.cookies['_fbc']);  // _fbc cookie = click identity signal

  const customData = new CustomData()
    .setValue(order.subtotal)
    .setCurrency(order.currencyCode)
    .setContentIds(order.lineItems.map(i => i.sku))
    .setContentType('product')
    .setNumItems(order.lineItems.length)
    .setOrderId(order.id);

  const event = new ServerEvent()
    .setEventName('Purchase')
    .setEventId(eventId)
    .setEventTime(Math.floor(Date.now() / 1000))
    .setUserData(userData)
    .setCustomData(customData)
    .setActionSource('website');

  await new EventRequest(process.env.META_CAPI_ACCESS_TOKEN!, process.env.META_PIXEL_ID!)
    .setEvents([event])
    .execute();
}
```

**Product Catalog Feed for Dynamic Product Ads:**
Generate a CSV feed and serve it at a stable URL. Register it in **Meta Commerce Manager → Catalog → Data Sources → Add Data Feed**.

```typescript
// Generate CSV with required columns: id, title, description, availability, condition, price, link, image_link, brand
// Schedule regeneration every 4 hours — serve at a stable /feeds/meta-catalog.csv endpoint
```

### Step 3: Campaign structure for ecommerce

Build a three-tier campaign structure in **Meta Ads Manager**:

**Campaign 1: Prospecting**
- Objective: Sales → Purchases
- Budget: 60% of total Meta budget
- Audience: Broad (US 18–65, no interest targeting) — use Advantage+ targeting
- Ads: 3–5 creatives (static image, video, carousel, UGC)
- Use **Advantage+ Shopping Campaigns (ASC)** — Meta's automated format consistently outperforms manual campaign structures for ecommerce

**Campaign 2: Retargeting**
- Budget: 30% of total Meta budget
- Ad Set 1: Viewed product but did not add to cart (last 7 days)
  - Audience: Website custom audience → ViewContent event, last 7 days
  - Ads: Dynamic Product Ads (DPA) carousel showing viewed products
- Ad Set 2: Added to cart but did not purchase (last 3 days)
  - Audience: Website custom audience → AddToCart, last 3 days; exclude Purchases last 3 days
  - Ads: DPA + urgency messaging

**Campaign 3: Retention / LTV**
- Budget: 10% of total Meta budget
- Ad Set: Customer list audience (upload from Shopify → Customers export)
  - Exclude customers who purchased in the last 30 days
  - Ads: New arrivals, cross-sell products
- Ad Set: 1% Lookalike of top purchasers (great for prospecting)

### Step 4: Set up Dynamic Product Ads

For Shopify and WooCommerce, the official integrations auto-sync the product catalog. Verify setup:

1. Go to **Meta Commerce Manager → Catalogs → [Your Catalog]**
2. Check **Data Sources** — confirm your platform's feed is syncing and last updated within 24 hours
3. Check **Items** — verify products show correct prices, availability, and images
4. In **Ads Manager → Create Ad Set**: select your catalog under **Catalog Sales** campaign objective
5. Choose **Dynamic formats and creatives** — Meta automatically selects the best ad format per user

### Step 5: Verify Event Match Quality

In **Meta Events Manager → Data Sources → [Your Pixel] → Overview**:

| Signal | How to Improve |
|--------|---------------|
| EMQ below 6 | Send more user data (email, phone, fbp/fbc cookies) |
| CAPI not firing | Check platform integration is set to Maximum data sharing |
| Duplicate conversions | Verify deduplication — eventID must match between Pixel and CAPI |
| ViewContent not firing | Check the platform integration is active and pixel is on product pages |

## Best Practices

- **Use Advantage+ Shopping Campaigns (ASC) for prospecting** — Meta's automated campaign type consistently outperforms manual structure for ecommerce; start here, not manual campaigns
- **Set data sharing to Maximum on Shopify/WooCommerce** — this single setting enables CAPI and is worth significantly more accurate attribution than the default
- **Pass `_fbp` and `_fbc` cookies in CAPI** — these are the strongest identity signals for iOS 14+ attribution; include them in every CAPI event
- **Use `order_id` as the deduplication key** — prevents duplicate conversion counting when both Pixel and CAPI fire for the same purchase
- **Exclude recent purchasers from prospecting** — add a 30-day purchaser exclusion to cold campaigns to protect budget
- **Refresh creative every 4–6 weeks** — Meta campaigns show creative fatigue quickly; rotate 3–5 variations per ad set

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate purchase conversions in Ads Manager | Ensure `eventID` is identical in both Pixel and CAPI calls for the same event; Shopify's native integration handles this automatically |
| Conversions under-reported after iOS 14 | Set data sharing to Maximum in the Shopify Facebook channel settings or enable CAPI in WooCommerce Facebook plugin |
| Dynamic Product Ads show wrong price | Shopify/WooCommerce catalog syncs happen up to every 24 hours; for time-sensitive price changes, trigger a manual sync |
| Low EMQ score despite native integration | Go to Meta Events Manager → check that both browser and server events are showing; verify the integration is fully authorized |
| iOS 14+ campaign reach is low | Go to Meta Business Manager → Brand Safety → Domains → Verify your domain; enable Aggregated Event Measurement |
| Ad account disabled | Never send raw (unhashed) PII through the API; use the official SDK which hashes all data automatically |

## Related Skills

- @google-ads-ecommerce
- @tiktok-ads-integration
- @google-shopping-feed
- @email-marketing-automation
- @marketing-attribution-dashboard
