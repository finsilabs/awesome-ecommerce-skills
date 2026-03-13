---
name: seasonal-campaign-automation
description: "Automate seasonal marketing campaigns for Black Friday, holidays, and shopping events with templated workflows, countdown sequences, and year-round planning"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [seasonal, black-friday, holiday-marketing]
triggers: ["plan seasonal campaigns", "Black Friday campaign"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Seasonal Campaign Automation

## Overview

Seasonal peaks — Black Friday/Cyber Monday, holiday gifting, Valentine's Day, Back-to-School — can account for 30–50% of annual ecommerce revenue for many categories. Automating seasonal campaigns means building reusable templates and scheduling frameworks that activate on calendar triggers rather than requiring manual setup each time. This skill covers defining the seasonal calendar, building templated campaign workflows, automating email and SMS countdown sequences, managing promotional inventory, and measuring seasonal lift.

## When to Use This Skill

- When planning Black Friday/Cyber Monday campaigns and needing a structured playbook
- When seasonal campaigns are built from scratch every year with no reusable templates
- When wanting to automate countdown email sequences for a sale event
- When needing to schedule promotional pricing changes in sync with email and ad campaigns
- When measuring whether seasonal revenue is truly incremental vs. pulled-forward demand

## Core Instructions

### 1. Define the seasonal campaign calendar

```typescript
interface SeasonalCampaign {
  id:          string;
  name:        string;
  type:        'sale' | 'launch' | 'gifting' | 'awareness';
  startDate:   Date;
  endDate:     Date;
  discountType: 'percent_off' | 'fixed_amount' | 'free_shipping' | 'bogo';
  discountValue: number;
  segments:    string[];   // which customer segments to target
  channels:    ('email' | 'sms' | 'push' | 'paid-social')[];
  cadence:     SeasonalEmailStep[];
  status:      'planned' | 'active' | 'completed' | 'paused';
}

interface SeasonalEmailStep {
  offsetDays:   number;   // days before (-) or after (+) campaign start
  template:     string;
  subject:      string;
  segment?:     string;   // override default segment for this step
  incentive:    boolean;  // include discount code in this step
}

// Example BFCM campaign definition
const BFCM_2026: SeasonalCampaign = {
  id:            'bfcm-2026',
  name:          'Black Friday / Cyber Monday 2026',
  type:          'sale',
  startDate:     new Date('2026-11-27T00:00:00-05:00'),  // Black Friday EST
  endDate:       new Date('2026-11-30T23:59:59-05:00'),  // Cyber Monday
  discountType:  'percent_off',
  discountValue: 25,
  segments:      ['all-subscribers', 'active-customers', 'lapsed-customers'],
  channels:      ['email', 'sms', 'push', 'paid-social'],
  cadence: [
    { offsetDays: -21, template: 'seasonal-teaser',    subject: 'Something big is coming…',                 incentive: false },
    { offsetDays: -14, template: 'seasonal-preview',   subject: 'Early access preview — save the date',     incentive: false },
    { offsetDays: -7,  template: 'seasonal-earlybird', subject: 'Early access for VIPs — shop 25% off now', incentive: true, segment: 'vip-members' },
    { offsetDays: -3,  template: 'seasonal-countdown', subject: '3 days until Black Friday',                incentive: false },
    { offsetDays: -1,  template: 'seasonal-eve',       subject: 'Tomorrow: our biggest sale of the year',   incentive: false },
    { offsetDays: 0,   template: 'seasonal-launch',    subject: '25% off everything — Black Friday is live', incentive: true },
    { offsetDays: 1,   template: 'seasonal-weekend',   subject: 'Sale extended through Cyber Monday',        incentive: true },
    { offsetDays: 3,   template: 'seasonal-lastchance', subject: 'Last chance: Cyber Monday sale ends tonight', incentive: true },
  ],
  status: 'planned',
};
```

### 2. Campaign scheduler and email sequencer

```typescript
async function scheduleCampaignEmails(campaign: SeasonalCampaign) {
  const existingJobs = await db.campaignJobs.findAll({ where: { campaignId: campaign.id } });
  if (existingJobs.length > 0) {
    console.log(`Campaign ${campaign.id} already scheduled — skipping`);
    return;
  }

  for (const step of campaign.cadence) {
    const sendAt = addDays(campaign.startDate, step.offsetDays);

    // Don't schedule steps in the past
    if (sendAt < new Date()) continue;

    const segment = step.segment ?? campaign.segments[0];
    const delayMs = sendAt.getTime() - Date.now();

    const job = await seasonalEmailQueue.add('send-seasonal-email', {
      campaignId: campaign.id,
      step:       step.template,
      subject:    step.subject,
      segment,
      includeIncentive: step.incentive,
      discountType:     step.incentive ? campaign.discountType : undefined,
      discountValue:    step.incentive ? campaign.discountValue : undefined,
    }, {
      delay: delayMs,
      jobId: `seasonal-${campaign.id}-${step.template}`,
      removeOnComplete: false,  // keep for audit
    });

    await db.campaignJobs.create({
      campaignId: campaign.id,
      jobId:      job.id,
      template:   step.template,
      scheduledAt: sendAt,
      status:     'scheduled',
    });
  }
}
```

### 3. Automated promotional pricing

Activate and deactivate sale pricing in sync with campaign emails:

```typescript
async function activateSeasonalPricing(campaign: SeasonalCampaign) {
  const products = await db.products.findAll({ where: { participatesInSales: true } });

  for (const product of products) {
    // Store original price before override
    await db.priceOverrides.create({
      productId:    product.id,
      campaignId:   campaign.id,
      originalPrice: product.price,
      salePrice:    applyDiscount(product.price, campaign.discountType, campaign.discountValue),
      activeFrom:   campaign.startDate,
      activeTo:     campaign.endDate,
    });
  }

  // Update live prices
  await db.products.bulkUpdate(
    { participatesInSales: true },
    { salePrice: (p) => applyDiscount(p.price, campaign.discountType, campaign.discountValue) }
  );

  // Schedule price rollback at campaign end
  await pricingQueue.add('rollback-seasonal-pricing', { campaignId: campaign.id }, {
    delay: campaign.endDate.getTime() - Date.now(),
    jobId: `pricing-rollback-${campaign.id}`,
  });
}

function applyDiscount(price: number, type: SeasonalCampaign['discountType'], value: number): number {
  switch (type) {
    case 'percent_off':   return parseFloat((price * (1 - value / 100)).toFixed(2));
    case 'fixed_amount':  return Math.max(0, parseFloat((price - value).toFixed(2)));
    case 'free_shipping': return price;  // free shipping is handled at order level
    default:              return price;
  }
}
```

### 4. Countdown email component

```typescript
// Server-side countdown timer image (via a service like sendtric or custom endpoint)
function getCountdownImageUrl(endDate: Date): string {
  const endTimestamp = endDate.getTime();
  return `${process.env.STORE_URL}/api/countdown-timer?ends=${endTimestamp}&timezone=America/New_York`;
}

// GET /api/countdown-timer — generate dynamic countdown image
export async function serveCountdownTimer(req: Request, res: Response) {
  const { ends, timezone } = req.query;
  const endDate = new Date(parseInt(ends as string));
  const now     = new Date();
  const diff    = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return res.redirect(`${process.env.STORE_URL}/images/sale-ended.png`);
  }

  const hours   = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  // Generate image via canvas or sharp
  const image = await generateCountdownImage({ hours, minutes, seconds });

  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'no-cache, no-store');
  return res.send(image);
}
```

### 5. Seasonal campaign performance measurement

```typescript
async function measureSeasonalLift(campaignId: string) {
  const campaign = await db.seasonalCampaigns.findById(campaignId);

  // Compare to same period prior year (year-over-year)
  const [currentRevenue, priorYearRevenue, emailMetrics] = await Promise.all([
    db.orders.sumRevenue({ createdAt: { gte: campaign.startDate, lte: campaign.endDate } }),
    db.orders.sumRevenue({
      createdAt: {
        gte: subYears(campaign.startDate, 1),
        lte: subYears(campaign.endDate, 1),
      },
    }),
    db.emailEvents.getMetrics({ campaignId }),
  ]);

  return {
    revenue:         currentRevenue,
    yoyGrowth:       ((currentRevenue - priorYearRevenue) / priorYearRevenue) * 100,
    emailOpenRate:   emailMetrics.openRate,
    emailClickRate:  emailMetrics.clickRate,
    revenuePerEmail: currentRevenue / emailMetrics.totalSent,
    avgOrderValue:   await db.orders.avgValue({ campaignSourceId: campaignId }),
  };
}
```

## Best Practices

- **Build campaign templates in September, not November** — last-minute BFCM campaigns have poor creative and poor deliverability; templates should be ready 8 weeks out
- **Warm up your email domain 4 weeks before peak** — increase send volume 10% per week starting 4 weeks before; ISPs flag sudden volume spikes as spam
- **Segment BFCM campaigns by customer value** — VIPs get early access + best offers; lapsed customers get "re-engagement" framing; prospects get maximum discount
- **Cap total email volume during BFCM** — sending 7+ emails in a 4-day period causes significant unsubscribe spikes; cap at 4 emails per customer across the entire event
- **Use a single discount code per campaign** — sitewide codes are easier to manage and track than per-customer codes for large sale events
- **Automate price rollback** — schedule the pricing reversal before launch; manual rollbacks get forgotten and erode post-sale margins
- **Measure incrementality, not just revenue** — compare BFCM revenue against a pull-forward model to determine true incremental lift vs. demand cannibalized from December

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Countdown timer showing wrong timezone | Always render server-side with the customer's timezone in the request; never hardcode timezone |
| Discount code working after sale ends | Add `expiresAt` to every sale discount code; use a cron to deactivate codes at end date |
| Email sending domain reputation damaged post-BFCM | Monitor complaint rate daily during peak; pause sends if complaint rate exceeds 0.08% |
| Promotional pricing not rolling back | Use a database-level scheduled job (not just in-memory queue) for pricing rollback; survives server restarts |
| All lapsed customers receiving BFCM win-back + regular BFCM email | Build a contact frequency cap that prevents customers from receiving more than 2 emails per day |

## Related Skills

- @email-marketing-automation
- @product-launch-campaigns
- @pricing-promotions
- @sms-marketing
- @meta-ads-integration
