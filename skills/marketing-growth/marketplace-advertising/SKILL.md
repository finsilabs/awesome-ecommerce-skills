---
name: marketplace-advertising
description: "Manage sponsored product ads across Amazon, eBay, and Walmart marketplace platforms with bid optimization, keyword targeting, and ACOS tracking"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [marketplace-ads, amazon-ads, sponsored-products]
triggers: ["set up Amazon ads", "manage marketplace advertising"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Marketplace Advertising

## Overview

Marketplace advertising (Amazon Sponsored Products, Walmart Connect, eBay Promoted Listings) puts your products in front of shoppers with high purchase intent directly on the platform where they are shopping. Unlike Google/Meta, marketplace ads run within a closed ecosystem — clicks and conversions happen on the marketplace, not your site. The strategic work is campaign structure, keyword harvesting, and bid management. Amazon's native Campaign Manager UI handles most of this without code; automation tools like Perpetua or Sellics add bid optimization rules on top.

## When to Use This Skill

- When selling on Amazon and needing a structured campaign setup from scratch
- When ACOS (Advertising Cost of Sale) is above your target and needs systematic optimization
- When running campaigns across multiple marketplaces and needing unified reporting
- When wanting to automate keyword harvesting and bid adjustments without building custom scripts
- When launching a new product and needing an auto-campaign to discover converting search terms

## Core Instructions

### Step 1: Choose the right advertising management approach

| Approach | Best For | Platforms | Price |
|----------|---------|-----------|-------|
| **Amazon Campaign Manager** (native) | All sellers, getting started | Amazon | Free (% of ad spend) |
| **Perpetua** | Automation + goal-based bidding | Amazon, Walmart, Instacart | $250+/mo |
| **Sellics (now Perpetua)** | Analytics-heavy sellers | Amazon | $250+/mo |
| **Jungle Scout** | Sellers wanting product research + ads in one tool | Amazon | $49+/mo |
| **Pacvue** | Enterprise, multi-marketplace | Amazon, Walmart, Target | Custom |
| **Walmart Campaign Center** (native) | Walmart sellers | Walmart | Free (% of ad spend) |

**Start with Amazon's native Campaign Manager** for campaign setup. Once you have 30 days of data, add **Perpetua** or **Jungle Scout** for automated bid optimization if managing more than 5 active campaigns.

### Step 2: Set up your Amazon Sponsored Products campaigns

Note: Marketplace advertising is independent of your Shopify/WooCommerce/BigCommerce store. Amazon campaigns run within Seller Central regardless of your ecommerce platform.

---

#### Amazon Seller Central — Campaign Setup

**Create the two-campaign structure for each product group:**

**Auto campaign (keyword discovery):**
1. Go to **Amazon Seller Central → Advertising → Campaign Manager → Create Campaign**
2. Select **Sponsored Products**
3. Set:
   - Campaign name: `[Product Name] - Auto`
   - Daily budget: 30% of your total product budget (e.g., $15/day if total budget is $50/day)
   - Targeting: **Automatic targeting**
   - Default bid: $0.75
4. Under **Automatic Targeting**, set bids for all four match types (close match, loose match, substitutes, complements) — start equal, optimize after 2 weeks of data
5. Create the ad by selecting your ASIN

**Manual campaign (scaling proven keywords):**
1. Create a second campaign: `[Product Name] - Manual`
2. Set:
   - Daily budget: 70% of your total product budget
   - Targeting: **Manual targeting → Keyword targeting**
   - Match types: Add each seed keyword in both **Exact** (bid: $1.20) and **Phrase** (bid: $0.90)
3. Add negative keywords at campaign level: "free", "DIY", "how to", competitor brand names

---

#### Harvest keywords from auto campaign (weekly task)

After 7–14 days, move converting search terms from auto to manual:

1. Go to **Campaign Manager → [Auto Campaign] → Search Term Report**
2. Download the report for the last 14 days
3. Filter for rows where:
   - `7 Day Total Orders (#)` > 0
   - `Advertising Cost of Sales (ACOS)` < your target ACOS (e.g., 30%)
   - `Clicks` >= 5 (minimum data threshold)
4. For each qualifying search term:
   - Add it as an **Exact match** keyword in your manual campaign
   - Add it as a **Negative exact** keyword in your auto campaign (prevents both campaigns from competing for the same query)

---

#### Walmart Campaign Center

1. Go to **Walmart Seller Center → Advertising → Campaign Manager**
2. Create a **Sponsored Products** campaign
3. Walmart's setup mirrors Amazon's: choose automatic or manual targeting, set a daily budget and default bid
4. Walmart's search term report works identically to Amazon's — run the same weekly harvest process

---

#### eBay Promoted Listings

1. Go to **eBay Seller Hub → Marketing → Promoted Listings**
2. Select **Promoted Listings Standard** (cost-per-sale, no cost for clicks)
3. Set an ad rate (typically 5–15% of item sale price — higher rates = more visibility)
4. Select listings to promote — focus on listings with high conversion rates
5. eBay does not require keyword management for Standard; use **Promoted Listings Advanced** (CPC model) for keyword-level control

### Step 3: Set ACOS targets by product margin

ACOS = Advertising Cost ÷ Attributed Sales. Your target ACOS depends directly on your margin:

| Product Gross Margin | Target ACOS | Notes |
|---------------------|-------------|-------|
| 60%+ | 25–35% | Aggressive growth acceptable |
| 40–60% | 20–25% | Balanced growth |
| 25–40% | 15–20% | Conservative; break-even focus |
| < 25% | < 15% or pause ads | Low-margin products rarely work profitably on Amazon Ads |

Set your target ACOS in **Campaign Manager → Bidding Strategy → Target ACOS** (dynamic bidding) — Amazon will automatically adjust bids up/down to hit your target.

### Step 4: Bid optimization

**Amazon's built-in dynamic bidding (no third-party tool needed):**
1. Go to **Campaign Manager → [Campaign] → Edit**
2. Under **Bidding**, select **Dynamic bids — up and down**
3. Set a target ACOS — Amazon adjusts bids in real time
4. This works well for established campaigns with 30+ days of data

**Manual bid optimization rules (do weekly):**
- Keywords with ACOS > 1.2× target and 10+ clicks → reduce bid by 15%
- Keywords with ACOS < 0.8× target and 1,000+ impressions → increase bid by 10%
- Keywords with 20+ clicks and zero sales → pause or add as negative

**With Perpetua (automated):**
1. Connect Perpetua to your Amazon Seller Central account
2. Set a goal (target ACOS or target revenue) per campaign
3. Perpetua runs bid optimization daily using machine learning — no manual weekly reviews needed
4. Go to **Perpetua → Campaigns → Performance** to review automated recommendations before they execute

### Step 5: Track performance

Monitor these metrics in Campaign Manager weekly:

| Metric | Healthy Target | Where to Find |
|--------|----------------|---------------|
| ACOS | Below your margin threshold | Campaign Manager → Campaigns |
| Click-through rate (CTR) | > 0.3% for Sponsored Products | Campaign Manager → Ad Groups |
| Conversion rate | > 10% for Sponsored Products | Search Term Report |
| Impression Share | > 20% for top keywords | Search Term Impression Share report |
| Total Ad Spend / Total Revenue ratio (TACoS) | < 10% for mature products | Calculate manually: total ad spend ÷ total product revenue |

### Step 6: Custom / API-based management

Use the Amazon Advertising API only if you are managing 50+ campaigns programmatically or building a custom reporting dashboard. For most sellers, Campaign Manager is sufficient.

```typescript
// Amazon Advertising API client — only needed for programmatic campaign management
async function getAmazonAdsToken(config: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
    }),
  });
  const { access_token } = await response.json();
  return access_token;
}

// Automated bid optimization — runs weekly as a scheduled job
async function optimizeBids(adGroupId: string, targetAcos: number) {
  // Get 30-day keyword performance from the Reporting API
  // Filter keywords with insufficient data (< 10 clicks) — skip them
  // Keywords with ACOS > targetAcos * 1.2: reduce bid 15%
  // Keywords with ACOS < targetAcos * 0.8 and impressions > 1000: increase bid 10%
  // Clamp all bids between $0.10 and $10.00
}
```

For most sellers, use **Perpetua** or **Jungle Scout's** built-in automation rather than the API — these tools provide the same bid logic with a UI and no infrastructure to manage.

## Best Practices

- **Separate auto and manual campaigns from day one** — auto campaigns discover keywords; manual campaigns scale the winners with controlled bids; mixing them creates reporting confusion
- **Harvest keywords weekly for the first 60 days** — after initial launch, graduate the best terms to manual and add non-converters as negatives in the auto campaign
- **Pause keywords spending $20+ with zero sales** — set this as a weekly rule; low-converting keywords drain budget without contributing to ACOS
- **Use campaign-level negatives before launch** — add "free", "DIY", "how to", "used", "wholesale" as broad match negatives to all campaigns at launch
- **Align ACOS targets with actual product margins** — a 30% ACOS target on a 25% margin product guarantees losses; recalculate for each product group
- **Run Sponsored Brands alongside Sponsored Products** — occupying both the top banner (Sponsored Brands) and product grid (Sponsored Products) increases share of voice significantly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Auto campaign spending entirely on irrelevant queries | Add a comprehensive negative keyword list before launch; review search term report within 48 hours of first campaign |
| Manual and auto campaigns competing for the same queries | Graduate terms from auto to manual and add them as negative exact keywords in the auto campaign |
| ACOS looks high because of 14-day attribution window | Amazon attributes sales up to 14 days after a click; wait 14 days before evaluating a new campaign's ACOS |
| Out-of-stock ASINs still accruing ad spend | Pause campaigns when inventory drops below 2 weeks of supply; resume on restock |
| Low-margin products unprofitable despite hitting ACOS target | Calculate TACoS (total ad spend ÷ total product revenue) — if TACoS exceeds your contribution margin, the product does not support advertising |

## Related Skills

- @google-shopping-feed
- @google-ads-ecommerce
- @marketing-attribution-dashboard
- @multi-channel-selling
- @pricing-promotions
