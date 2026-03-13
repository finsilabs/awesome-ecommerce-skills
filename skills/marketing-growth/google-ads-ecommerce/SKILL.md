---
name: google-ads-ecommerce
description: "Build and optimize Google Ads campaigns for ecommerce with Performance Max, Shopping feeds, conversion tracking, and Smart Bidding strategies for ROAS"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [google-ads, pmax, shopping, sem, ppc]
triggers: ["set up Google Ads", "create shopping campaign", "implement conversion tracking"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Google Ads Ecommerce

## Overview

Google Ads is the primary paid search and shopping channel for ecommerce, capturing high-intent buyers at the bottom of the funnel. A well-structured account combines Performance Max (PMax) for automated coverage, Standard Shopping for manual bid control, and Search campaigns for branded and high-value queries. Reliable conversion tracking — including Enhanced Conversions via server-side GTM — is the foundation everything else depends on.

## When to Use This Skill

- When launching a new Google Ads account for an ecommerce store
- When migrating from Standard Shopping to Performance Max campaigns
- When conversion tracking is broken or under-reporting (common after iOS/browser changes)
- When implementing Enhanced Conversions to recover lost signal
- When setting up Google Merchant Center for the first time
- When diagnosing why Smart Bidding is not spending the budget efficiently
- When needing server-side tagging via Google Tag Manager (sGTM)

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Google Ads account, Google Merchant Center account for Shopping ads, Google tag/pixel setup

## Core Instructions

### 1. Set up Google Merchant Center (GMC) feed

Register and verify your domain in Google Merchant Center, then generate a product feed. Google Ads Shopping and PMax both pull from GMC.

> **Note:** For complete Google Shopping feed generation and optimization, see @google-shopping-feed. This skill focuses on campaign structure and bidding.

Custom labels (`custom_label_0` through `custom_label_4`) are essential for campaign segmentation by margin, bestseller status, and seasonality. When building the feed, populate these labels in your feed generator (see @google-shopping-feed) so you can target high-margin and new-arrival products with differentiated ROAS targets.

### 2. Install Google Tag (gtag.js) and configure conversion actions

Load the Google Tag on every page, then fire a purchase conversion on the order confirmation page:

```html
<!-- In <head> — replace AW-CONVERSION_ID with your account ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-CONVERSION_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'AW-CONVERSION_ID');
</script>
```

Fire the purchase conversion event on the confirmation page:

```javascript
gtag('event', 'conversion', {
  send_to:        'AW-CONVERSION_ID/CONVERSION_LABEL',
  value:          order.subtotal,
  currency:       order.currencyCode,
  transaction_id: order.id,           // deduplication key
  new_customer:   order.isFirstOrder, // for new customer bid boost
});
```

### 3. Implement Enhanced Conversions

Enhanced Conversions sends hashed first-party data (email, phone, address) alongside conversion events so Google can match to signed-in users — recovering signal lost to cookie deletion and cross-device journeys.

```javascript
// On the order confirmation page, set user_data before the conversion fires
gtag('set', 'user_data', {
  email:      order.customerEmail,      // Google hashes it client-side
  phone:      order.customerPhone,
  address: {
    first_name: order.customerFirstName,
    last_name:  order.customerLastName,
    street:     order.shippingAddress.line1,
    city:       order.shippingAddress.city,
    region:     order.shippingAddress.state,
    postal_code:order.shippingAddress.zip,
    country:    order.shippingAddress.countryCode,
  },
});

gtag('event', 'conversion', {
  send_to:        'AW-CONVERSION_ID/CONVERSION_LABEL',
  value:          order.subtotal,
  currency:       order.currencyCode,
  transaction_id: order.id,
});
```

### 4. Server-side tagging with Google Tag Manager (sGTM)

For maximum signal reliability, deploy a server-side GTM container. This bypasses browser ITP/cookie restrictions and lets you enrich events before forwarding to Google.

```typescript
// Your origin server sends events to the sGTM container URL
async function sendToSgtm(eventName: string, payload: object) {
  await fetch(`${process.env.SGTM_CONTAINER_URL}/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      ...payload,
    }),
  });
}

// Called from order webhook
async function trackGooglePurchase(order: Order) {
  await sendToSgtm('purchase', {
    transaction_id: order.id,
    value:          order.subtotal,
    currency:       order.currencyCode,
    items:          order.lineItems.map(i => ({
      item_id:    i.sku,
      item_name:  i.name,
      price:      i.price,
      quantity:   i.quantity,
    })),
    // Enhanced Conversions fields
    email:      order.customerEmail,
    phone:      order.customerPhone,
  });
}
```

### 5. Performance Max campaign structure

PMax replaces all ad formats (Shopping, Display, YouTube, Discovery, Search) with a single campaign. Configure asset groups by product category for better relevance:

```
PMax Campaign: All Products — tROAS 400%
  Asset Group 1: Bestsellers
    - Final URL: /collections/bestsellers
    - Headlines (15): focus on social proof, "Top Rated", "5-Star Reviews"
    - Images: product lifestyle shots, white-background hero images
    - Videos: 15s and 30s product demo
    - Audience signals: past purchasers, product viewers (7d), similar audiences

  Asset Group 2: New Arrivals
    - Final URL: /collections/new
    - Headlines: "Just Dropped", "New for [Season]", "Shop the Latest"
    - Images: editorial/lifestyle imagery
    - Audience signals: Instagram engagers, fashion/lifestyle interest segments

  Asset Group 3: Sale / Clearance
    - Final URL: /collections/sale
    - Headlines: "Up to 50% Off", "Limited Time", "Final Sale"
    - Audience signals: bargain hunters, cart abandonersers
```

### 6. Standard Shopping campaign for bid control

Run a Standard Shopping campaign alongside PMax using campaign priority and negative keyword segmentation:

```
Standard Shopping — Priority: High
  Ad Group: High-Margin SKUs (custom_label_0 = high-margin)
    Bid: $1.50 CPC manual or Target ROAS 600%
  Ad Group: Core Catalog
    Bid: $0.80 CPC

PMax — Priority: Low (catches everything Standard Shopping doesn't bid on)
  Target ROAS: 400%
```

Add negative keywords to the Standard Shopping campaign to push brand queries to a separate Search campaign:

```
Negative keywords on Shopping: [brand name], [brand name review], [brand name promo code]
```

### 7. Search campaigns for brand and non-brand

```
Search Campaign: Brand
  Ad Groups: Exact match [brand name], [brand name shop], [brand name discount]
  Bidding: Target Impression Share 95%+, top of page

Search Campaign: Category Keywords
  Ad Groups: [product category] — phrase match, broad match modified
  Smart Bidding: Target ROAS 300%
  Negative keywords: jobs, careers, free, diy, homemade
```

### 8. Smart Bidding: tROAS and tCPA

Configure target ROAS after accumulating at least 30–50 conversions in the last 30 days. Start higher than your actual goal and ramp down 10% per week:

```
Week 1: Set tROAS to 600% (conservative — may underspend)
Week 2: Lower to 500% if under-delivering
Week 4+: Settle at 400% once algorithm has learned
```

For tCPA on lead-based conversion actions (newsletter signups, account registrations):

```javascript
// Log micro-conversion events to train the algorithm
gtag('event', 'conversion', {
  send_to:  'AW-CONVERSION_ID/SIGNUP_LABEL',
  value:    0,  // no value for signups
  currency: 'USD',
});
```

## Best Practices

- **Use transaction_id on every purchase conversion** — prevents duplicate conversion counting from page refreshes or affiliate click overlap
- **Enable Enhanced Conversions before launching Smart Bidding** — the algorithm needs quality signal to optimize; missing data causes erratic spend
- **Segment campaigns by custom labels** — high-margin products deserve higher ROAS targets; margin-blind bidding wastes budget on low-profit items
- **Exclude branded queries from PMax** — add brand terms as negative keywords at the campaign level or use a separate brand campaign
- **Feed quality is the #1 Shopping ranking factor** — ensure titles include color, size, and brand; missing GTINs hurt impression share
- **Use audience signals in PMax, not restrictions** — signals inform the algorithm without limiting reach; restrictions cut volume dramatically
- **Run Search Impression Share report weekly** — lost IS due to budget means increase budget; lost IS due to rank means improve quality score
- **Set up Conversion Value Rules** — boost the value of new customer conversions by 20–50% to train the algorithm to prefer acquiring new buyers
- **Pause PMax and test Standard Shopping for 4 weeks** — if ROAS drops, reactivate PMax; if it holds or improves, you may have more bid control with Standard Shopping

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Double-counting conversions | Add `transaction_id` to the conversion tag; check Conversions column in reports for duplicates |
| PMax spending all budget on branded queries | Add brand terms as campaign-level negatives or use a high-priority brand Search campaign |
| GMC feed disapproved | Fix missing required attributes (GTIN, brand, availability); check Merchant Center diagnostics dashboard |
| Smart Bidding enters "limited" status | Ensure 30+ conversions in the last 30 days; temporarily switch to Maximize Conversion Value to accumulate data |
| High impression share but low conversions | Improve landing page relevance; check that destination URL matches the ad and product in the feed |
| sGTM container returning 403 | Ensure the container is configured to accept first-party requests from your domain; check allowlist settings |
| Enhanced Conversions match rate under 30% | Send email in lowercase trimmed format; also include phone and address for higher match probability |

## Related Skills

- @meta-ads-integration
- @google-shopping-feed
- @marketing-attribution-dashboard
- @ecommerce-seo
- @conversion-rate-optimization
