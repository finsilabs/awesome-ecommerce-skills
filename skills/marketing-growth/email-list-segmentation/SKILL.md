---
name: email-list-segmentation
description: "Create dynamic email segments based on purchase behavior, RFM scores, engagement signals, and lifecycle stage with automated rebalancing and list hygiene"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [email, segmentation, personalization]
triggers: ["segment email list", "create email segments"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Email List Segmentation

## Overview

Sending the same email to your entire list is one of the most expensive mistakes in ecommerce marketing. ISPs throttle senders with low engagement, unsubscribe rates spike for irrelevant content, and you leave revenue on the table by treating a VIP customer identically to someone who has never purchased. Proper segmentation — combining RFM (Recency, Frequency, Monetary) analysis with behavioral and engagement scoring — delivers 2–4× higher revenue per email and protects deliverability. This skill covers building a segmentation pipeline, computing RFM scores, defining behavioral segments, syncing to ESP providers, and routing campaigns to the right audience.

## When to Use This Skill

- When email open rates drop below 20% and you suspect low engagement dragging deliverability
- When you want to migrate from blast-and-pray sends to targeted campaign logic
- When building a suppression system to protect high-value subscribers from over-messaging
- When setting up Klaviyo, Brevo, or custom ESP flows that need audience conditions
- When launching a win-back program and need to identify the "at-risk" vs. "lapsed" cohort
- When analyzing email revenue and needing to attribute performance to specific segments

## Core Instructions

### 1. Core data model

```typescript
interface SubscriberProfile {
  email: string;
  customerId?: string;

  // RFM fields
  lastOrderDate?: Date;
  orderCount: number;
  totalRevenue: number;
  avgOrderValue: number;

  // Engagement
  lastOpenDate?: Date;
  lastClickDate?: Date;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;    // computed: totalOpened / totalSent
  clickRate: number;   // computed: totalClicked / totalSent

  // Segments (computed labels)
  rfmSegment: RfmSegment;
  engagementTier: 'champion' | 'active' | 'at-risk' | 'dormant' | 'unengaged';
  tags: string[];

  // Consent / compliance
  subscribedAt: Date;
  unsubscribedAt?: Date;
  marketingConsent: boolean;
  gdprLawfulBasis?: 'consent' | 'legitimate-interest';
  source: string;  // 'checkout', 'popup', 'import', etc.
}

type RfmSegment =
  | 'champions'        // high R, high F, high M
  | 'loyal'            // high F, high M
  | 'potential-loyal'  // recent, medium F
  | 'new-customers'    // very recent, low F
  | 'at-risk'          // high M but declining R
  | 'cant-lose'        // previously high value, long since ordered
  | 'hibernating'      // low R, low F, low M
  | 'lost';            // very low R, very low F
```

### 2. RFM scoring pipeline

```typescript
async function computeRfmSegments() {
  const subscribers = await db.subscribers.findAll({
    where: { marketingConsent: true, unsubscribedAt: null },
    include: ['orders'],
  });

  const now = new Date();

  const scored = subscribers.map(sub => {
    const orders = sub.orders.filter((o: any) => o.status === 'completed');
    const lastOrder = orders.sort((a: any, b: any) => b.createdAt - a.createdAt)[0];
    const daysSinceOrder = lastOrder
      ? Math.floor((now.getTime() - new Date(lastOrder.createdAt).getTime()) / 86400000)
      : 999;
    const frequency = orders.length;
    const monetary  = orders.reduce((sum: number, o: any) => sum + o.total, 0);

    // Score 1–5 for each dimension using quintile breakpoints
    return { ...sub, daysSinceOrder, frequency, monetary };
  });

  // Compute quintile breakpoints
  const rBreakpoints = quintiles(scored.map(s => s.daysSinceOrder).filter(d => d < 999));
  const fBreakpoints = quintiles(scored.map(s => s.frequency));
  const mBreakpoints = quintiles(scored.map(s => s.monetary).filter(m => m > 0));

  const rfmScored = scored.map(sub => {
    const r = scoreQuintile(sub.daysSinceOrder, rBreakpoints, true);  // invert: lower days = higher score
    const f = scoreQuintile(sub.frequency, fBreakpoints, false);
    const m = scoreQuintile(sub.monetary, mBreakpoints, false);
    const rfmCode = `${r}${f}${m}`;
    const rfmSegment = classifyRfm(r, f, m);

    return { email: sub.email, r, f, m, rfmCode, rfmSegment };
  });

  // Bulk upsert
  await db.subscriberProfiles.bulkCreate(rfmScored, {
    updateOnDuplicate: ['r', 'f', 'm', 'rfmCode', 'rfmSegment', 'updatedAt'],
  });
}

function classifyRfm(r: number, f: number, m: number): RfmSegment {
  if (r >= 4 && f >= 4 && m >= 4) return 'champions';
  if (f >= 4 && m >= 4)           return 'loyal';
  if (r >= 4 && f <= 2)           return 'new-customers';
  if (r >= 3 && f >= 2)           return 'potential-loyal';
  if (r <= 2 && m >= 3)           return 'cant-lose';
  if (r <= 2 && f >= 3)           return 'at-risk';
  if (r <= 2 && f <= 2 && m <= 2) return 'hibernating';
  return 'lost';
}

function quintiles(values: number[]): [number, number, number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const p = (pct: number) => sorted[Math.floor(sorted.length * pct)];
  return [p(0.2), p(0.4), p(0.6), p(0.8)];
}

function scoreQuintile(value: number, breakpoints: [number, number, number, number], invert: boolean): number {
  const [q1, q2, q3, q4] = breakpoints;
  let score = value <= q1 ? 1 : value <= q2 ? 2 : value <= q3 ? 3 : value <= q4 ? 4 : 5;
  return invert ? 6 - score : score;
}
```

### 3. Engagement tier classification

```typescript
function computeEngagementTier(profile: SubscriberProfile): SubscriberProfile['engagementTier'] {
  const now = new Date();
  const daysSinceOpen  = profile.lastOpenDate
    ? Math.floor((now.getTime() - profile.lastOpenDate.getTime()) / 86400000)
    : 999;
  const daysSinceClick = profile.lastClickDate
    ? Math.floor((now.getTime() - profile.lastClickDate.getTime()) / 86400000)
    : 999;

  if (profile.openRate > 0.3 && daysSinceClick < 60)  return 'champion';
  if (profile.openRate > 0.15 && daysSinceOpen < 90)  return 'active';
  if (daysSinceOpen >= 90 && daysSinceOpen < 180)     return 'at-risk';
  if (daysSinceOpen >= 180 && daysSinceOpen < 365)    return 'dormant';
  return 'unengaged';
}
```

### 4. Behavioral tags

```typescript
const BEHAVIORAL_TAGS = {
  'category-apparel':      (p: SubscriberProfile) => p.topCategory === 'apparel',
  'high-aov':              (p: SubscriberProfile) => p.avgOrderValue > 150,
  'frequent-buyer':        (p: SubscriberProfile) => p.orderCount >= 5,
  'sale-shopper':          (p: SubscriberProfile) => p.discountUsageRate > 0.5,
  'abandoned-cart-recent': (p: SubscriberProfile) => p.lastAbandonmentDate && daysSince(p.lastAbandonmentDate) < 30,
  'review-submitter':      (p: SubscriberProfile) => p.reviewCount > 0,
  'mobile-opener':         (p: SubscriberProfile) => p.mobileOpenRate > 0.7,
  'new-subscriber-30d':    (p: SubscriberProfile) => daysSince(p.subscribedAt) < 30,
};

async function applyBehavioralTags(profile: SubscriberProfile): Promise<string[]> {
  const tags: string[] = [];
  for (const [tag, condition] of Object.entries(BEHAVIORAL_TAGS)) {
    if (condition(profile)) tags.push(tag);
  }
  return tags;
}
```

### 5. Segment query builder for campaigns

```typescript
interface SegmentCriteria {
  rfmSegments?: RfmSegment[];
  engagementTiers?: string[];
  tags?: string[];
  minRevenue?: number;
  maxRevenue?: number;
  subscribedAfter?: Date;
  subscribedBefore?: Date;
  hasOrdered?: boolean;
  lastOrderBefore?: Date;
  lastOrderAfter?: Date;
  excludeSegments?: RfmSegment[];
}

async function querySegment(criteria: SegmentCriteria): Promise<string[]> {
  const where: any = { marketingConsent: true, unsubscribedAt: null };

  if (criteria.rfmSegments?.length)     where.rfmSegment     = { in: criteria.rfmSegments };
  if (criteria.engagementTiers?.length) where.engagementTier = { in: criteria.engagementTiers };
  if (criteria.minRevenue !== undefined) where.totalRevenue   = { gte: criteria.minRevenue };
  if (criteria.maxRevenue !== undefined) where.totalRevenue   = { ...where.totalRevenue, lte: criteria.maxRevenue };
  if (criteria.hasOrdered !== undefined) where.orderCount     = criteria.hasOrdered ? { gt: 0 } : { eq: 0 };
  if (criteria.lastOrderBefore)         where.lastOrderDate   = { lt: criteria.lastOrderBefore };
  if (criteria.lastOrderAfter)          where.lastOrderDate   = { ...where.lastOrderDate, gte: criteria.lastOrderAfter };
  if (criteria.excludeSegments?.length) where.rfmSegment      = { ...where.rfmSegment, notIn: criteria.excludeSegments };

  if (criteria.tags?.length) {
    where[Op.and] = criteria.tags.map(tag => db.literal(`tags @> ARRAY['${tag}']::text[]`));
  }

  const rows = await db.subscriberProfiles.findAll({ where, attributes: ['email'] });
  return rows.map(r => r.email);
}
```

### 6. Sync segments to Klaviyo

```typescript
import Klaviyo from 'klaviyo-api';

async function syncSegmentToKlaviyo(segmentName: string, emails: string[]) {
  const klaviyo = new Klaviyo({ apiKey: process.env.KLAVIYO_PRIVATE_KEY! });

  // Batch in groups of 1000 (API limit)
  const batches = chunk(emails, 1000);

  for (const batch of batches) {
    await klaviyo.profiles.subscribeProfiles({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: batch.map(email => ({
              type: 'profile',
              attributes: { email, properties: { segment: segmentName } },
            })),
          },
        },
      },
    });
  }
}

// Sync all segments nightly
async function syncAllSegments() {
  const segmentMap: Record<string, SegmentCriteria> = {
    'Champions':      { rfmSegments: ['champions'], engagementTiers: ['champion', 'active'] },
    'Win-Back-Targets': { rfmSegments: ['at-risk', 'cant-lose'], lastOrderBefore: daysAgo(90) },
    'VIP-Subscribers':  { minRevenue: 500, engagementTiers: ['champion', 'active'] },
    'Sale-Shoppers':    { tags: ['sale-shopper'], engagementTiers: ['active'] },
    'New-30-Days':      { subscribedAfter: daysAgo(30), hasOrdered: false },
  };

  for (const [name, criteria] of Object.entries(segmentMap)) {
    const emails = await querySegment(criteria);
    await syncSegmentToKlaviyo(name, emails);
  }
}
```

### 7. Suppression lists to protect deliverability

```typescript
async function buildSuppressionList(): Promise<string[]> {
  const suppressed = await db.subscriberProfiles.findAll({
    where: {
      [Op.or]: [
        { engagementTier: 'unengaged', totalSent: { gte: 5 } },
        { bounced: true },
        { spamComplaint: true },
        { unsubscribedAt: { ne: null } },
      ],
    },
    attributes: ['email'],
  });

  return suppressed.map(r => r.email);
}
```

## Best Practices

- **Recompute scores nightly**: RFM and engagement tiers should be refreshed at least daily; stale segments cause mis-targeting
- **Start with 5 segments, not 50**: champion, active, at-risk, dormant, unengaged is enough to see 80% of the benefit
- **Suppress before you send**: always build a suppression list and deduplicate against it before any campaign deploy
- **Protect champions**: never include your champions segment in sales/discount campaigns unless you want to train VIPs to wait for promotions
- **Engagement tier > RFM for deliverability decisions**: for inbox placement, behavioral engagement signals matter more than purchase history
- **EU compliance**: for GDPR-covered contacts, track the lawful basis separately and never rely on `legitimate-interest` for marketing emails — use `consent`
- **Unsubscribe immediately**: process ESP unsubscribe webhooks within seconds; do not wait for nightly sync
- **Minimum list size for campaigns**: avoid sending to segments under 200 contacts — small, highly targeted sends can trigger spam filters on some ESPs

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| RFM skewed by a few whale customers | Use quintile-based scoring, not absolute thresholds |
| Engagement drops after adding segmentation | Ensure segments are correctly excluding unsubscribed contacts |
| Klaviyo lists go out of sync | Run sync nightly AND on key events (order placed, opt-out) |
| Over-segmentation causes analysis paralysis | Start with 5–7 segments; add more only when you have campaigns ready for each |
| Champions segment shrinks after every send | You are emailing them too frequently — apply frequency caps |
| GDPR violations from imported list | Validate lawful basis for all contacts before import; reject contacts without consent record |
| Wrong currency in revenue-based segments | Normalize all monetary values to a single base currency before computing M score |

## Testing and Validation

### Integration checklist

- [ ] RFM job completes in under 5 minutes for 100k subscriber list
- [ ] Segment sizes are logged and alerted on if they drop more than 20% vs. prior day
- [ ] Unsubscribe events processed via webhook within 60 seconds
- [ ] No unsubscribed email appears in any active segment query
- [ ] Klaviyo sync shows correct profile counts in list management view
- [ ] Engagement tier distribution is logged (unengaged should be under 30% of total list)

### KPIs

- **Revenue per email (RPE)** by segment — champions should be 5–10× lapsed
- **Unsubscribe rate** per segment — above 0.5% per send signals over-messaging or irrelevant content
- **Open rate** by engagement tier — active tier should be 2× the list average
- **List health score**: percentage of contacts in active/champion tiers (target: 50%+)

## Related Skills

- @email-marketing-automation
- @win-back-reactivation
- @lifecycle-marketing-automation
- @customer-retention-engine
- @first-party-data-collection
