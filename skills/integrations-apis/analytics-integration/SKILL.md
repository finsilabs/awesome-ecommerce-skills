---
name: analytics-integration
description: "Implement GA4, Meta Pixel, and server-side tagging with a proper data layer so you capture accurate conversion events for ad campaigns"
category: integrations-apis
risk: safe
source: curated
date_added: "2026-03-12"
tags: [analytics, ga4, meta-pixel, gtm, data-layer, server-side-tagging]
triggers: ["add analytics", "implement GA4", "set up tracking"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Analytics Integration

## Overview

Implement a robust analytics stack for e-commerce using Google Analytics 4 (GA4), Meta Pixel, and Google Tag Manager (GTM). Covers structured data layer design for product and checkout events, server-side tagging via GTM server containers to improve data accuracy and bypass browser restrictions, and Meta Conversions API for reliable ad attribution.

## When to Use This Skill

- When adding GA4 e-commerce tracking (product views, add-to-cart, checkout steps, purchase) to a new or existing store
- When implementing Meta Pixel alongside the Conversions API for dual-mode event delivery to improve ad attribution
- When migrating a GTM web container to a server-side container for better data control and cookie lifespans
- When troubleshooting missing or duplicate conversion events caused by ad blockers or client-side failures
- When meeting privacy requirements that mandate server-side deduplication between browser and server events

## Core Instructions

### Step 1: Determine your platform and recommended approach

| Platform | Recommended Analytics Setup | Key Actions |
|----------|---------------------------|------------|
| **Shopify** | Built-in GA4 integration + GTM app | Connect GA4 in **Online Store → Preferences → Google Analytics**; install **GTM4WP** or the official **Google & YouTube** channel app for Meta Pixel |
| **WooCommerce** | MonsterInsights plugin for GA4 + GTM | Install **MonsterInsights** (free tier or Pro from $99/yr) for GA4; install **WooCommerce Google Analytics Integration** (free) for enhanced e-commerce events |
| **BigCommerce** | Native GA4 integration + channel manager | Connect GA4 in **Advanced Settings → Data Solutions → Google Analytics**; use **BigCommerce's Meta Pixel integration** under the Channel Manager |
| **Custom / Headless** | GTM container + server-side container + custom data layer | Implement a canonical data layer, deploy GTM server container on Cloud Run or Vercel, and add Meta Conversions API from your backend |

### Step 2: Platform-specific analytics setup

---

#### Shopify

**Connect GA4 (built-in, no code required):**

1. Go to **Online Store → Preferences → Google Analytics**
2. Click **Connect your Google account** and select your GA4 property
3. Shopify sends all standard e-commerce events automatically: `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`
4. In **Google Analytics → Configure → Events**, mark the `purchase` event as a conversion

**Track checkout funnel with GA4 Explorations:**

1. In GA4, go to **Explore → Funnel exploration**
2. Create funnel steps:
   - Step 1: `begin_checkout` event
   - Step 2: `add_shipping_info` event
   - Step 3: `add_payment_info` event
   - Step 4: `purchase` event
3. This shows exactly where shoppers drop off in checkout

**Add Meta Pixel:**

1. Go to the Shopify App Store and install the **Meta** channel app (free)
2. Follow the setup wizard to connect your Facebook Business account
3. Meta sends pixel events automatically through the Shopify integration, including the Conversions API for server-side deduplication

---

#### WooCommerce

**Install MonsterInsights for GA4:**

1. Install **MonsterInsights** from wordpress.org (free tier available; Pro from $99/year adds enhanced e-commerce)
2. Go to **Insights → Settings → General** and connect your GA4 property
3. Enable **Enhanced eCommerce Tracking** in the MonsterInsights settings — this sends `add_to_cart`, `begin_checkout`, and `purchase` events to GA4 with product-level data

**Add Meta Pixel:**

1. Install **PixelYourSite** (free tier available, pro from $69/year) from wordpress.org
2. Enter your Pixel ID and connect via Facebook's Business Integration
3. PixelYourSite includes the WooCommerce extension for `ViewContent`, `AddToCart`, `InitiateCheckout`, and `Purchase` events

**Verify events are firing:**

1. Install the **Meta Pixel Helper** Chrome extension
2. Visit your product page and checkout — the extension shows which events fire on each page
3. In GA4, use **Admin → DebugView** to confirm events arrive in real time

---

#### BigCommerce

**Connect GA4 (built-in):**

1. Go to **Advanced Settings → Data Solutions → Google Analytics**
2. Enter your GA4 Measurement ID (format: `G-XXXXXXXX`)
3. BigCommerce fires e-commerce events automatically including `purchase` with full order data

**Add Meta Pixel:**

1. Go to **Channel Manager → Marketplace → Meta**
2. Connect your Facebook Business account
3. BigCommerce sends Pixel events natively and supports the Conversions API for server-side deduplication

---

#### Custom / Headless

**Design a canonical data layer first** — every event follows the same shape regardless of which vendor consumes it:

```javascript
// dataLayer must be initialized in <head> before GTM loads
window.dataLayer = window.dataLayer || [];

// Always clear ecommerce before pushing a new event (prevents GTM from merging stale items)
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: 'add_to_cart',
  ecommerce: {
    currency: 'USD',
    value: product.price * quantity,
    items: [{
      item_id: product.sku,
      item_name: product.name,
      item_brand: product.brand,
      item_category: product.category,
      price: product.price,
      quantity,
    }],
  },
});
```

**Purchase event (fire after order confirmed, use server-generated order ID as `transaction_id`):**

```javascript
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: order.id,  // Must be unique — deduplicate browser + server events
    value: order.total,
    tax: order.tax,
    shipping: order.shippingCost,
    currency: order.currency,
    coupon: order.couponCode || '',
    items: order.lineItems.map(line => ({
      item_id: line.sku,
      item_name: line.name,
      price: line.unitPrice,
      quantity: line.qty,
    })),
  },
});
```

**Meta Pixel with Conversions API deduplication** — send the same event from browser and server using a shared `event_id`:

```javascript
// Browser — pass event_id for deduplication
const eventId = `purchase_${order.id}`;
fbq('track', 'Purchase', {
  value: order.total,
  currency: order.currency,
  content_ids: order.lineItems.map(l => l.sku),
  content_type: 'product',
}, { eventID: eventId });

// Send eventId to server for the Conversions API mirror
await fetch('/api/analytics/meta-purchase', {
  method: 'POST',
  body: JSON.stringify({ orderId: order.id, eventId }),
});
```

```javascript
// Server-side Conversions API (Node.js)
import { ServerEvent, EventRequest, UserData, CustomData } from 'facebook-nodejs-business-sdk';

export async function sendMetaPurchase(order, eventId, userAgent, ipAddress) {
  const userData = new UserData()
    .setEmail(order.customerEmail)  // Automatically hashed by SDK
    .setClientIpAddress(ipAddress)
    .setClientUserAgent(userAgent);

  const customData = new CustomData()
    .setValue(order.total)
    .setCurrency(order.currency)
    .setContentIds(order.lineItems.map(l => l.sku));

  const serverEvent = new ServerEvent()
    .setEventName('Purchase')
    .setEventTime(Math.floor(Date.now() / 1000))
    .setUserData(userData)
    .setCustomData(customData)
    .setEventId(eventId)   // Matches browser eventID — Meta deduplicates automatically
    .setActionSource('website');

  await new EventRequest(process.env.META_ACCESS_TOKEN, process.env.META_PIXEL_ID)
    .setEvents([serverEvent])
    .execute();
}
```

**Initialize Google Consent Mode v2 (required for EU traffic as of March 2024):**

```javascript
// Must run BEFORE GTM or gtag.js loads
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,  // Wait for CMP to update consent
});

// After user accepts cookies via your CMP:
gtag('consent', 'update', {
  ad_storage: preferences.marketing ? 'granted' : 'denied',
  ad_user_data: preferences.marketing ? 'granted' : 'denied',
  analytics_storage: preferences.analytics ? 'granted' : 'denied',
});
```

**Validate events before deploying:**

```bash
# GA4 Measurement Protocol validation (returns hit validation report)
curl -X POST \
  "https://www.google-analytics.com/debug/mp/collect?measurement_id=G-XXXXXXXX&api_secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"test-123","events":[{"name":"purchase","params":{"transaction_id":"T-001","value":59.99,"currency":"USD"}}]}'
```

## Best Practices

- **Clear `ecommerce: null` before every e-commerce push** — GTM merges data layer objects, so stale item arrays from a previous event will contaminate the next one
- **Use your server-generated order ID as `transaction_id`** — never generate it on the client; this ensures deduplication works when both browser and server events fire
- **Send Conversions API events from a post-payment webhook** — webhook delivery is more reliable than the client completing a fetch call during checkout
- **Gate `purchase` events behind idempotency checks** — store fired `transaction_id` values in sessionStorage and skip re-firing if the confirmation page is reloaded
- **Use GTM environments for staging** — test GTM changes in a staging environment so QA traffic never pollutes live reports

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate purchase events in GA4 | Check `sessionStorage.getItem('purchase_fired_' + order.id)` before pushing; set it after the push fires |
| Items array empty in GTM | Forgot to push `{ ecommerce: null }` before the event — GTM caches the previous items array |
| Meta Pixel and Conversions API both counting conversions | Pass matching `eventID` (browser) and `event_id` (server) — Meta deduplicates on this field |
| Shopify GA4 funnel shows no data | Verify the GA4 Measurement ID in **Online Store → Preferences** matches your property; check GA4 DebugView to confirm events are firing |
| MonsterInsights not tracking WooCommerce orders | Ensure the Pro license is active (Enhanced eCommerce requires Pro); clear any caching plugins after installation |

## Related Skills

- @webhook-architecture
- @erp-integration
- @email-service-integration
- @gdpr-ecommerce
