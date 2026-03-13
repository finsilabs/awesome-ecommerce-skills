---
name: product-launch-campaigns
description: "Plan and execute multi-channel product launches with pre-launch waitlists, early access for VIPs, launch day orchestration, and post-launch momentum"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [product-launch, campaigns, go-to-market]
triggers: ["launch new product", "product launch campaign"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Launch Campaigns

## Overview

A successful product launch orchestrates multiple channels — email, SMS, paid social, influencer seeding, and organic content — into a coordinated sequence that builds anticipation, converts pre-launch interest into day-one sales, and sustains momentum in the weeks following. The difference between a flat launch and a sellout launch is rarely the product itself; it is the pre-launch waitlist size, VIP early access timing, and the velocity of day-one reviews and social proof.

## When to Use This Skill

- When launching a new product and needing a structured multi-channel campaign plan
- When previous product launches were underwhelming and lacked pre-launch buildup
- When building a waitlist/early-access mechanic for product scarcity and demand signaling
- When needing to coordinate influencer seeding, email sequences, and paid ads into a single launch timeline
- When wanting to measure the incremental revenue lift of launch campaigns vs. organic listings

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, email service provider (Klaviyo or similar), waitlist/pre-order mechanism, social ad platform accounts

## Core Instructions

### 1. Launch campaign timeline structure

Plan in three phases:

```
Phase 1: Pre-Launch (T-21 to T-1)
  T-21: Teaser email to full list (mystery, no product reveal)
  T-14: Reveal email — product images + early access waitlist CTA
  T-14: Influencer seeding packages shipped
  T-7:  "Meet the product" email with features/benefits + waitlist urgency
  T-7:  TikTok + Instagram teaser content goes live
  T-3:  Paid social retargeting begins (audiences: email list + web visitors)
  T-1:  "Tomorrow is the day" email to waitlist + VIPs
  T-1:  SMS alert to SMS list about launch timing

Phase 2: Launch Day (T-0)
  T-0 8am: VIP early access email (24h before public)
  T-0 8am: Unlock early access page for loyalty tier Platinum/Gold
  T+24h:   Public launch email to full list
  T+24h:   Social posts go live across all channels
  T+24h:   Paid social campaigns go broad (top-of-funnel awareness)
  T+24h:   Influencer content embargo lifts

Phase 3: Post-Launch (T+1 to T+30)
  T+3:  First buyer reviews start appearing (request on delivery)
  T+7:  "Sold X units in first week" social proof email
  T+14: Paid social retargeting to video viewers and page visitors
  T+21: Review compilation UGC gallery published
  T+30: Post-launch retrospective metrics review
```

### 2. Waitlist implementation

```typescript
interface WaitlistEntry {
  id:          string;
  email:       string;
  productId:   string;
  source:      'email' | 'social' | 'organic' | 'paid';
  joinedAt:    Date;
  notifiedAt?: Date;
  convertedAt?: Date;
  earlyAccess: boolean;
}

async function joinWaitlist(params: {
  email:     string;
  productId: string;
  source:    WaitlistEntry['source'];
  phone?:    string;
}) {
  const existing = await db.waitlist.findOne({ where: { email: params.email, productId: params.productId } });
  if (existing) return { alreadyJoined: true, position: existing.position };

  const count = await db.waitlist.count({ where: { productId: params.productId } });

  const entry = await db.waitlist.create({
    email:       params.email,
    productId:   params.productId,
    source:      params.source,
    joinedAt:    new Date(),
    earlyAccess: false,
    position:    count + 1,
  });

  // Confirmation email
  await sendEmail(params.email, 'waitlist-confirmation', {
    position:    entry.position,
    productName: (await db.products.findById(params.productId)).name,
    earlyAccessNote: 'VIP members get 24h early access',
  });

  return { alreadyJoined: false, position: entry.position };
}

// Mark top-tier loyalty members for early access
async function grantEarlyAccess(productId: string) {
  const vipCustomers = await db.customers.findAll({
    where: { loyaltyTier: { in: ['Gold', 'Platinum'] } },
  });

  for (const customer of vipCustomers) {
    await db.waitlist.upsert(
      { email: customer.email, productId },
      { earlyAccess: true, earlyAccessGrantedAt: new Date() }
    );
  }

  // Send early access email to VIPs (24h before public launch)
  await sendBatchEmail(vipCustomers.map(c => c.email), 'early-access', {
    productId,
    accessEndsAt: addHours(new Date(), 24),
  });
}
```

### 3. Launch day email sequence

```typescript
async function scheduleLaunchEmails(productId: string, launchDate: Date) {
  const product = await db.products.findById(productId);

  // VIP early access — 24h before public
  await emailQueue.add('send-launch-email', {
    segment:   'vip-early-access',
    template:  'launch-early-access',
    productId,
    subject:   `[Early Access] ${product.name} is yours — 24 hours before everyone else`,
  }, { delay: launchDate.getTime() - Date.now() - 24 * 3600000 });

  // Public launch — on launch date at 8am local
  await emailQueue.add('send-launch-email', {
    segment:   'full-list',
    template:  'launch-public',
    productId,
    subject:   `Introducing ${product.name} — available now`,
  }, { delay: launchDate.getTime() - Date.now() });

  // Waitlist non-converters — 72h post-launch with urgency
  await emailQueue.add('send-launch-email', {
    segment:   'waitlist-non-converters',
    template:  'launch-urgency',
    productId,
    subject:   `${product.name} — don't miss out`,
  }, { delay: launchDate.getTime() - Date.now() + 72 * 3600000 });
}
```

### 4. Paid social campaign coordination

Pre-build campaigns in Meta and TikTok Ads Manager so they can be activated instantly:

```typescript
const LAUNCH_CAMPAIGN_SCHEDULE = {
  // Pre-launch retargeting: site visitors + email list (Facebook Custom Audience)
  preLaunchRetargeting: {
    startOffset: -3 * 86400,  // T-3 days
    budgetPerDay: 50,
    audience: 'email-list-and-web-visitors',
    creative: 'teaser-video',
  },
  // Launch day broad awareness
  launchDayProspecting: {
    startOffset: 0,
    budgetPerDay: 200,
    audience: 'lookalike-purchasers-1pct',
    creative: 'launch-video',
  },
  // Post-launch DPA retargeting — show product to page viewers
  postLaunchDpa: {
    startOffset: 1 * 86400,
    budgetPerDay: 100,
    audience: 'product-page-viewers',
    creative: 'dynamic-product-ad',
  },
};

async function activateLaunchCampaigns(productId: string, launchTimestamp: number) {
  for (const [name, config] of Object.entries(LAUNCH_CAMPAIGN_SCHEDULE)) {
    const activateAt = launchTimestamp + config.startOffset * 1000;
    const delayMs    = activateAt - Date.now();

    await campaignScheduleQueue.add('activate-ad-campaign', {
      campaignName: `${productId}-${name}`,
      budgetPerDay: config.budgetPerDay,
    }, { delay: Math.max(0, delayMs) });
  }
}
```

### 5. Launch analytics

```typescript
async function getLaunchMetrics(productId: string, launchDate: Date) {
  const [waitlistSize, day1Revenue, day7Revenue, influencerRevenue, reviews30d] = await Promise.all([
    db.waitlist.count({ where: { productId } }),
    db.orderLineItems.sumRevenue({ productId, createdAt: { gte: launchDate, lt: addDays(launchDate, 1) } }),
    db.orderLineItems.sumRevenue({ productId, createdAt: { gte: launchDate, lt: addDays(launchDate, 7) } }),
    db.orders.sumBySource({ productId, utmSource: 'influencer', since: launchDate }),
    db.productReviews.count({ where: { productId, createdAt: { gte: launchDate, lt: addDays(launchDate, 30) } } }),
  ]);

  return { waitlistSize, day1Revenue, day7Revenue, influencerRevenue, reviews30d };
}
```

## Best Practices

- **Build the waitlist at least 2 weeks before launch** — 2,000+ waitlist signups on launch day creates measurable velocity; below 500 makes it hard to generate momentum
- **Seed influencers 3–4 weeks before launch** — content takes time to produce; seeding too late means influencer posts go live after the launch window
- **Lift the VIP early access embargo 24 hours before public** — this is the sweet spot; too early dilutes the public launch; same day creates no VIP benefit
- **Gate early access on loyalty tier, not manual list** — this scales automatically and rewards your most valuable customers without manual work
- **Post UGC from early access customers on launch day** — real customer photos posted by the brand (with permission) on launch day dramatically boost credibility
- **Have an inventory buffer plan** — if launch velocity exceeds forecasts, have a "back-order" mechanism ready rather than showing "sold out" with no action path

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Waitlist emails going to promotions folder | Warm up the sending domain 2 weeks before; use a plain-text template for the launch email |
| Influencer content going live before the embargo lifts | Include embargo date in every influencer brief; add a reminder the week before launch |
| Launch day email server throttling | Use your ESP's dedicated IP and schedule the send during off-peak hours (6–8am); stagger large lists |
| VIP early access page accessible without authentication | Gate the early access page with a signed JWT token sent in the email link, not just a hidden URL |
| Post-launch reviews are all 4-5 star and look suspicious | Stagger review request timing to avoid all reviews landing on the same day |

## Related Skills

- @email-marketing-automation
- @loyalty-program-optimization
- @influencer-marketplace-integration
- @meta-ads-integration
- @seasonal-campaign-automation
