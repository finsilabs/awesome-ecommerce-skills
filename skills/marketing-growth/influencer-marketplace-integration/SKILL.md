---
name: influencer-marketplace-integration
description: "Connect to influencer networks to discover creators, manage campaign briefs, track deliverables, and measure ROI across Instagram, TikTok, and YouTube"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [influencer, creator-economy, partnerships]
triggers: ["find influencers", "manage influencer campaigns"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Influencer Marketplace Integration

## Overview

Influencer marketing drives discovery and purchase intent at scale, especially for lifestyle products. Rather than managing influencer relationships in spreadsheets, integrating with an influencer marketplace API (Aspire, Creator.co, Grin, or custom-built) enables automated discovery, brief distribution, deliverable tracking, affiliate link generation, and ROI measurement in one system. This skill covers marketplace API integration, campaign lifecycle management, performance tracking, and building your own lightweight influencer CRM.

## When to Use This Skill

- When managing more than 10 active influencer partnerships at once
- When influencer ROI is unmeasured or attribution is anecdotal
- When building a self-service affiliate portal for creator applications
- When needing to issue unique tracking links and discount codes at scale
- When transitioning from agency-managed influencer campaigns to in-house management

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, influencer platform account (AspireIQ, GRIN, or LTK), social platform API credentials

## Core Instructions

### 1. Influencer data model

```typescript
interface InfluencerProfile {
  id:           string;
  handle:       Record<'instagram' | 'tiktok' | 'youtube', string | undefined>;
  email:        string;
  niche:        string[];    // e.g., ['fashion', 'beauty', 'lifestyle']
  tier:         'nano' | 'micro' | 'macro' | 'mega';  // based on follower count
  metrics: {
    instagram?: { followers: number; engagementRate: number; avgViews: number };
    tiktok?:    { followers: number; engagementRate: number; avgViews: number };
    youtube?:   { subscribers: number; avgViews: number };
  };
  demographics: { topCountry: string; ageRange: string; genderSplit: Record<string, number> };
  status:       'prospect' | 'contacted' | 'active' | 'paused' | 'blacklisted';
  tags:         string[];
  notes:        string;
}

// Tier classification
function classifyInfluencerTier(totalFollowers: number): InfluencerProfile['tier'] {
  if (totalFollowers < 10_000)  return 'nano';
  if (totalFollowers < 100_000) return 'micro';
  if (totalFollowers < 1_000_000) return 'macro';
  return 'mega';
}
```

### 2. Aspire (formerly AspireIQ) API integration

```typescript
const ASPIRE_API_BASE = 'https://api.aspire.io/v1';

async function aspireRequest(method: string, path: string, body?: object) {
  const response = await fetch(`${ASPIRE_API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.ASPIRE_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Aspire API error: ${response.status}`);
  return response.json();
}

// Search for influencers matching criteria
async function searchInfluencers(params: {
  niche:        string[];
  minFollowers: number;
  maxFollowers: number;
  minEngagement: number;  // e.g., 0.03 = 3%
  platform:     'instagram' | 'tiktok' | 'youtube';
  country?:     string;
}) {
  return aspireRequest('GET', '/influencers/search', {
    filters: {
      categories:         params.niche,
      platforms:          [params.platform],
      follower_count:     { min: params.minFollowers, max: params.maxFollowers },
      engagement_rate:    { min: params.minEngagement },
      audience_countries: params.country ? [params.country] : undefined,
    },
    limit: 50,
  });
}
```

### 3. Campaign and brief management

```typescript
interface InfluencerCampaign {
  id:           string;
  name:         string;
  objective:    'awareness' | 'conversion' | 'ugc';
  brief:        CampaignBrief;
  budget:       number;
  startDate:    Date;
  endDate:      Date;
  participants: CampaignParticipant[];
  status:       'draft' | 'active' | 'completed';
}

interface CampaignBrief {
  productIds:     string[];
  keyMessages:    string[];
  mandatoryTags:  string[];
  forbiddenContent: string[];
  postRequirements: {
    platform:    string;
    format:      'feed-post' | 'story' | 'reel' | 'video' | 'youtube-integration';
    minDuration?: number;  // seconds, for video
    caption:     string;   // template with [brand name] placeholders
  }[];
  compensationType: 'gifting' | 'flat-fee' | 'commission' | 'hybrid';
  compensation:     number;
  commissionRate?:  number;
}

async function createCampaign(campaign: Omit<InfluencerCampaign, 'id'>) {
  const dbCampaign = await db.influencerCampaigns.create(campaign);

  // Create the campaign in Aspire for managed outreach
  const aspireCampaign = await aspireRequest('POST', '/campaigns', {
    name:       campaign.name,
    start_date: campaign.startDate.toISOString(),
    end_date:   campaign.endDate.toISOString(),
    brief:      campaign.brief,
  });

  await db.influencerCampaigns.update(dbCampaign.id, { aspireId: aspireCampaign.id });
  return dbCampaign;
}
```

### 4. Unique tracking links and discount codes

Issue each influencer a unique UTM link and discount code for attribution:

```typescript
async function onboardInfluencerToCampaign(influencerId: string, campaignId: string) {
  const [influencer, campaign] = await Promise.all([
    db.influencers.findById(influencerId),
    db.influencerCampaigns.findById(campaignId),
  ]);

  // Generate unique tracking link
  const utmParams = new URLSearchParams({
    utm_source:   'influencer',
    utm_medium:   'social',
    utm_campaign: campaign.name.toLowerCase().replace(/\s/g, '-'),
    utm_content:  influencer.handle.instagram ?? influencer.id,
  });
  const trackingLink = `${process.env.STORE_URL}?${utmParams}`;

  // Optionally use a link shortener for cleaner URLs
  const shortLink = await createShortLink(trackingLink, `${campaign.id}-${influencer.id}`);

  // Generate a unique discount code
  const discountCode = `${influencer.handle.instagram?.toUpperCase() ?? influencer.id.slice(0, 6)}15`;
  await createUniqueDiscount({
    code:           discountCode,
    type:           'percent_off',
    value:          15,
    influencerId:   influencer.id,
    campaignId:     campaign.id,
    expiresAt:      campaign.endDate,
    usageLimit:     null,  // unlimited uses (trackable via code)
  });

  // Create participant record
  await db.campaignParticipants.create({
    influencerId,
    campaignId,
    trackingLink: shortLink,
    discountCode,
    status: 'briefed',
    compensationDue: campaign.brief.compensation,
  });

  // Send brief email
  await sendInfluencerBriefEmail(influencer.email, { campaign, trackingLink: shortLink, discountCode });
}
```

### 5. Deliverable tracking and approval

```typescript
interface CampaignDeliverable {
  id:           string;
  participantId: string;
  platform:     string;
  postUrl:      string;
  postedAt:     Date;
  status:       'submitted' | 'approved' | 'revision-requested' | 'rejected';
  metrics?: {
    views:    number;
    likes:    number;
    comments: number;
    shares:   number;
    clicks:   number;   // tracked via UTM link clicks
    orders:   number;   // from discount code usage
    revenue:  number;
  };
}

async function submitDeliverable(participantId: string, postUrl: string) {
  const deliverable = await db.campaignDeliverables.create({
    participantId,
    postUrl,
    postedAt: new Date(),
    status: 'submitted',
  });

  // Auto-fetch initial metrics from social API
  await refreshDeliverableMetrics(deliverable.id);

  // Notify campaign manager for review
  await notifyCampaignManager(deliverable);
  return deliverable;
}

async function refreshDeliverableMetrics(deliverableId: string) {
  const deliverable = await db.campaignDeliverables.findById(deliverableId);
  const participant  = await db.campaignParticipants.findById(deliverable.participantId);

  const socialMetrics = await fetchPostMetrics(deliverable.platform, deliverable.postUrl);
  const commerceMetrics = {
    clicks: await db.utmClicks.countByDiscountCode(participant.discountCode, { since: deliverable.postedAt }),
    orders: await db.orders.countByDiscountCode(participant.discountCode, { since: deliverable.postedAt }),
    revenue: await db.orders.sumByDiscountCode(participant.discountCode, { since: deliverable.postedAt }),
  };

  await db.campaignDeliverables.update(deliverableId, {
    metrics: { ...socialMetrics, ...commerceMetrics },
  });
}
```

### 6. ROI measurement

```typescript
async function getCampaignROI(campaignId: string) {
  const participants = await db.campaignParticipants.findByCampaign(campaignId);
  const deliverables = await db.campaignDeliverables.findByCampaign(campaignId);

  const totalSpend = participants.reduce((sum, p) => sum + p.compensationPaid, 0);
  const totalRevenue = deliverables.reduce((sum, d) => sum + (d.metrics?.revenue ?? 0), 0);
  const totalOrders  = deliverables.reduce((sum, d) => sum + (d.metrics?.orders ?? 0), 0);

  return {
    totalSpend,
    totalRevenue,
    roas:         totalRevenue / totalSpend,
    cpo:          totalSpend / totalOrders,
    topPerformers: participants
      .map(p => ({ handle: p.influencer.handle, revenue: p.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  };
}
```

## Best Practices

- **Prioritize micro-influencers (10k–100k) for ecommerce** — they typically achieve 3–5x higher engagement rates and conversion rates than mega-influencers
- **Always use unique discount codes per creator** — UTM links can be lost in link-in-bio click chains; discount codes provide the most reliable attribution
- **Build an evergreen affiliate program alongside campaign work** — always-on commission-based partnerships scale without per-campaign budgeting
- **Review content before it goes live when possible** — for sponsored posts, require draft approval; for organic Spark Ads, this is less critical
- **Establish FTC compliance in the brief** — require #ad or #sponsored disclosure in all posts; non-disclosure is a legal risk
- **Refresh top-performing influencer content as paid ads** — repurpose organic posts that hit benchmarks as Spark Ads or Facebook/Instagram paid content
- **Set benchmark KPIs before campaigns start** — define minimum acceptable CPV, engagement rate, and ROAS; use these to gate payment

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Influencer posts but never submits the link | Build a submission portal; make payment contingent on verified deliverable submission |
| Attribution lost because influencer changed the UTM link | Use short links that redirect to UTM URLs; the redirect is under your control |
| Paying for reach but getting no conversions | Audit fake follower rates before contracting; use tools like HypeAuditor or Modash to check audience quality |
| Influencer posts branded content that violates FTC rules | Include explicit disclosure requirements in the contract; non-compliance voids the payment term |
| Campaign budget overspent on low performers | Set a conversion performance clause — partial payment on delivery, full payment after hitting minimum orders |

## Related Skills

- @ugc-campaign-management
- @affiliate-program
- @tiktok-ads-integration
- @referral-viral-loops
- @marketing-attribution-dashboard
