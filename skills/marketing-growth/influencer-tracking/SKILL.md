---
name: influencer-tracking
description: "Measure influencer campaign ROI by generating unique UTM links per creator, attributing sales, and reporting revenue against campaign spend"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [influencer, attribution, utm, roi, campaign-tracking, creator, ugc, instagram, tiktok]
triggers: ["influencer tracking", "influencer attribution", "influencer ROI", "UTM management", "creator campaign tracking", "influencer marketing analytics"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Influencer Tracking

## Overview

Influencer marketing drives significant revenue but is notoriously difficult to attribute because customers often see a post, leave the platform, and purchase days later through a direct or organic channel. The solution is using both UTM links (for web traffic) and unique discount codes (for purchase attribution) together — these two signals complement each other and provide reliable attribution across devices. Most of this setup requires no custom code.

> **Note:** For full influencer campaign management (discovery, briefs, deliverables), see @influencer-marketplace-integration. This skill focuses purely on attribution and analytics.

## When to Use This Skill

- When managing 10+ influencer partnerships and tracking them in a spreadsheet
- When needing to prove ROI of influencer spend to leadership with first-party data
- When running gifting campaigns and needing to separate organic versus paid post attribution
- When comparing performance across platforms (Instagram, TikTok, YouTube) in a single dashboard

## Core Instructions

### Step 1: Set up UTM links for each creator

Create a unique UTM link for every influencer and campaign combination. Use Google's Campaign URL Builder at `ga-dev-tools.google.com/campaign-url-builder`:

| UTM Parameter | Value | Example |
|--------------|-------|---------|
| `utm_source` | Social platform | `instagram`, `tiktok`, `youtube` |
| `utm_medium` | Always `influencer` | `influencer` |
| `utm_campaign` | Campaign name | `spring-2026`, `black-friday` |
| `utm_content` | Creator handle | `janedoe`, `johndoe_fitness` |

Example URL: `yourstore.com/?utm_source=instagram&utm_medium=influencer&utm_campaign=spring-2026&utm_content=janedoe`

**Shorten the link** for Instagram bio use: use Bitly or a custom short domain. Store the mapping between short URL and UTM parameters in a spreadsheet.

**Important**: give influencers the shortened link and instruct them to place it in their link-in-bio, not in the post caption (Instagram captions do not have clickable links).

### Step 2: Create unique discount codes for each creator

Discount codes capture purchases that happen via direct/organic after the initial influencer visit — the UTM link alone misses these.

---

#### Shopify

1. Go to **Shopify Admin → Discounts → Create Discount → Amount off order**
2. Configure:
   - **Discount code**: `JANEDOE15` (creator handle + percentage)
   - **Discount type**: Percentage — 15%
   - **Applies to**: All products (or specific collections if needed)
   - **Minimum purchase requirement**: $30 (to ensure positive ROI)
   - **Usage limits**: Enable "Limit to one use per customer"
   - **Active dates**: Set campaign start and end date
3. Click Save and send the code to the influencer

**Pro tip**: Use Shopify Flow (Plus) or an app like **Glew** to automatically tag orders using a specific discount code with the influencer's name — this makes attribution reporting easier.

---

#### WooCommerce

1. Go to **WooCommerce → Marketing → Coupons → Add coupon**
2. Configure:
   - **Coupon code**: `JANEDOE15`
   - **Discount type**: Percentage discount — 15%
   - **Minimum spend**: $30
   - **Usage limit per user**: 1
   - **Coupon expiry date**: Campaign end date
3. Under **Restrictions → Allowed emails**: optionally limit to new customers only

---

#### BigCommerce

1. Go to **BigCommerce Admin → Marketing → Promotions → Create Promotion**
2. Set coupon code, discount amount, and usage limits
3. Set an expiry date matching the campaign end date

---

### Step 3: Track attribution in Google Analytics 4

For all platforms, UTM tracking works through GA4 automatically:

1. In **GA4 → Reports → Acquisition → Traffic Acquisition**: filter by `Session medium = influencer` to see all influencer-driven sessions
2. In **GA4 → Reports → Acquisition → Traffic Acquisition**: add `Session campaign` as a secondary dimension to compare by campaign
3. In **GA4 → Explore → Free Form**: build a report with `utm_content` as a dimension to compare creator performance

**See influencer-attributed revenue:**
1. Go to **GA4 → Reports → Monetization → Ecommerce Purchases**
2. Filter by `utm_medium = influencer`
3. Add `utm_content` as a dimension to see revenue per creator

### Step 4: Track discount code revenue

---

#### Shopify

1. Go to **Shopify Admin → Analytics → Reports → Discounts → Discount codes**
2. Filter by creator-specific codes to see revenue, order count, and usage per influencer
3. For a comparison view: **Analytics → Custom Reports → Orders** → group by discount code

---

#### WooCommerce

1. Go to **WooCommerce → Analytics → Coupons**
2. Filter by influencer-specific coupon codes to see revenue and orders
3. Or install **Metorik** ($50/mo) for more advanced coupon attribution reporting

---

### Step 5: Build a creator performance tracker

Combine UTM revenue (from GA4) and discount code revenue (from Shopify/WooCommerce) in a single tracking spreadsheet:

| Creator | Platform | Campaign | UTM Revenue | Code Revenue | Total Revenue | Cost | ROAS |
|---------|---------|---------|------------|-------------|--------------|------|------|
| @janedoe | Instagram | Spring 2026 | $840 | $1,200 | $2,040 | $500 | 4.1x |
| @johndoe | TikTok | Spring 2026 | $320 | $680 | $1,000 | $300 | 3.3x |

**ROAS calculation**: Total Revenue ÷ Campaign Cost (flat fee + COGS of gifted product + commission paid)

**Normalize by reach** for fair comparison between micro and macro influencers:
- Revenue per 1,000 followers = Total Revenue / (Follower Count / 1,000)
- This metric often reveals that micro-influencers outperform macro-influencers significantly

### Step 6: For headless stores — capture first-touch attribution

Standard last-click UTM attribution in GA4 misses influencer impact. Capture first-touch UTM data server-side:

```typescript
// On page load, store the first UTM touch in a session cookie
function captureFirstTouchUTM() {
  const params = new URLSearchParams(window.location.search);
  if (!params.get('utm_source')) return;

  // Only store if no first-touch already captured this session
  if (!sessionStorage.getItem('first_touch_utm')) {
    sessionStorage.setItem('first_touch_utm', JSON.stringify({
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      landed_at: new Date().toISOString(),
    }));
  }
}

// At checkout, include first-touch UTM in the order metadata
// Store in your order database for reporting
```

## Best Practices

- **Always use both UTM links and promo codes** — UTM tracks web traffic; codes capture purchases that happen days later via direct or organic
- **Use `utm_content` for the influencer handle** — this lets you compare performance by creator within a single campaign (e.g., 20 influencers in the same spring campaign)
- **For Instagram, links must go in bio** — give influencers a link-in-bio URL and tell them to reference "link in bio" in their caption; caption links are not clickable
- **Set campaign end dates on promo codes** — expires influencer discounts automatically and prevents long-term code sharing on coupon sites
- **Track gifting value as campaign cost** — gifted products have COGS; include this in your ROAS calculation
- **Compare EMV (Earned Media Value) alongside revenue** — high-reach posts with lower conversion may still justify spend as brand awareness

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Promo codes shared on coupon/deal sites | Add per-customer usage limit (1 per customer) and monitor daily usage velocity for spikes |
| UTM attribution lost when customer uses a different device | Supplement UTM tracking with promo codes as a device-agnostic signal |
| No way to compare micro-influencers vs. macro-influencers fairly | Calculate revenue per 1,000 followers (normalized RPM) to compare across follower counts |
| Influencer posts after campaign end date | Add a 7-day grace period to your code expiry; store `first_attributed_order_at` to detect late posts |
| GA4 shows organic instead of influencer for returning customers | Use first-touch attribution model in GA4 Explore or compare against discount code data |

## Related Skills

- @influencer-marketplace-integration
- @affiliate-program
- @marketing-attribution-dashboard
- @social-commerce
- @ugc-campaign-management
