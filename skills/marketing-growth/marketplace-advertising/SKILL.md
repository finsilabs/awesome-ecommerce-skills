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
platforms: [platform-agnostic]
difficulty: advanced
---

# Marketplace Advertising

## Overview

Marketplace advertising (Amazon Sponsored Products, Walmart Connect, eBay Promoted Listings) puts your products in front of shoppers with high purchase intent directly on the platform where they are shopping. Unlike Google/Meta, marketplace ads run on a cost-per-click model within a closed ecosystem — meaning clicks and conversions happen on the marketplace, not your site. This skill covers Amazon Ads API integration, campaign structure, keyword strategy, ACOS optimization, bid management automation, and cross-marketplace reporting.

## When to Use This Skill

- When selling on Amazon and needing to automate Sponsored Products campaign management
- When ACOS (Advertising Cost of Sale) is above your target and needs systematic optimization
- When running campaigns across multiple marketplaces and needing unified reporting
- When moving from manual bids to automated bid adjustment logic
- When launching a new product and needing an auto-campaign to harvest keywords

## Core Instructions

### 1. Amazon Ads API setup

Register your app in the Amazon Advertising Console and obtain OAuth credentials:

```typescript
// Amazon Advertising API client
interface AmazonAdsConfig {
  clientId:     string;
  clientSecret: string;
  refreshToken: string;
  profileId:    string;  // Amazon Ads profile ID (per marketplace)
  region:       'NA' | 'EU' | 'FE';
}

const REGION_ENDPOINTS: Record<AmazonAdsConfig['region'], string> = {
  NA: 'https://advertising-api.amazon.com',
  EU: 'https://advertising-api-eu.amazon.com',
  FE: 'https://advertising-api-fe.amazon.com',
};

async function getAmazonAdsToken(config: AmazonAdsConfig): Promise<string> {
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
    }),
  });
  const { access_token } = await response.json();
  return access_token;
}

async function amazonAdsRequest(config: AmazonAdsConfig, method: string, path: string, body?: object) {
  const token = await getAmazonAdsToken(config);
  const base  = REGION_ENDPOINTS[config.region];

  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Authorization':        `Bearer ${token}`,
      'Amazon-Advertising-API-ClientId': config.clientId,
      'Amazon-Advertising-API-Scope':    config.profileId,
      'Content-Type':         'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Amazon Ads API ${response.status}: ${await response.text()}`);
  return response.json();
}
```

### 2. Campaign structure for Sponsored Products

Use a two-campaign structure for every product group: auto-targeting to discover new keywords, and manual targeting to scale proven winners.

```typescript
async function createProductLaunchCampaigns(config: AmazonAdsConfig, params: {
  campaignName: string;
  asin:         string;
  dailyBudget:  number;
  seedKeywords: string[];
}) {
  // Auto campaign — Amazon auto-targets based on listing content
  const autoCampaign = await amazonAdsRequest(config, 'POST', '/v2/sp/campaigns', {
    name:              `${params.campaignName} - Auto`,
    campaignType:      'sponsoredProducts',
    targetingType:     'auto',
    state:             'enabled',
    dailyBudget:       params.dailyBudget * 0.3,  // 30% to auto for keyword discovery
    startDate:         format(new Date(), 'yyyyMMdd'),
  });

  // Manual campaign — exact and phrase match on known keywords
  const manualCampaign = await amazonAdsRequest(config, 'POST', '/v2/sp/campaigns', {
    name:              `${params.campaignName} - Manual`,
    campaignType:      'sponsoredProducts',
    targetingType:     'manual',
    state:             'enabled',
    dailyBudget:       params.dailyBudget * 0.7,
    startDate:         format(new Date(), 'yyyyMMdd'),
  });

  // Create ad groups and ads for each campaign
  for (const [campaign, type] of [[autoCampaign, 'auto'], [manualCampaign, 'manual']] as const) {
    const adGroup = await amazonAdsRequest(config, 'POST', '/v2/sp/adGroups', {
      name:       `${params.campaignName} - ${type}`,
      campaignId: campaign.campaignId,
      defaultBid: type === 'auto' ? 0.75 : 1.20,
      state:      'enabled',
    });

    // Create product ad
    await amazonAdsRequest(config, 'POST', '/v2/sp/productAds', {
      campaignId: campaign.campaignId,
      adGroupId:  adGroup.adGroupId,
      asin:       params.asin,
      state:      'enabled',
    });

    // Add keywords to manual campaign
    if (type === 'manual' && params.seedKeywords.length > 0) {
      await amazonAdsRequest(config, 'POST', '/v2/sp/keywords', {
        keywords: params.seedKeywords.flatMap(kw => [
          { campaignId: campaign.campaignId, adGroupId: adGroup.adGroupId, keywordText: kw, matchType: 'exact',  state: 'enabled', bid: 1.20 },
          { campaignId: campaign.campaignId, adGroupId: adGroup.adGroupId, keywordText: kw, matchType: 'phrase', state: 'enabled', bid: 0.90 },
        ]),
      });
    }
  }
}
```

### 3. Harvest keywords from auto campaigns

Weekly job to pull search term reports and promote converting queries to the manual campaign:

```typescript
async function harvestKeywordsFromAutoCampaign(config: AmazonAdsConfig, autoCampaignId: string, manualAdGroupId: string) {
  // Request a search term report
  const reportRequest = await amazonAdsRequest(config, 'POST', '/reporting/reports', {
    reportDate:  format(subDays(new Date(), 7), 'yyyyMMdd'),
    metrics:     'impressions,clicks,cost,sales7d,acos7d',
    recordType:  'targets',
    segment:     'query',
    campaignId:  autoCampaignId,
  });

  // Poll for report completion (async API)
  const reportData = await pollReport(config, reportRequest.reportId);

  // Filter for queries with conversions and acceptable ACOS
  const targetAcos = parseFloat(process.env.TARGET_ACOS ?? '0.30');
  const goodQueries = reportData.filter(row =>
    row.sales7d > 0 &&
    row.acos7d < targetAcos &&
    row.clicks >= 5  // minimum data threshold
  );

  // Check which queries are already in the manual campaign
  const existingKeywords = await getExistingKeywords(config, manualAdGroupId);
  const newKeywords = goodQueries.filter(q => !existingKeywords.has(q.query.toLowerCase()));

  if (newKeywords.length === 0) return;

  // Add converting queries as exact match to manual campaign
  await amazonAdsRequest(config, 'POST', '/v2/sp/keywords', {
    keywords: newKeywords.map(q => ({
      adGroupId:   manualAdGroupId,
      keywordText: q.query,
      matchType:   'exact',
      state:       'enabled',
      bid:         calculateOptimalBid(q),
    })),
  });

  // Add as negatives to auto campaign (let manual campaign handle them)
  await amazonAdsRequest(config, 'POST', '/v2/sp/negativeKeywords', {
    keywords: newKeywords.map(q => ({
      campaignId:  autoCampaignId,
      keywordText: q.query,
      matchType:   'negativeExact',
      state:       'enabled',
    })),
  });
}

function calculateOptimalBid(row: { clicks: number; cost: number; sales7d: number }): number {
  const targetAcos = parseFloat(process.env.TARGET_ACOS ?? '0.30');
  const convRate   = row.sales7d > 0 ? row.clicks / row.sales7d : 0.02;
  const avgOrderValue = row.sales7d / (row.sales7d > 0 ? 1 : 1);  // simplification
  return Math.min(Math.max(targetAcos * convRate * avgOrderValue, 0.10), 5.00);  // clamp bid
}
```

### 4. Bid optimization — ACOS-based adjustments

```typescript
// Run weekly bid optimization
async function optimizeBids(config: AmazonAdsConfig, adGroupId: string) {
  const keywords = await amazonAdsRequest(config, 'GET', `/v2/sp/keywords?adGroupId=${adGroupId}&state=enabled`);

  // Get 30-day performance for each keyword
  const performanceReport = await getKeywordPerformance(config, adGroupId, 30);
  const targetAcos = parseFloat(process.env.TARGET_ACOS ?? '0.30');

  const bidUpdates = [];

  for (const kw of keywords) {
    const perf = performanceReport.find(p => p.keywordId === kw.keywordId);
    if (!perf || perf.clicks < 10) continue; // insufficient data

    const currentAcos = perf.cost / perf.sales30d;
    let newBid = kw.bid;

    if (currentAcos > targetAcos * 1.2) {
      // ACOS too high — reduce bid by 15%
      newBid = kw.bid * 0.85;
    } else if (currentAcos < targetAcos * 0.8 && perf.impressions > 1000) {
      // ACOS very efficient and getting impressions — increase bid by 10% to capture more
      newBid = kw.bid * 1.10;
    }

    // Clamp within bounds
    newBid = Math.max(0.10, Math.min(newBid, 10.00));
    if (Math.abs(newBid - kw.bid) > 0.01) {
      bidUpdates.push({ keywordId: kw.keywordId, bid: parseFloat(newBid.toFixed(2)) });
    }
  }

  if (bidUpdates.length > 0) {
    await amazonAdsRequest(config, 'PUT', '/v2/sp/keywords', { keywords: bidUpdates });
  }
}
```

### 5. Walmart Connect integration (for Walmart sellers)

```typescript
async function walmartAdsRequest(method: string, path: string, body?: object) {
  const response = await fetch(`https://developer.api.walmart.com/api-proxy/service/wpa/api/v1${path}`, {
    method,
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.WALMART_CLIENT_ID}:${process.env.WALMART_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type':  'application/json',
      'WM_SVC.NAME':   'Walmart Ads API',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}
```

## Best Practices

- **Separate auto and manual campaigns** — auto campaigns discover keywords; manual campaigns scale the winners with controlled bids
- **Harvest weekly, not daily** — weekly harvesting gives enough data per query to make statistically valid bid decisions
- **Pause keywords with high spend and zero sales** — set a spend threshold (e.g., $20 with 0 sales) as an automatic pause trigger
- **Use campaign-level negative keywords aggressively** — search terms containing "free", "diy", "how to", and competitor brand names rarely convert; add them as negatives at launch
- **Monitor Share of Voice** — use the Amazon Search Term Impression Share report to see what percentage of auctions you are winning for your top keywords
- **Align ACOS targets with product margins** — a 30% ACOS target only makes sense if your gross margin is above 50%; recalculate for each product group
- **Run Sponsored Brands and Sponsored Display alongside Sponsored Products** — full-funnel coverage with all three formats typically reduces ACOS by 10–15% vs. Sponsored Products alone

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Auto campaign spending entire budget on irrelevant queries | Add a comprehensive negative keyword list before launch; review search term reports within 48 hours of launch |
| Bid changes not reflecting immediately | Amazon Ads API has propagation delays of up to 4 hours; do not make the same change twice |
| ACOS calculation wrong | Amazon reports ACOS as (spend / attributed sales); verify attributed sales window matches your expectation (7-day vs 14-day) |
| Manual campaign cannibalizing auto campaign | Use negative exact keywords in auto when graduating terms to manual — prevents both campaigns from competing in the same auction |
| Rate limiting on API | Implement exponential backoff; Amazon Ads API has strict rate limits per endpoint (typically 5 req/sec) |

## Related Skills

- @google-shopping-feed
- @google-ads-ecommerce
- @marketing-attribution-dashboard
- @multi-channel-selling
- @pricing-promotions
