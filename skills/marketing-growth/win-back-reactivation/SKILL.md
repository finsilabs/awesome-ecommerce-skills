---
name: win-back-reactivation
description: "Re-engage lapsed customers with automated win-back campaigns using personalized comeback offers based on purchase history and inactivity windows"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [win-back, reactivation, retention]
triggers: ["win back inactive customers", "reactivation campaign"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Win-Back Reactivation

## Overview

Lapsed customers — those who have not purchased within 2x their typical repurchase cycle — represent a significant revenue recovery opportunity because they already know your brand. Win-back campaigns targeting these customers typically yield 5–15% reactivation rates, compared to 1–3% for cold prospecting. This skill covers identifying lapsed segments with RFM scoring, building escalating win-back sequences, personalizing offers based on previous purchase history, and knowing when to sunset unresponsive customers.

## When to Use This Skill

> **Note:** For proactive churn prevention before customers lapse, see @customer-retention-engine. This skill focuses on re-engaging customers who have already become inactive.

- When a large portion of your customer base has not purchased in 90–180 days
- When overall repeat purchase rate is declining year-over-year
- When you have never systematically targeted lapsed customers before
- When lifecycle marketing is in place but there is no specific win-back workflow
- When wanting to identify which lapsed customers are worth discounting vs. sunsetting

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, email/SMS automation platform (Klaviyo or similar), customer purchase history and inactivity data

## Core Instructions

### 1. Define lapsed customer segments

```typescript
interface LapsedSegment {
  name:        string;
  minDaysSince: number;  // days since last order
  maxDaysSince: number;
  offerStrength: 'soft' | 'medium' | 'strong';  // determines incentive level
  channel:     ('email' | 'sms' | 'paid-retargeting')[];
}

const LAPSED_SEGMENTS: LapsedSegment[] = [
  {
    name:         'early-lapsed',
    minDaysSince: 60,
    maxDaysSince: 120,
    offerStrength: 'soft',
    channel:      ['email'],
  },
  {
    name:         'mid-lapsed',
    minDaysSince: 121,
    maxDaysSince: 180,
    offerStrength: 'medium',
    channel:      ['email', 'sms'],
  },
  {
    name:         'deep-lapsed',
    minDaysSince: 181,
    maxDaysSince: 365,
    offerStrength: 'strong',
    channel:      ['email', 'sms', 'paid-retargeting'],
  },
];

async function getLapsedCustomers(segment: LapsedSegment): Promise<Customer[]> {
  const minDate = subDays(new Date(), segment.maxDaysSince);
  const maxDate = subDays(new Date(), segment.minDaysSince);

  return db.customers.findAll({
    where: {
      lastOrderAt: { gte: minDate, lte: maxDate },
      emailVerified: true,
      smsMarketingOptIn: segment.channel.includes('sms') ? true : undefined,
    },
    include: ['orders'],
    orderBy: { totalSpend: 'desc' },
  });
}
```

### 2. Personalized win-back offer selection

```typescript
async function selectWinBackOffer(customerId: string, offerStrength: LapsedSegment['offerStrength']) {
  const customer = await db.customers.findById(customerId);
  const orders   = await db.orders.findByCustomer(customerId, { orderBy: { createdAt: 'desc' }, limit: 5 });
  const ltv      = orders.reduce((sum, o) => sum + o.subtotal, 0);

  // High LTV customers get better offers
  const isHighValue = ltv >= 300;

  const offerMap = {
    soft:   isHighValue ? { type: 'free_shipping', value: 0 }        : null,
    medium: isHighValue ? { type: 'percent_off', value: 15 }         : { type: 'percent_off', value: 10 },
    strong: isHighValue ? { type: 'percent_off', value: 20 }         : { type: 'percent_off', value: 15 },
  };

  return offerMap[offerStrength];
}

// Get personalized product recommendations based on past purchases
async function getWinBackRecommendations(customerId: string): Promise<Product[]> {
  const recentPurchases = await db.orderLineItems.findByCustomer(customerId, { limit: 10 });
  const purchasedIds    = recentPurchases.map(i => i.productId);
  const categories      = recentPurchases.map(i => i.product.categoryId);

  // Find top-selling products in same categories not previously purchased
  return db.products.findAll({
    where: {
      categoryId:  { in: categories },
      id:          { notIn: purchasedIds },
      active:      true,
      stockQuantity: { gt: 0 },
    },
    orderBy: { unitsSold30d: 'desc' },
    limit: 3,
  });
}
```

### 3. Win-back email sequence

```typescript
async function triggerWinBackSequence(customerId: string, segment: LapsedSegment) {
  // Check for existing active win-back job
  const existing = await db.winBackJobs.findOne({
    where: {
      customerId,
      status:    'active',
      createdAt: { gte: subDays(new Date(), 30) },
    },
  });
  if (existing) return;

  const offer = await selectWinBackOffer(customerId, segment.offerStrength);
  const recommendations = await getWinBackRecommendations(customerId);

  let discountCode: string | null = null;
  if (offer) {
    discountCode = await createUniqueDiscount({
      ...offer,
      customerId,
      expiresAt: addDays(new Date(), 14),
      singleUse: true,
    });
  }

  const job = await db.winBackJobs.create({ customerId, segment: segment.name, status: 'active' });

  // Step 1: Reconnect — "We miss you" message, no hard sell
  await winBackQueue.add('send', {
    customerId, jobId: job.id, step: 0, segment: segment.name,
    template: 'winback-reconnect', recommendations,
    discountCode: null,  // No discount on first touch
  }, { delay: 0, jobId: `winback-${customerId}-step0` });

  // Step 2 (5 days later): Product highlights + offer
  await winBackQueue.add('send', {
    customerId, jobId: job.id, step: 1, segment: segment.name,
    template: 'winback-offer', recommendations, discountCode,
  }, { delay: 5 * 86400000, jobId: `winback-${customerId}-step1` });

  // Step 3 (12 days later): Last chance — offer expires soon
  if (discountCode) {
    await winBackQueue.add('send', {
      customerId, jobId: job.id, step: 2, segment: segment.name,
      template: 'winback-last-chance', discountCode,
      expiresInDays: 2,
    }, { delay: 12 * 86400000, jobId: `winback-${customerId}-step2` });
  }
}
```

### 4. Cancel win-back on purchase

```typescript
async function onOrderPaid(order: Order) {
  const customerId = order.customerId;

  // Cancel all pending win-back jobs
  for (let step = 0; step <= 3; step++) {
    const job = await winBackQueue.getJob(`winback-${customerId}-step${step}`);
    await job?.remove();
  }

  // Mark win-back job as converted
  await db.winBackJobs.updateWhere(
    { customerId, status: 'active' },
    { status: 'converted', convertedAt: new Date(), convertedOrderId: order.id }
  );
}
```

### 5. Email sunset — removing unresponsive contacts

```typescript
// After the full win-back sequence, sunset contacts who did not engage
async function runSunsetWorkflow() {
  const completedJobs = await db.winBackJobs.findAll({
    where: {
      status: 'active',
      createdAt: { lt: subDays(new Date(), 30) },
    },
  });

  for (const job of completedJobs) {
    const engaged = await db.emailEvents.findOne({
      where: {
        customerId: job.customerId,
        type:       { in: ['open', 'click'] },
        createdAt:  { gte: job.createdAt },
      },
    });

    if (!engaged) {
      // No opens or clicks in 30+ days — suppress from future campaigns
      await db.customers.update(job.customerId, {
        emailMarketingStatus: 'suppressed',
        suppressedAt: new Date(),
        suppressionReason: 'win-back-no-engagement',
      });

      // Send final "opt-in reconfirmation" before suppressing (best practice)
      await sendEmail(job.customerId, 'email-suppression-notice', {
        message: 'We will stop sending you emails unless you click to stay subscribed.',
        resubscribeUrl: `${process.env.STORE_URL}/email/resubscribe/${job.customerId}`,
      });
    }

    await db.winBackJobs.update(job.id, { status: 'completed' });
  }
}
```

### 6. Win-back campaign measurement

```typescript
async function getWinBackMetrics(segmentName: string, lookbackDays: number = 60) {
  const jobs = await db.winBackJobs.findAll({
    where: {
      segment:   segmentName,
      createdAt: { gte: subDays(new Date(), lookbackDays) },
    },
  });

  const converted    = jobs.filter(j => j.status === 'converted');
  const suppressed   = jobs.filter(j => j.status === 'completed');

  return {
    totalTargeted:     jobs.length,
    reactivationRate:  converted.length / jobs.length,
    suppressionRate:   suppressed.length / jobs.length,
    revenueRecovered:  await db.orders.sumRevenue(converted.map(j => j.convertedOrderId!)),
    avgDaysToConvert:  converted.reduce((sum, j) => sum + daysBetween(j.createdAt, j.convertedAt!), 0) / converted.length,
  };
}
```

## Best Practices

- **Lead with connection, not desperation** — the first message should feel warm ("We've missed you") rather than transactional ("Come back and buy"); aggressive discounts on message 1 train customers to wait
- **Personalize with previous purchase context** — referencing what the customer previously bought increases open rates by 25–35% vs. generic "we miss you" subject lines
- **Respect the email sunset** — continuing to email completely unresponsive contacts hurts domain reputation and deliverability; suppressing non-engagers is good hygiene
- **Vary offer levels by LTV** — a $10 discount that wins back a $500 LTV customer is excellent ROI; the same discount on a $40 LTV customer barely covers the cost of acquisition
- **Set re-entry criteria carefully** — after winning back a customer, move them back to "active" lifecycle stage and stop all win-back flows
- **Use SMS as a supplement for mid-lapsed, not a primary channel** — SMS has high engagement but also high unsubscribe rates if used aggressively for lapsed contacts

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Win-back email sent the day after purchase | Always cancel win-back jobs in `order.paid` handler; also check last purchase date in the worker before sending |
| Discount codes being passed around | Make all win-back codes single-use; lock to customer email or phone at creation |
| Win-back sequence triggering on customers who just unsubscribed | Check email marketing status in the worker before every send |
| Repeat win-back campaigns on the same customer every month | Set a 60-day cooldown after a completed win-back cycle regardless of outcome |
| Low reactivation rate on deep-lapsed (180+ days) | Consider a "we're sorry, is everything okay?" tone for deep-lapsed; include a preference center link |

## Related Skills

- @customer-retention-engine
- @lifecycle-marketing-automation
- @email-marketing-automation
- @email-list-segmentation
- @loyalty-program-optimization
