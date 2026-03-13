---
name: lifecycle-marketing-automation
description: "Map customer journey stages from first visit to loyal advocate with personalized messaging, triggered workflows, and segment-based campaign automation"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [lifecycle, customer-journey, automation]
triggers: ["set up lifecycle marketing", "customer journey automation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Lifecycle Marketing Automation

## Overview

Lifecycle marketing treats each customer as being at a defined stage in their relationship with your brand — from anonymous visitor to loyal advocate — and delivers stage-appropriate messaging automatically. Unlike broadcast email campaigns, lifecycle automation is triggered by behavior and transitions between stages, ensuring every message is relevant and timely. This skill covers defining lifecycle stages, building transition logic, assigning customers to stages in real time, and orchestrating multi-channel campaigns for each stage.

## When to Use This Skill

- When moving from batch-and-blast campaigns to behavior-triggered messaging
- When onboarding new customers and needing a structured first-30-day nurture plan
- When different customer segments are receiving identical generic emails
- When building a holistic view of the customer journey across email, SMS, and push
- When LTV and repeat purchase rate are flat despite healthy acquisition numbers

## Core Instructions

### 1. Define lifecycle stages

```typescript
type LifecycleStage =
  | 'anonymous'       // No email captured
  | 'subscriber'      // Email captured, no purchase
  | 'first-time-buyer'  // 1 order, placed < 60 days ago
  | 'active'          // 2+ orders, purchased within repurchase window
  | 'loyal'           // 4+ orders OR > $500 LTV
  | 'at-risk'         // Active but approaching end of repurchase window
  | 'lapsed'          // No purchase beyond 2x repurchase window
  | 'advocate';       // Has left reviews, referred friends, or engaged heavily with UGC

interface CustomerLifecycle {
  customerId:    string;
  stage:         LifecycleStage;
  enteredStageAt: Date;
  previousStage?: LifecycleStage;
  metadata:      Record<string, unknown>;
}
```

### 2. Calculate and assign lifecycle stages

Run a nightly job to re-evaluate every active customer's stage:

```typescript
async function assignLifecycleStage(customerId: string): Promise<LifecycleStage> {
  const customer  = await db.customers.findById(customerId);
  const orders    = await db.orders.findByCustomer(customerId, { status: 'completed' });
  const ltv       = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const lastOrder = orders[0];
  const daysSince = lastOrder ? daysBetween(lastOrder.createdAt, new Date()) : Infinity;
  const avgFreq   = calculatePurchaseFrequency(orders);
  const isAtRisk  = lastOrder && daysSince > avgFreq && daysSince < avgFreq * 2;
  const isLapsed  = !lastOrder || daysSince > avgFreq * 2;

  if (!customer.emailVerified)                          return 'anonymous';
  if (orders.length === 0)                              return 'subscriber';
  if (orders.length >= 1 && daysSince <= 60 && orders.length < 2) return 'first-time-buyer';
  if (ltv >= 500 || orders.length >= 4)                 return 'loyal';
  if (await isAdvocate(customerId))                     return 'advocate';
  if (isAtRisk)                                         return 'at-risk';
  if (isLapsed)                                         return 'lapsed';
  return 'active';
}

async function updateLifecycleStages() {
  const customers = await db.customers.findAll({ where: { emailVerified: true } });

  for (const customer of customers) {
    const newStage = await assignLifecycleStage(customer.id);
    const current  = await db.customerLifecycle.findByCustomer(customer.id);

    if (!current || current.stage !== newStage) {
      await db.customerLifecycle.upsert(
        { customerId: customer.id },
        { stage: newStage, enteredStageAt: new Date(), previousStage: current?.stage }
      );
      await triggerStageTransitionWorkflow(customer.id, current?.stage, newStage);
    }
  }
}
```

### 3. Stage transition workflows

```typescript
async function triggerStageTransitionWorkflow(
  customerId: string,
  from: LifecycleStage | undefined,
  to: LifecycleStage
) {
  switch (to) {
    case 'subscriber':
      // Welcome series: 3 emails over 7 days
      await triggerWelcomeSeries(customerId);
      break;

    case 'first-time-buyer':
      // Cancel any active welcome series (customer converted)
      await cancelFlow(customerId, 'welcome-series');
      // Start first-purchase onboarding: setup tips, product usage, review request
      await scheduleFirstPurchaseOnboarding(customerId);
      break;

    case 'active':
      if (from === 'first-time-buyer') {
        // Second purchase milestone — reward with loyalty points or exclusive access
        await sendMilestoneEmail(customerId, 'second-purchase');
      }
      break;

    case 'loyal':
      // Loyal milestone: thank + VIP benefits reveal
      await sendMilestoneEmail(customerId, 'loyal-status');
      await addToVipAudience(customerId);
      break;

    case 'at-risk':
      // Soft retention nudge — no discount yet
      await sendRetentionEmail(customerId, 'at-risk-nudge');
      break;

    case 'lapsed':
      if (from === 'at-risk') {
        // Escalate with an offer
        await sendWinBackCampaign(customerId);
      }
      break;

    case 'advocate':
      // Reward advocacy with exclusive perks or referral bonus
      await sendAdvocateReward(customerId);
      break;
  }
}
```

### 4. Stage-based campaign content

Define messaging strategy per stage:

```typescript
const STAGE_CAMPAIGN_CONFIG: Record<LifecycleStage, {
  primaryChannel: 'email' | 'sms' | 'push';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'triggered-only';
  contentFocus: string;
  incentiveLevel: 'none' | 'low' | 'medium' | 'high';
}> = {
  anonymous:         { primaryChannel: 'push',  frequency: 'triggered-only', contentFocus: 'acquisition',           incentiveLevel: 'medium' },
  subscriber:        { primaryChannel: 'email', frequency: 'weekly',         contentFocus: 'brand education',       incentiveLevel: 'low'    },
  'first-time-buyer':{ primaryChannel: 'email', frequency: 'triggered-only', contentFocus: 'product onboarding',    incentiveLevel: 'none'   },
  active:            { primaryChannel: 'email', frequency: 'biweekly',       contentFocus: 'new arrivals + cross-sell', incentiveLevel: 'none' },
  loyal:             { primaryChannel: 'email', frequency: 'weekly',         contentFocus: 'exclusive access + VIP', incentiveLevel: 'low'   },
  'at-risk':         { primaryChannel: 'email', frequency: 'triggered-only', contentFocus: 're-engagement',         incentiveLevel: 'low'   },
  lapsed:            { primaryChannel: 'email', frequency: 'triggered-only', contentFocus: 'win-back',              incentiveLevel: 'high'  },
  advocate:          { primaryChannel: 'email', frequency: 'biweekly',       contentFocus: 'exclusives + referral',  incentiveLevel: 'none'  },
};
```

### 5. Real-time stage updates via event hooks

Update stages immediately on key events without waiting for the nightly job:

```typescript
// Webhook handler for order.paid
async function onOrderPaid(order: Order) {
  const customerId = order.customerId;

  // Re-evaluate lifecycle stage immediately
  const newStage = await assignLifecycleStage(customerId);
  const current  = await db.customerLifecycle.findByCustomer(customerId);

  if (current?.stage !== newStage) {
    await db.customerLifecycle.upsert({ customerId }, { stage: newStage, enteredStageAt: new Date(), previousStage: current?.stage });
    await triggerStageTransitionWorkflow(customerId, current?.stage, newStage);
  }

  // Always cancel competing flows on purchase
  await cancelAllRetentionFlows(customerId);
}

// Track review submission for advocate detection
async function onReviewSubmitted(customerId: string) {
  const reviewCount = await db.productReviews.countByCustomer(customerId);
  if (reviewCount >= 2) {
    await updateLifecycleStage(customerId, 'advocate');
  }
}
```

### 6. Lifecycle analytics dashboard

```typescript
async function getLifecycleDashboard() {
  const stages = await db.customerLifecycle.groupBy('stage', { count: true });
  const transitions = await db.customerLifecycleHistory.getTransitions({ since: subDays(new Date(), 30) });

  return {
    stageDistribution: stages,  // how many customers in each stage
    stageMoveRate: {
      subscriberToFirstBuyer: transitions.filter(t => t.from === 'subscriber' && t.to === 'first-time-buyer').length,
      activeToAtRisk:         transitions.filter(t => t.from === 'active' && t.to === 'at-risk').length,
      atRiskSaved:            transitions.filter(t => t.from === 'at-risk' && (t.to === 'active' || t.to === 'loyal')).length,
      lapsedToActive:         transitions.filter(t => t.from === 'lapsed' && t.to !== 'lapsed').length,
    },
    avgTimeInStage: await db.customerLifecycle.avgTimeInStage(),
    stageLTV:       await db.orders.avgLTVByLifecycleStage(),
  };
}
```

## Best Practices

- **Keep stage definitions simple and business-meaningful** — avoid over-engineering with 10+ micro-stages; 6-8 stages is usually optimal
- **Always cancel competing flows on conversion** — a customer who just bought should exit all at-risk and lapsed flows immediately
- **Use real-time events for critical transitions** — don't wait for the nightly batch job to move a customer from lapsed to active after a purchase
- **Test stage assignment logic with edge cases** — customers with one order per year, B2B bulk buyers, and gift purchasers all behave differently
- **Share lifecycle stage with your CRM** — sync stage to Klaviyo, HubSpot, or your ESP so marketers can build campaigns without code
- **Build holdout groups per stage** — measure whether lifecycle messaging is actually causing stage progressions or just correlating with them
- **Document the transition matrix** — create a diagram showing which events cause which stage transitions; it prevents inconsistencies as the system grows

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customers receive messages from the wrong stage | Add stage check before every send; re-validate stage at send time, not just at enqueue time |
| Nightly job times out on large customer tables | Index `last_order_date` and `total_orders`; process in batches of 1000 with cursor pagination |
| Stage thrashing (customer flips between stages daily) | Add hysteresis — require stage to be stable for 2 consecutive evaluations before triggering a workflow |
| Loyal customers receiving lapsed messaging | Lifecycle stage must be checked in the campaign send worker, not just at scheduling time |
| All customers stuck in "subscriber" stage | Check that `order.paid` webhook is triggering stage re-evaluation; verify purchase events are being recorded |

## Related Skills

- @customer-retention-engine
- @email-marketing-automation
- @win-back-reactivation
- @loyalty-program-optimization
- @customer-segmentation
