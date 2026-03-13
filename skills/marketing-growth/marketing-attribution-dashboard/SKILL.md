---
name: marketing-attribution-dashboard
description: "Build multi-touch attribution dashboards tracking revenue by channel, campaign, and creative with blended ROAS analysis and budget allocation recommendations"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [attribution, analytics, marketing-roi]
triggers: ["build attribution dashboard", "track marketing ROI"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Marketing Attribution Dashboard

## Overview

Every ecommerce business faces attribution chaos: Meta says it drove 300 purchases, Google says 280, and your order management system shows 400 total. The overlap is real, the methodologies differ, and single-touch last-click models misrepresent the true value of upper-funnel channels. A proper attribution dashboard aggregates all marketing data in one place and applies a consistent model so you can make defensible budget decisions. For most merchants, a third-party attribution tool — not custom code — is the fastest path to accurate channel ROI.

## When to Use This Skill

- When ad spend decisions rely on platform-reported ROAS rather than actual order data
- When you suspect paid social is stealing attribution from organic search or email
- When preparing a quarterly marketing budget review and need a defensible data source
- When launching a new channel and need to measure its true incremental contribution
- When reporting marketing performance to investors or a board

## Core Instructions

### Step 1: Choose the right attribution tool

| Platform | Best For | Shopify | WooCommerce | BigCommerce | Price |
|----------|---------|---------|-------------|-------------|-------|
| **Triple Whale** | Shopify-native, real-time pixel + CAPI | App Store | Limited | Limited | $129+/mo |
| **Northbeam** | Advanced multi-touch, TV/podcast spend | App Store | Via pixel | Via pixel | $500+/mo |
| **Rockerbox** | Mid-market, all channels including offline | App Store | Via pixel | Via pixel | $500+/mo |
| **GA4** (free) | All platforms, good enough for most | Via tag | Via tag | Via tag | Free |
| **Wicked Reports** | WooCommerce-native, integrates with Klaviyo | Limited | Plugin | Limited | $299+/mo |

**Start with GA4** for most stores — it is free, handles multi-channel attribution with configurable models, and integrates natively with Google Ads. Upgrade to Triple Whale or Northbeam when you need real-time pixel data that survives iOS 14 restrictions.

### Step 2: Set up attribution reporting

---

#### Shopify

**With GA4 (recommended starting point):**
1. Go to **Shopify Admin → Online Store → Preferences → Google Analytics**
2. Enter your GA4 Measurement ID (`G-XXXXXXXXXX`)
3. Enable **Enhanced Ecommerce** under GA4 property settings
4. In **GA4 → Reports → Acquisition → Traffic Acquisition**: set secondary dimension to `Session campaign` to break down by campaign
5. In **GA4 → Reports → Acquisition → Traffic Acquisition**: set the comparison period to 30 days and filter by `Session medium` to isolate paid, organic, email, and social

**With Triple Whale (Shopify-native, recommended for paid social):**
1. Install **Triple Whale** from the Shopify App Store
2. Go to **Triple Whale → Pixel Setup** and add the Triple Whale pixel to your theme — this is a first-party pixel not blocked by iOS 14
3. Connect your ad accounts: **Triple Whale → Integrations** → connect Meta, Google Ads, and TikTok
4. Triple Whale's **Summary Page** shows a unified ROAS view across all ad platforms using your actual Shopify order data as the source of truth
5. Use **Triple Whale → Attribution → Model Comparison** to compare last-click, first-click, and linear attribution in a single view

---

#### WooCommerce

**With GA4:**
1. Install **MonsterInsights** (free tier) or **Google Site Kit** from the WordPress plugin directory
2. Go to **MonsterInsights → Settings → Analytics** and connect your GA4 property
3. Enable enhanced ecommerce tracking — MonsterInsights handles the data layer events automatically
4. For UTM attribution reports: go to **GA4 → Reports → Acquisition → Traffic Acquisition** and filter by source/medium

**With Wicked Reports (WooCommerce-specific):**
1. Install **Wicked Reports** from the WordPress plugin directory
2. Connect your WooCommerce store and email platform (Klaviyo, Mailchimp)
3. Wicked Reports assigns multi-touch attribution to each order by tracking the full customer journey from first ad click to purchase
4. Go to **Wicked Reports → ROI** to see revenue per ad campaign using your actual order data

---

#### BigCommerce

1. Go to **BigCommerce Admin → Settings → Analytics → Google Analytics**
2. Enter your GA4 Measurement ID and enable Enhanced Ecommerce
3. For advanced attribution: install **Triple Whale** or **Northbeam** from the BigCommerce App Marketplace — both support BigCommerce via tracking pixel
4. In BigCommerce Analytics, go to **Analytics → Marketing** to see channel-level attribution based on BigCommerce's built-in last-click model

---

#### Custom / Headless

For headless stores, capture first-touch attribution server-side before building any reporting layer. Third-party tools like Triple Whale, Northbeam, or Rockerbox all provide a JavaScript pixel + server-side API for custom stacks.

If you need to build custom multi-touch attribution:

```typescript
interface TouchpointEvent {
  sessionId: string;
  customerId?: string;
  anonymousId: string;
  channel: string;       // 'paid-social' | 'paid-search' | 'organic' | 'email' | 'sms' | 'direct'
  source: string;        // 'meta' | 'google' | 'tiktok' | 'klaviyo'
  medium: string;
  campaign?: string;
  orderId?: string;
  orderValue?: number;
  timestamp: Date;
}

function classifyChannel(utm: UtmParams, referrer?: string): string {
  if (utm.medium === 'cpc' || utm.medium === 'paid')       return 'paid-search';
  if (utm.medium === 'paid-social' || utm.source?.match(/meta|facebook|instagram|tiktok/i)) return 'paid-social';
  if (utm.medium === 'email')                               return 'email';
  if (utm.medium === 'sms')                                 return 'sms';
  if (referrer?.match(/google|bing|yahoo/i))                return 'organic-search';
  if (referrer && !referrer.includes(process.env.STORE_DOMAIN!)) return 'referral';
  return 'direct';
}

// Attribution model: 40% first touch, 40% last touch, 20% distributed across middle
function positionBasedWeights(touchpoints: TouchpointEvent[]): number[] {
  const n = touchpoints.length;
  if (n === 1) return [1];
  if (n === 2) return [0.5, 0.5];
  const middleShare = 0.2 / (n - 2);
  return touchpoints.map((_, i) => {
    if (i === 0) return 0.4;
    if (i === n - 1) return 0.4;
    return middleShare;
  });
}
```

Use a dedicated attribution API service like **Rockerbox** or **Northbeam** rather than building the full attribution engine from scratch — the complexity of cross-device stitching and model computation is not worth custom-building for most stores.

### Step 3: Configure UTM tracking consistently

UTM parameters are the foundation of any attribution system. Without consistent UTMs, even GA4 cannot attribute sessions correctly.

**Standard UTM structure:**

| Channel | `utm_source` | `utm_medium` | `utm_campaign` |
|---------|-------------|-------------|----------------|
| Meta Ads | `facebook` or `instagram` | `paid-social` | `spring-2026-prospecting` |
| Google Ads | `google` | `cpc` | `brand-search` |
| TikTok Ads | `tiktok` | `paid-social` | `ugc-spring-2026` |
| Klaviyo email | `klaviyo` | `email` | `welcome-series` |
| SMS | `postscript` | `sms` | `abandoned-cart` |

Use Google's Campaign URL Builder at `ga-dev-tools.google.com/campaign-url-builder` to generate UTM links consistently.

**In Klaviyo:** Go to **Klaviyo → Account → Settings → UTM Tracking** and enable auto-UTM tagging — Klaviyo appends UTM parameters to all email links automatically.

**In Meta Ads:** Go to **Ads Manager → Campaign → URL Parameters** and add `utm_source={{site_source_name}}&utm_medium=paid-social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}` to your ad URL parameters at the campaign level.

### Step 4: Build a blended ROAS dashboard in GA4

1. Go to **GA4 → Explore → Free Form** and create a new exploration
2. Set **Dimensions**: Session source/medium, Session campaign
3. Set **Metrics**: Sessions, Ecommerce purchases, Purchase revenue, Transactions
4. Add a filter: `Session medium` contains `paid` to isolate paid channels
5. Use **GA4 → Advertising → Attribution** to compare last-click vs. data-driven attribution models side by side
6. For manual ROAS: export GA4 revenue by channel → enter ad spend from each platform → calculate `Revenue / Spend` in a spreadsheet

**Automate with Google Looker Studio (free):**
1. Connect Looker Studio to GA4, Google Ads, and your Shopify/WooCommerce data source
2. Build a blended channel dashboard using Looker Studio's **Blend Data** feature
3. Join GA4 session data with Google Ads spend by campaign name

### Step 5: Measure attribution health

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Channel coverage (% of orders with UTM attribution) | > 70% | GA4 Acquisition report |
| Email channel share of attributed revenue | Varies by business | GA4 filter by utm_medium=email |
| Paid social EMQ score (for Meta CAPI) | 7+ / 10 | Meta Events Manager |
| Cross-channel ROAS discrepancy | < 30% variance vs. platform-reported | Compare GA4 vs. Ads Manager |

## Best Practices

- **GA4 is ground truth, not platform dashboards** — every ad platform over-attributes to itself; your order database and GA4 are the closest thing to ground truth
- **Use position-based attribution for budget decisions** — it rewards both discovery (first-touch) and closing (last-touch) channels; linear attribution underweights email and organic
- **Set a 30-day lookback minimum** — customers research for weeks before buying; 7-day windows miss upper-funnel contributions from paid social
- **Consistent UTMs are more important than the tool** — even the best attribution tool fails with inconsistent or missing UTM parameters; audit UTM coverage before buying a tool
- **Compare models, not just the default** — looking at the same period under last-click vs. linear vs. position-based reveals which channels are being systematically over- or under-credited

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Direct traffic massively over-attributed | Set a 30-min session timeout in GA4; check for missing UTM parameters on all ad campaigns |
| Email channel under-attributed | Enable auto-UTM in Klaviyo; test all links to verify UTMs survive ESP link tracking |
| Platform ROAS looks great but profitability is flat | Platforms count view-through attribution; compare attribution windows — use 7-day click only |
| Dashboard loads slowly | Use pre-aggregated GA4 summary tables; avoid building attribution from raw event exports |

## Related Skills

- @meta-ads-integration
- @google-ads-ecommerce
- @tiktok-ads-integration
- @affiliate-program
- @influencer-marketplace-integration
