---
name: google-ads-ecommerce
description: "Build and optimize Google Ads campaigns for ecommerce with Performance Max, Shopping feeds, conversion tracking, and Smart Bidding strategies for ROAS"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [google-ads, pmax, shopping, sem, ppc, conversion-tracking, roas, smart-bidding]
triggers: ["set up Google Ads", "create shopping campaign", "implement conversion tracking", "performance max", "google shopping ads", "google ads for ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Google Ads Ecommerce

## Overview

Google Ads captures high-intent buyers at the bottom of the funnel through Shopping ads and Search. A well-structured account combines Performance Max (PMax) for automated coverage and conversion tracking via Google Tag. Reliable conversion tracking is the foundation everything else depends on — before optimizing campaigns, ensure your purchase conversion tag is firing correctly.

## When to Use This Skill

- When launching a new Google Ads account for an ecommerce store
- When conversion tracking is broken or under-reporting (common after iOS/browser changes)
- When implementing Enhanced Conversions to recover lost signal
- When setting up Google Merchant Center for the first time
- When migrating from Standard Shopping to Performance Max campaigns
- When diagnosing why Smart Bidding is not spending the budget efficiently

## Core Instructions

### Step 1: Connect your store to Google

Every platform has a native Google integration — start here before touching the Google Ads interface.

---

#### Shopify

1. Go to **Shopify Admin → Sales Channels → Google** and install the Google & YouTube channel app
2. Connect your Google Ads account and Google Merchant Center account
3. Shopify automatically creates the Google product feed and syncs inventory in real time
4. Go to **Google & YouTube → Overview → Conversion Tracking** and verify the purchase conversion tag is connected
5. This channel handles the Google Tag installation, product feed, and basic conversion tracking automatically — no manual tag setup required for most stores

**For Enhanced Conversions (recovers signal lost to cookie restrictions):**
1. In your Google Ads account, go to **Goals → Conversions → Settings → Enhanced Conversions**
2. Enable Enhanced Conversions for Web
3. In Shopify, the Google channel app sends hashed customer email alongside purchase events automatically

---

#### WooCommerce

1. Install the **Google Listings & Ads** plugin (free, official Google plugin) from the WordPress plugin directory
2. Go to **WooCommerce → Google Listings & Ads** and connect your Google account
3. The plugin automatically creates a product feed for Google Merchant Center and installs conversion tracking
4. For Enhanced Conversions: install **Google Tag Manager** plugin and configure EC through GTM (see Custom/Headless section for GTM setup)

**Alternative**: install **WooCommerce Google Analytics** plugin and manually add the purchase conversion event tag.

---

#### BigCommerce

1. Go to **BigCommerce Admin → Channel Manager → Google Shopping**
2. Connect your Google Merchant Center account — BigCommerce automatically generates the product feed
3. For conversion tracking: go to **BigCommerce → Advanced Settings → Google Analytics** and add your Google Tag (gtag.js) ID
4. Or install the **Google Tag Manager** app from the BigCommerce App Marketplace and configure conversion tracking in GTM

---

#### Custom / Headless

Add Google Tag (gtag.js) to every page and fire the purchase conversion on the confirmation page:

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

On the order confirmation page, fire the purchase conversion:
```javascript
// Include user_data BEFORE the conversion event for Enhanced Conversions
gtag('set', 'user_data', {
  email: order.customerEmail,      // Google hashes client-side
  phone: order.customerPhone,
  address: {
    first_name: order.customerFirstName,
    last_name: order.customerLastName,
    postal_code: order.shippingAddress.zip,
    country: order.shippingAddress.countryCode,
  },
});

gtag('event', 'conversion', {
  send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
  value: order.subtotal,
  currency: order.currencyCode,
  transaction_id: order.id,       // prevents duplicate counting
  new_customer: order.isFirstOrder,
});
```

For maximum signal reliability, deploy a server-side Google Tag Manager container — this bypasses browser ITP/cookie restrictions. Contact Google or a certified GTM partner to deploy sGTM.

### Step 2: Set up Google Merchant Center

1. Create a Merchant Center account at merchants.google.com
2. Verify and claim your domain under **Business Information → Website**
3. If using Shopify or WooCommerce with the official plugins, the product feed is already connected — go to **Products → Feeds** to verify the sync is active
4. For custom/headless stores, see @google-shopping-feed for feed generation
5. Check **Products → Diagnostics** for disapproved products and fix issues before launching campaigns

### Step 3: Create a Performance Max campaign

In Google Ads (ads.google.com):

1. Go to **Campaigns → New Campaign → Sales**
2. Select **Performance Max** as the campaign type
3. Set budget: minimum $50/day to start; the algorithm needs data
4. Set a conservative Target ROAS to start: if you need 4x ROAS, set 300% initially and increase after 2 weeks of data
5. Create asset groups organized by product category:

```
Asset Group 1: Bestsellers
  Final URL: /collections/bestsellers
  Headlines (15): focus on social proof — "Top Rated", "5-Star Reviews", "#1 Bestseller"
  Images: product lifestyle shots + white-background product images (both required)
  Videos: 15s and 30s product demos (upload at least one)
  Audience signals: Past purchasers (upload customer list), Product viewers (7-day list)

Asset Group 2: New Arrivals
  Final URL: /collections/new
  Headlines: "Just Dropped", "New for [Season]", "Shop the Latest"
  Audience signals: Instagram engagers, fashion/lifestyle interest segments

Asset Group 3: Sale / Clearance
  Final URL: /collections/sale
  Headlines: "Up to 50% Off", "Final Sale", "Limited Time"
```

6. Under **Audience Signals**, upload your customer email list (from Klaviyo or Shopify) to create a seed audience for lookalike targeting

### Step 4: Configure Smart Bidding correctly

Smart Bidding requires conversion data to optimize. Do not set ROAS targets until you have 30+ conversions in the last 30 days.

**Ramping schedule:**
- **Week 1**: Set to "Maximize Conversion Value" (no ROAS target) — let the algorithm learn
- **Week 2**: Review actual ROAS. If it is above your target, set a ROAS target at 80% of actual
- **Week 4+**: Gradually increase ROAS target by 10% every week until you find the efficiency-volume balance

**Conversion Value Rules** — set these to bias the algorithm toward new customers:
1. In Google Ads, go to **Goals → Conversions → Conversion Value Rules**
2. Add a rule: "New customer" → Multiply conversion value by 1.3
3. This trains the algorithm to prefer acquiring new customers over retargeting existing ones

### Step 5: Monitor and optimize weekly

| Metric | Action if off target |
|--------|---------------------|
| Impression Share lost to budget | Increase daily budget |
| Impression Share lost to rank | Improve product feed quality (titles, images); increase ROAS ceiling |
| PMax spending on branded queries | Add brand terms as campaign-level negative keywords |
| Low conversion rate on Shopping | Check that landing page price matches feed price exactly; fix product page CRO |

In Google Ads: **Reports → Predefined Reports → Shopping → Shopping performance by product** — identifies which specific products have the highest ROAS and which are wasting budget.

## Best Practices

- **Use transaction_id on every purchase conversion** — prevents duplicate conversion counting from page refreshes
- **Enable Enhanced Conversions before launching Smart Bidding** — the algorithm needs quality signal; missing data causes erratic spend
- **Check feed quality in Merchant Center Diagnostics weekly** — feed quality is the #1 Shopping ranking factor; missing GTINs and poor titles hurt impression share
- **Exclude branded queries from PMax** — add brand terms as negative keywords at the campaign level so you are not paying for branded searches that would convert anyway
- **Provide all available product images** — products with 3+ images get higher quality scores and better ad placement
- **Set campaign budgets at 3–5x your target CPA initially** — underfunded campaigns prevent the algorithm from accumulating the data it needs to optimize

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Double-counting conversions | Add `transaction_id` to the conversion tag and enable "Deduplicate conversions" in Google Ads conversion settings |
| PMax spending all budget on branded queries | Add brand terms as campaign-level negatives or run a separate branded Search campaign at higher priority |
| GMC feed disapproved | Check Merchant Center Diagnostics; most common: missing GTIN, price mismatch with website, broken image links |
| Smart Bidding enters "limited" status | Ensure 30+ conversions in the last 30 days; temporarily switch to Maximize Conversion Value to accumulate data |
| Enhanced Conversions match rate under 30% | Send email in lowercase trimmed format; include phone and address for higher match probability |

## Related Skills

- @google-shopping-feed
- @meta-ads-integration
- @marketing-attribution-dashboard
- @ecommerce-seo
- @conversion-rate-optimization
