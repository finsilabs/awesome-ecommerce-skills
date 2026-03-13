---
name: marketing-spend-analysis
description: "Track and analyze marketing spend across all channels with ROAS calculation, diminishing returns analysis, and budget reallocation recommendations by platform"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [marketing-spend, roas, budget-optimization]
triggers: ["analyze marketing spend", "ROAS analysis", "marketing budget allocation", "channel efficiency", "diminishing returns", "ad spend optimization", "blended ROAS"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Marketing Spend Analysis

## Overview

Marketing spend is typically the largest variable cost in a DTC ecommerce business — often 15–40% of revenue. Unlike most costs, marketing spend is directly controllable in near-real-time: you can increase or decrease budgets on paid channels within minutes. This creates both opportunity (scale what works) and risk (waste capital on what does not).

The core goal is to maximize total contribution profit from your marketing investment — not just revenue. A channel with high ROAS but thin margins, high return rates, or low AOV may generate less actual profit than a channel with lower ROAS and stronger unit economics.

This skill guides you through building a unified view of marketing spend and performance across all channels, using tools designed specifically for ecommerce merchants.

## When to Use This Skill

- When managing marketing budgets across multiple platforms (Meta, Google, TikTok, Amazon Ads)
- When wanting to identify which channels generate the most profitable customers
- When needing a unified marketing performance dashboard fed by multiple ad platforms
- When hitting diminishing returns on a key channel and deciding how to reallocate spend
- When comparing platform-reported ROAS against first-party attributed ROAS
- When building a marketing efficiency report for a board or investor update

## Core Instructions

### Step 1: Choose a unified marketing analytics tool

The biggest problem in marketing spend analysis is that each platform (Meta, Google, TikTok) reports its own ROAS using its own attribution window — and they all claim 100% credit. You need a tool that pulls data from all platforms into one view and compares against your actual order data.

| Platform | Recommended Tool | What It Does |
|----------|-----------------|-------------|
| **Shopify** | **Triple Whale** or **Polar Analytics** | Connects Shopify orders + all ad platforms; shows blended ROAS, MER, and channel-level true ROAS side by side |
| **Shopify** (budget option) | **Shopify Analytics** + **Google Analytics 4** | Free; last-click attribution only; no cross-platform comparison |
| **WooCommerce** | **Metorik** + **GA4** | Metorik adds UTM attribution to WooCommerce orders; GA4 provides channel-level conversion reporting |
| **BigCommerce** | **Glew.io** or **Rockerbox** | Both connect BigCommerce orders to ad platform spend data |
| **All platforms** | **Northbeam** or **Rockerbox** | Platform-agnostic; provide first-party multi-touch attribution across all channels with spend pacing |

**Key metrics to track in your chosen tool:**

| Metric | Definition | Why It Matters |
|--------|-----------|---------------|
| **Platform ROAS** | Revenue attributed by each platform / spend on that platform | What the ad platform claims (typically inflated) |
| **First-party ROAS** | Revenue attributed by your own pixel / spend | More accurate; corrects for view-through over-attribution |
| **Blended MER** | Total revenue / total marketing spend across all channels | Overall marketing efficiency; harder to game |
| **True ROAS** | Gross profit attributed to channel / spend | Accounts for COGS; the right metric for profitability decisions |
| **CAC (new customers only)** | New customer acquisition spend / new customers acquired | Separate from retargeting/retention spend |
| **ROAS break-even** | 1 / (1 - COGS rate - fulfillment rate) | Minimum ROAS needed to not lose money |

### Step 2: Set up your marketing analytics stack

---

#### Shopify

**Triple Whale setup (recommended for $50K+/mo ad spend):**

1. Install **Triple Whale** from the Shopify App Store
2. Connect all ad accounts under **Settings → Integrations**: Meta, Google, TikTok, Pinterest, Snapchat
3. Triple Whale installs a first-party pixel on your store that tracks the full customer journey
4. Go to **Triple Whale → Summary Dashboard** — view daily spend, attributed revenue, ROAS, MER, new customer CAC, and gross profit by channel in one dashboard
5. Go to **Triple Whale → Attribution → Channel** to see revenue under different attribution models side by side (first-click, last-click, Triple Whale's blended model)
6. Set up **Morning Digest** emails — Triple Whale sends a daily performance summary automatically
7. Set **Budget Alerts** under **Settings → Alerts** — get Slack/email notifications when ROAS drops below threshold or spend is pacing to overshoot monthly budget

**Polar Analytics setup (mid-market, more affordable):**

1. Install **Polar Analytics** from the Shopify App Store
2. Connect ad accounts under **Integrations**
3. Go to **Polar → Channels** — view spend, attributed revenue, ROAS, and gross profit by channel
4. Go to **Polar → Blended Dashboard** — view overall MER and blended spend vs. revenue trend
5. Use **Polar → AI Insights** for automated anomaly detection and spend recommendations

---

#### WooCommerce

**Metorik + GA4 setup:**

1. Install **Metorik** and connect to your WooCommerce store
2. Metorik captures UTM parameters on every order — go to **Metorik → Reports → UTM** to see orders and revenue by utm_source, utm_medium, utm_campaign
3. Install **Google Analytics 4** via the **Site Kit** or **MonsterInsights** plugin
4. In GA4, go to **Advertising → Attribution → Model comparison** — select Google, Paid Social, Email as your channels and compare last-click vs. data-driven attribution
5. For ad spend data from non-Google platforms (Meta, TikTok), manually import spend CSVs into a Google Sheet and connect to Looker Studio alongside GA4 data for a unified view

**Alternative: Northbeam or Rockerbox**
- Both support WooCommerce via JavaScript pixel + order API integration
- Provide the same cross-platform attribution capabilities as Triple Whale but with WooCommerce compatibility

---

#### BigCommerce

1. Install **Glew.io** from the BigCommerce App Marketplace
2. Connect ad accounts (Meta, Google, Amazon) in Glew under **Integrations**
3. Glew shows spend, attributed revenue, ROAS, and blended MER by channel
4. For more advanced first-party attribution: install **Rockerbox** via script injection (BigCommerce → Storefront → Script Manager)

---

### Step 3: Define your ROAS break-even and targets

Before analyzing whether a channel is performing well, calculate your minimum viable ROAS.

**ROAS break-even formula:**
```
Break-even ROAS = 1 / (1 - COGS rate - variable cost rate)

Example:
  COGS rate: 45% of revenue
  Fulfillment + payment fees: 12% of revenue
  Break-even ROAS = 1 / (1 - 0.45 - 0.12) = 1 / 0.43 = 2.33x

Any channel with true ROAS below 2.33x is losing money on every sale.
```

**Target ROAS by channel type:**

| Channel Type | Target ROAS Multiplier Above Break-Even | Why |
|-------------|----------------------------------------|-----|
| Prospecting (new customers) | 1.5–2x break-even | Acquiring new customers has higher long-term value than single-order ROAS suggests |
| Retargeting (existing visitors) | 2–3x break-even | Lower cost; higher conversion rate; but be careful of incrementality |
| Brand search (Google Branded) | 5x+ | High ROAS but low incrementality; customers were coming anyway |
| Non-brand search (Google Generic) | 1.5–2x break-even | True incremental; valuable for new customer acquisition |
| Email/SMS | 10x+ | Low cost per send; high ROAS but measures existing customer retention, not acquisition |

### Step 4: Build a weekly channel performance scorecard

Set up a weekly review with this structure. Pull data from your analytics tool (Triple Whale, Glew, GA4):

```
CHANNEL PERFORMANCE SCORECARD (Last 7 Days vs. Prior 7 Days)
─────────────────────────────────────────────────────────────
Channel    | Spend  | 1P Revenue | 1P ROAS | vs LW | Status
Meta Ads   | $12,400| $38,400    | 3.1x    | +0.3x | OK ✓
Google Ads | $8,200 | $31,100    | 3.8x    | -0.2x | OK ✓
TikTok Ads | $3,100 | $5,700     | 1.8x    | -0.8x | REVIEW ⚠
Amazon Ads | $4,500 | $19,800    | 4.4x    | +0.1x | OK ✓
Email/SMS  | $800   | $22,000    | 27.5x   | +2.0x | OK ✓
─────────────────────────────────────────────────────────────
Total      | $29,000| $117,000   | 4.0x    |       | MER: 4.0x
Break-even ROAS: 2.33x | Monthly Budget: $125,000 | Paced to spend: $126,500 (+$1,500)
```

**TikTok is flagged:** ROAS dropped from 2.6x to 1.8x (below 2.33x break-even). Action: Investigate creative fatigue; pause underperforming ad sets; hold budget before cutting entirely.

### Step 5: Make budget reallocation decisions

Use this decision framework when channels are over/under-performing:

**When to reduce spend on a channel:**
- True ROAS has been below break-even for 2+ consecutive weeks
- First-party ROAS has declined more than 30% with no operational explanation
- Creative has not been refreshed in 30+ days and ROAS is declining (creative fatigue)

**When to increase spend on a channel:**
- True ROAS is 2x or more above break-even
- First-party ROAS has been stable or increasing for 3+ weeks
- Marginal ROAS at current spend level is still above break-even (not in diminishing returns territory)

**Before cutting spend, investigate:**
1. Is a top SKU out of stock? Ads running for out-of-stock products waste spend with no ability to convert
2. Did a creative rotation happen? Performance often dips temporarily during algorithm learning phases (50+ optimization events needed)
3. Did a competitor run a major promotion? Temporary CPM/CPC spikes are not structural channel problems
4. Is the tracking pixel firing correctly? A sudden ROAS drop can be a tracking issue, not a performance issue

## Best Practices

- **Track true ROAS (profit-based), not platform-reported ROAS** — platform ROAS using view-through attribution is almost always higher than reality; compute ROAS from your own first-party data
- **Monitor MER (Marketing Efficiency Ratio) as a holistic metric** — blended MER (total revenue / total marketing spend) is harder to game than individual channel ROAS; a healthy ecommerce MER is typically 3–6x
- **Separate new customer acquisition from retention spending** — remarketing and email/SMS to existing customers have very different economics than prospecting; track CAC and ROAS separately for new vs. returning customer campaigns
- **Build a weekly spend pacing report** — track cumulative spend vs. monthly budget by day; a channel at 80% of monthly budget by day 15 will either overspend or dramatically under-deliver in the second half
- **Track creative performance, not just campaign performance** — one creative often drives 70% of a campaign's ROAS; surface creative-level performance and prioritize winning formats
- **Test incrementality before doubling down** — high retargeting ROAS may be capturing sales that would have happened anyway; run holdout tests to measure true incremental impact

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Each platform claims credit for the same order | Use a first-party attribution tool (Triple Whale, Northbeam) to de-duplicate; platform-reported ROAS always double-counts |
| Cutting spend during a temporary ROAS dip | Investigate root cause before cutting; algorithmic learning phases (post-creative refresh) look like performance drops but recover; allow 50+ optimization events before evaluating |
| Not separating branded from non-branded search ROAS | Google Branded campaigns have very high ROAS but low incrementality; analyze separately or you will overestimate Google's true contribution |
| Running ads for out-of-stock products | Connect inventory status to your ad platforms; use rules-based automation in Meta/Google to pause campaigns when SKUs hit 0 stock |
| Ignoring email and SMS in ROAS calculations | Email/SMS spend is very low relative to revenue attributed; their MER looks incredible but remember they largely serve existing customers — they are retention tools, not acquisition tools |

## Related Skills

- @attribution-modeling
- @cost-allocation-analysis
- @unit-economics-tracking
- @ecommerce-budgeting-forecasting
- @financial-analytics-dashboard
