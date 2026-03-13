---
name: attribution-modeling
description: "Understand which marketing channels drive purchases by implementing multi-touch attribution models across UTM-tracked campaigns and channels"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [attribution, multi-touch, marketing-analytics, utm, last-click, first-click, data-driven, channel-analysis]
triggers: ["attribution modeling", "multi-touch attribution", "marketing attribution", "channel attribution", "first touch vs last touch", "data-driven attribution", "marketing spend optimization", "UTM attribution"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Attribution Modeling

## Overview

Attribution modeling determines which marketing touchpoints receive credit for a conversion, enabling informed decisions about where to allocate ad spend. Every ad platform (Meta, Google, TikTok) reports attribution using its own model — typically claiming 100% credit — which means the sum of all platform-reported revenue routinely exceeds your actual revenue.

This skill guides you through setting up first-party attribution on your platform, comparing attribution models side by side, and using dedicated attribution tools that do this automatically without building custom pipelines.

## When to Use This Skill

- When marketing channels (Google Ads, Meta, email) each claim different shares of the same revenue
- When needing to make budget allocation decisions across acquisition channels
- When moving beyond last-click attribution to understand the full customer journey
- When building a marketing analytics report that compares channel performance under multiple attribution models
- When implementing first-party attribution to replace data lost from iOS tracking changes
- When affiliate, influencer, and paid search all contributed to the same order and each claims 100% credit

## Core Instructions

### Step 1: Determine your platform and choose the right attribution tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | **Triple Whale** or **Northbeam** | Both built specifically for Shopify DTC brands; pull order data via API, de-duplicate cross-platform attribution, and show first-party blended ROAS |
| **Shopify** (budget) | **Shopify Analytics** built-in attribution + UTM tracking | Free; shows last-click attribution by UTM source for all orders |
| **WooCommerce** | **Metorik** + GA4 attribution | Metorik adds UTM tracking to WooCommerce orders; GA4 provides data-driven attribution model |
| **BigCommerce** | **Rockerbox** or **Northbeam** | Both support BigCommerce via API integration; provide multi-touch attribution dashboards |
| **All platforms** (mid-market) | **Rockerbox** or **Affluent** | Platform-agnostic; pull ad spend from all channels and match to first-party order data |
| **Custom / Headless** | Build on **Segment** + **dbt** or use **Triple Whale's pixel API** | Capture touchpoints with Segment, store in warehouse, model attribution in dbt |

### Step 2: Set up UTM tracking correctly across all channels

Good attribution starts with consistent UTM parameters. Without them, 40–60% of traffic appears as "direct" (dark traffic).

**UTM naming conventions to enforce across your team:**

| Parameter | Example | Rule |
|-----------|---------|-------|
| `utm_source` | `google`, `meta`, `klaviyo` | Always lowercase; never `Google` or `GOOGLE` |
| `utm_medium` | `cpc`, `email`, `social` | Standardized list; no custom variants |
| `utm_campaign` | `spring-sale-2026` | Consistent format across platforms |

**Platform-specific setup:**

- **Google Ads:** Enable auto-tagging (adds `gclid` automatically); also add UTM parameters under Campaign → Settings → Additional settings → Campaign URL options
- **Meta Ads:** Add UTM parameters under Ad Set → Website URL, or use Meta's URL parameters feature at the account level
- **Klaviyo:** Go to **Account → Settings → UTM Tracking** — enable automatic UTM appending for all email and SMS campaigns
- **Affiliates/influencers:** Generate unique UTM links per creator using a URL builder; track in a spreadsheet

### Step 3: Configure attribution in your chosen tool

---

#### Shopify

**Option A: Built-in Shopify Analytics (last-click, free)**

1. Go to **Analytics → Reports → Sessions over time**
2. Filter by **Referral source** to see which UTM sources drove sessions
3. Go to **Analytics → Reports → Sales by traffic source** for revenue by channel (last-click attribution)
4. Limitation: Shopify's built-in attribution is last-click only with a 30-day window; it cannot show multi-touch paths

**Option B: Triple Whale (recommended for DTC brands spending $50K+/mo on ads)**

1. Install **Triple Whale** from the Shopify App Store
2. Triple Whale's pixel fires on every page load, capturing the full click path before purchase
3. Go to **Triple Whale → Attribution** to see revenue under four models side by side: first-click, last-click, linear, and Triple Whale's own blended model
4. Connect your ad accounts (Meta, Google, TikTok) under **Integrations** — Triple Whale then compares your platform-reported ROAS against first-party-attributed ROAS
5. Use the **Summary Dashboard** for a daily view of true ROAS by channel

**Option C: Polar Analytics (mid-market, more affordable)**

1. Install **Polar Analytics** from the Shopify App Store
2. Connect ad accounts under **Integrations**
3. Polar provides first-party attribution with multiple models and a "blended ROAS" metric that accounts for all channels

---

#### WooCommerce

**Using Metorik + GA4**

1. Install **Metorik** (metorik.com) and connect to your WooCommerce store
2. Metorik captures UTM parameters on every order automatically — no additional plugin needed once configured
3. In Metorik, go to **Reports → UTM** to see orders and revenue by utm_source, utm_medium, and utm_campaign (last-click)
4. For multi-touch attribution, pair Metorik with **Google Analytics 4:**
   - Install GA4 via **Site Kit by Google** or **MonsterInsights** plugin
   - In GA4, go to **Advertising → Attribution** to configure the attribution model (last click, first click, linear, data-driven)
   - GA4's data-driven attribution requires 400+ conversions per month to activate

**Alternative: WooCommerce Google Analytics plugin (free)**

- Tracks ecommerce events automatically; provides last-click channel attribution in GA4

---

#### BigCommerce

1. In BigCommerce, go to **Storefront → Script Manager** and add your attribution tool's pixel
2. **Rockerbox** (recommended): Installs via script; pulls BigCommerce orders via API to match to ad touchpoints; provides first-party attribution dashboard
3. Built-in BigCommerce analytics (**Analytics → Marketing**) shows traffic sources by last-click session; limited to top-level source/medium
4. For deeper analysis, connect BigCommerce to **Google Analytics 4** via the official BigCommerce GA4 integration in **Apps → Google**

---

#### Custom / Headless

For headless storefronts, capture touchpoints server-side and store them with orders. Then model attribution in a data warehouse:

**Step 1 — Capture UTM touchpoints on every visit:**

```typescript
// Client-side: capture and store UTM params in localStorage on every page load
function captureUTMTouchpoint() {
  const params = new URLSearchParams(window.location.search);
  if (!params.get('utm_source') && !params.get('gclid') && !params.get('fbclid')) return;

  const touchpoints = JSON.parse(localStorage.getItem('utm_touchpoints') || '[]');
  touchpoints.push({
    source: params.get('utm_source') ?? inferSource(document.referrer),
    medium: params.get('utm_medium') ?? 'organic',
    campaign: params.get('utm_campaign') ?? '(none)',
    touchedAt: new Date().toISOString(),
    landingPage: window.location.pathname,
  });
  // Keep last 10 touchpoints (30-day look-back)
  localStorage.setItem('utm_touchpoints', JSON.stringify(touchpoints.slice(-10)));
}
```

**Step 2 — Attach touchpoints to the order at checkout:**

```typescript
// Send stored touchpoints with the order creation request
const touchpoints = JSON.parse(localStorage.getItem('utm_touchpoints') || '[]');
await createOrder({ ...orderData, marketingTouchpoints: touchpoints });
```

**Step 3 — Store and model attribution in your data warehouse:**

Export to BigQuery or Snowflake via **Fivetran** or **Stitch**, then build attribution models in **dbt**. Use a dbt package like `dbt-attribution` or write your own last-click, linear, and time-decay models against your orders + touchpoints tables.

### Step 4: Compare attribution models and act on the data

Run these comparisons monthly to guide budget decisions:

| What to compare | How to interpret |
|-----------------|-----------------|
| Platform ROAS vs. first-party ROAS | If platform ROAS is 5x but first-party is 2x, the channel is getting over-credited from view-through attribution |
| Last-click vs. linear (all-touch) | Channels that appear stronger under linear are likely assisting conversions that get credited elsewhere under last-click |
| First-touch vs. last-touch | First-touch shows which channels drive awareness; last-touch shows which channels close sales |

**Rule of thumb:** If Meta claims $200K in attributed revenue and Google claims $180K, but your total revenue was $250K, you have significant attribution overlap. Use a first-party tool (Triple Whale, Rockerbox) to de-duplicate and get a realistic picture.

## Best Practices

- **Always compare multiple models** — no single attribution model is "correct"; the comparison reveals which channels are over/under-credited in your current setup
- **Use first-party data for attribution** — iOS privacy changes have made third-party pixel attribution unreliable; server-side UTM tracking is now essential
- **Standardize UTM naming conventions strictly** — `utm_source=google` and `utm_source=Google` are treated as different channels; enforce lowercase and a controlled vocabulary
- **Apply a 30-day look-back window** — most e-commerce conversions occur within 30 days of first touch; use this as your standard window
- **Benchmark total attributed revenue against actual revenue** — the sum of first-party attributed revenue should equal total order revenue; a large gap indicates tracking gaps
- **Report blended ROAS (total revenue / total ad spend) alongside channel ROAS** — blended ROAS is harder to manipulate and gives a true picture of overall marketing efficiency

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Total platform-reported revenue exceeds actual revenue | This is expected — each platform claims 100% credit; use a first-party tool (Triple Whale, Rockerbox) to de-duplicate attribution |
| 40-60% of orders show as "direct" or "none" | UTM parameters are missing from campaign links; audit your UTM setup in each ad platform; add UTMs to email footers and bio links |
| UTM parameters stripped by redirect domains | Test your redirect URLs; some URL shorteners strip UTM params — use Google's URL builder and verify parameters survive |
| Attribution shows email with very low credit | Email often appears late in conversion paths under last-click because customers come back via direct; check first-click model to see email's role in awareness |
| iOS privacy changes reduced Meta attribution accuracy | Use Meta's Conversions API (CAPI) integration — Klaviyo and Triple Whale both support CAPI to send server-side conversion events back to Meta |

## Related Skills

- @influencer-tracking
- @affiliate-program
- @sales-reporting-dashboard
- @customer-analytics
- @ab-testing-ecommerce
