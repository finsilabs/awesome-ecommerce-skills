---
name: customer-retention-engine
description: "Build automated retention campaigns targeting at-risk customers with behavioral triggers, personalized offers, and churn prevention workflows"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [retention, churn-prevention, lifecycle]
triggers: ["reduce churn", "build retention campaigns"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Customer Retention Engine

## Overview

Acquiring a new customer costs 5–7x more than retaining an existing one. A retention engine continuously identifies customers who show declining engagement signals — reduced purchase frequency, decreasing order values, browsing without buying — and intervenes with personalized campaigns before they lapse. This skill covers churn scoring, at-risk segmentation, automated intervention workflows, and measuring retention lift.

## When to Use This Skill

- When repeat purchase rate is declining month-over-month
- When LTV is below industry benchmarks for your vertical
- When a significant percentage of customers only ever purchase once
- When you want to proactively contact customers before they go fully dormant
- When building a post-purchase nurture program beyond the first 30 days
- When needing to identify which customers are worth offering a discount vs. which will repurchase anyway

## Core Instructions

### 1. Calculate churn probability scores

Define churn as "no purchase in N days" based on your store's typical repurchase cycle. Score each customer daily:

```typescript
interface RetentionScore {
  customerId:       string;
  churnRisk:        'low' | 'medium' | 'high' | 'churned';
  daysSincePurchase: number;
  purchaseFrequency: number;  // average days between orders
  expectedNextOrder: Date;
  daysOverdue:       number;  // days past expected next order
}

async function calculateRetentionScores(): Promise<RetentionScore[]> {
  const customers = await db.customers.findAll({
    where: { totalOrders: { gte: 1 } },
    include: ['orders'],
  });

  return customers.map(customer => {
    const orders = customer.orders.sort((a, b) => b.createdAt - a.createdAt);
    const lastOrder = orders[0];
    const daysSince = daysBetween(lastOrder.createdAt, new Date());

    // Calculate average purchase frequency
    const frequency = orders.length >= 2
      ? orders.slice(0, -1).reduce((sum, o, i) => sum + daysBetween(orders[i + 1].createdAt, o.createdAt), 0) / (orders.length - 1)
      : 60; // default for single-purchase customers

    const expectedNextOrder = addDays(lastOrder.createdAt, frequency);
    const daysOverdue = Math.max(0, daysBetween(expectedNextOrder, new Date()));

    const churnRisk: RetentionScore['churnRisk'] =
      daysOverdue > frequency * 2   ? 'churned'  :
      daysOverdue > frequency * 1   ? 'high'     :
      daysOverdue > frequency * 0.5 ? 'medium'   : 'low';

    return { customerId: customer.id, churnRisk, daysSincePurchase: daysSince, purchaseFrequency: frequency, expectedNextOrder, daysOverdue };
  });
}
```

### 2. Segment at-risk customers

```typescript
async function getAtRiskSegments() {
  const scores = await calculateRetentionScores();

  return {
    // High value, high risk — worth the most to save
    highValueAtRisk: scores.filter(s =>
      s.churnRisk === 'high' &&
      (await getCustomerLTV(s.customerId)) > 200
    ),

    // Medium risk — early intervention before they become high risk
    earlyWarning: scores.filter(s => s.churnRisk === 'medium'),

    // Recently churned — 30-day window for win-back
    recentlyChurned: scores.filter(s =>
      s.churnRisk === 'churned' &&
      s.daysSincePurchase < 90
    ),

    // Single-purchase customers nearing their expected repurchase window
    oneTimeBuyers: scores.filter(s =>
      s.churnRisk === 'medium' &&
      (await getCustomerOrderCount(s.customerId)) === 1
    ),
  };
}
```

### 3. Automated intervention workflows

```typescript
// Run daily at 9am local timezone
async function runRetentionWorkflows() {
  const segments = await getAtRiskSegments();

  // Workflow 1: Early warning — personalized product recommendation
  for (const customer of segments.earlyWarning) {
    const alreadyInFlow = await db.retentionJobs.findOne({ customerId: customer.customerId, status: 'active' });
    if (alreadyInFlow) continue;

    const topProducts = await getRecommendedProducts(customer.customerId, 3);
    await sendRetentionEmail(customer.customerId, 'early-warning', { products: topProducts });
    await db.retentionJobs.create({ customerId: customer.customerId, type: 'early-warning', status: 'active' });
  }

  // Workflow 2: High-value at-risk — personal touch + exclusive offer
  for (const customer of segments.highValueAtRisk) {
    const alreadyContacted = await db.retentionJobs.findOne({
      customerId: customer.customerId,
      type: 'high-value-intervention',
      createdAt: { gte: subDays(new Date(), 14) },
    });
    if (alreadyContacted) continue;

    const discountCode = await createUniqueDiscount({ type: 'percent_off', value: 15, customerId: customer.customerId });
    await sendRetentionEmail(customer.customerId, 'high-value-offer', { discountCode, expiresInDays: 7 });
    await createRetentionTask(customer.customerId, 'follow-up-call'); // optional: queue for CS team
  }

  // Workflow 3: One-time buyer reminder at expected repurchase window
  for (const customer of segments.oneTimeBuyers) {
    const previousPurchase = await getLastOrder(customer.customerId);
    const complementaryProducts = await getComplementaryProducts(previousPurchase.lineItems, 3);

    await sendRetentionEmail(customer.customerId, 'repurchase-reminder', {
      previousOrder: previousPurchase,
      products: complementaryProducts,
    });
  }
}
```

### 4. Behavioral trigger-based retention

Beyond scheduled workflows, fire retention interventions based on real-time signals:

```typescript
// Trigger when a previously active customer hasn't visited in 21 days
async function onCustomerInactive(customerId: string, daysSinceVisit: number) {
  if (daysSinceVisit !== 21) return;  // fire only once at 21-day mark

  const customer = await db.customers.findById(customerId);
  const recentlyViewed = await db.productViews.findByCustomer(customerId, { limit: 5, after: subDays(new Date(), 90) });

  if (recentlyViewed.length > 0) {
    // They showed interest but haven't returned — nudge with those products
    await sendRetentionEmail(customerId, 'browse-reactivation', { products: recentlyViewed });
  } else {
    // Cold customer — send a "what's new" email
    await sendRetentionEmail(customerId, 'whats-new', { newArrivals: await getNewArrivals(6) });
  }
}

// Trigger when order value drops significantly
async function onOrderValueDrop(customerId: string, latestOrderValue: number) {
  const avgOrderValue = await getAverageOrderValue(customerId, { lookbackOrders: 5 });
  if (latestOrderValue < avgOrderValue * 0.5) {
    // Customer is buying less — check in
    await sendRetentionEmail(customerId, 'value-recovery', {
      message: 'We noticed your recent order was smaller than usual — here are some of your favorites',
      products: await getTopPurchasedProducts(customerId, 3),
    });
  }
}
```

### 5. Retention campaign measurement

```typescript
async function measureRetentionLift(campaignType: string, lookbackDays: number = 30) {
  const campaignCustomers = await db.retentionJobs.findAll({
    where: {
      type: campaignType,
      createdAt: { gte: subDays(new Date(), lookbackDays) },
    },
    select: ['customerId'],
  });

  const controlGroup = await db.customers.findAtRisk({
    notIn: campaignCustomers.map(c => c.customerId),
    limit: campaignCustomers.length,
  });

  const campaignRepurchaseRate = await db.orders.countRepurchases(
    campaignCustomers.map(c => c.customerId),
    { after: subDays(new Date(), lookbackDays) }
  ) / campaignCustomers.length;

  const controlRepurchaseRate = await db.orders.countRepurchases(
    controlGroup.map(c => c.id),
    { after: subDays(new Date(), lookbackDays) }
  ) / controlGroup.length;

  return {
    campaignRepurchaseRate,
    controlRepurchaseRate,
    lift: ((campaignRepurchaseRate - controlRepurchaseRate) / controlRepurchaseRate) * 100,
    revenueRecovered: await calculateRetentionRevenue(campaignCustomers.map(c => c.customerId), lookbackDays),
  };
}
```

## Best Practices

- **Never discount VIP customers reflexively** — high-LTV customers who are slightly overdue may just be busy; a soft nudge without discount often works and protects margin
- **Personalize based on actual purchase history** — "you might also like" performs better than generic "come back" messaging when it references real products the customer bought
- **Set a contact frequency cap** — at-risk customers should not receive more than one retention touchpoint per week across all channels
- **Use control groups** — always withhold 10% of at-risk customers from campaigns to measure true incremental lift
- **Align intervention timing with repurchase cycle** — a high-frequency buyer (every 2 weeks) needs intervention much sooner than an annual gift buyer
- **Track campaign unsubscribes separately** — if a retention email drives a surge in unsubscribes, the messaging or timing is wrong; adjust before scaling
- **Close the loop with CS** — for high-value at-risk customers, route to a customer success rep for a personal outreach rather than an automated email

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Sending retention emails to customers who just bought | Always check last purchase date before enqueueing; cancel pending jobs on `order.paid` |
| Discount codes eroding margin on customers who would have repurchased anyway | Use propensity scoring — only offer discounts when churn probability exceeds 70% |
| Churn scoring includes customers in the middle of a subscription cycle | Exclude subscription customers from churn detection; handle them via subscription-specific retention logic |
| Single-purchase customers receiving win-back messaging too early | Set a minimum 45-day window before treating a one-time buyer as at-risk |
| Retention scores never updating | Run the scoring job nightly; use database indexes on `last_order_date` and `customer_id` to keep it fast |

## Related Skills

- @lifecycle-marketing-automation
- @win-back-reactivation
- @loyalty-program-optimization
- @email-marketing-automation
- @customer-lifetime-value
