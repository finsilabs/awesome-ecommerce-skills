---
name: referral-viral-loops
description: "Build referral mechanics with dual-sided rewards, unique tracking links, viral coefficient optimization, and anti-fraud controls for referral abuse"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [referral, viral, word-of-mouth]
triggers: ["build referral program", "create viral loop"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Referral Viral Loops

## Overview

Word-of-mouth referral programs are the lowest-cost customer acquisition channel when done well — referred customers have 37% higher retention rates and 25% higher LTV than non-referred customers. A viral loop requires a K-factor above 1.0 (each customer refers more than one new customer on average) to achieve exponential growth, though even a K-factor of 0.3–0.5 produces meaningful acquisition lift. This skill covers designing dual-sided rewards, generating unique referral links, tracking conversions, calculating K-factor, and preventing fraud.

## When to Use This Skill

- When CAC is high and word-of-mouth is underutilized
- When existing customers frequently refer friends informally but there is no structured program to track and reward it
- When building a referral mechanic from scratch (unique links, reward fulfillment, fraud controls)
- When needing to calculate K-factor and model the program's viral coefficient
- When scaling a referral program that has been running on a manual/honor system

## Core Instructions

### 1. Referral program data model

```typescript
interface ReferralProgram {
  id:                string;
  name:              string;
  referrerReward:    Reward;    // what the referrer receives when their referral converts
  refereeReward:     Reward;    // what the new customer receives for using a referral link
  minimumOrderValue: number;    // referee must spend at least this amount for referrer to earn reward
  cookieWindowDays:  number;    // how long referral attribution cookie persists
  maxReferralsPerCustomer: number;  // anti-fraud cap
}

interface Reward {
  type:       'percent_off' | 'fixed_amount' | 'store_credit' | 'free_product';
  value:      number;
  expiryDays: number;
}

interface ReferralLink {
  id:         string;
  customerId: string;
  code:       string;   // e.g., "SARAH123" — short, shareable
  shortUrl:   string;   // e.g., "https://go.store.com/r/SARAH123"
  clicks:     number;
  conversions: number;
  revenue:     number;
  createdAt:  Date;
}
```

### 2. Referral link generation

```typescript
async function generateReferralLink(customerId: string, programId: string): Promise<ReferralLink> {
  const existing = await db.referralLinks.findOne({ where: { customerId, programId } });
  if (existing) return existing;

  const customer = await db.customers.findById(customerId);

  // Generate a memorable code: FirstName + 3-digit number
  const baseCode = (customer.firstName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 8));
  let code = `${baseCode}${Math.floor(100 + Math.random() * 900)}`;

  // Ensure uniqueness
  while (await db.referralLinks.findOne({ where: { code } })) {
    code = `${baseCode}${Math.floor(100 + Math.random() * 900)}`;
  }

  const longUrl  = `${process.env.STORE_URL}?ref=${code}&utm_source=referral&utm_medium=share&utm_campaign=${programId}`;
  const shortUrl = await createShortLink(longUrl, `r/${code}`);

  return db.referralLinks.create({
    customerId,
    programId,
    code,
    shortUrl,
    clicks:      0,
    conversions: 0,
    revenue:     0,
  });
}
```

### 3. Attribution tracking — cookie + database

```typescript
// Middleware: capture referral code from URL and store in cookie
export function referralAttributionMiddleware(req: Request, res: Response, next: NextFunction) {
  const refCode = req.query.ref as string;
  if (refCode) {
    // Store referral attribution in a 30-day cookie
    res.cookie('referral_code', refCode, {
      maxAge:   30 * 86400 * 1000,
      httpOnly: true,
      sameSite: 'lax',
    });

    // Track click
    db.referralLinks.incrementClicks(refCode).catch(console.error);
  }
  next();
}

// On order completion — attribute referral
async function attributeReferral(order: Order, req: Request) {
  const refCode = req.cookies['referral_code'];
  if (!refCode) return;

  const referralLink = await db.referralLinks.findByCode(refCode);
  if (!referralLink) return;

  // Prevent self-referral
  if (referralLink.customerId === order.customerId) return;

  const program = await db.referralPrograms.findById(referralLink.programId);

  // Check minimum order value
  if (order.subtotal < program.minimumOrderValue) return;

  // Check if this email already converted via this referral program (one referral per email)
  const existingConversion = await db.referralConversions.findOne({
    where: { refereeEmail: order.customerEmail, programId: referralLink.programId },
  });
  if (existingConversion) return;

  // Record conversion
  const conversion = await db.referralConversions.create({
    referralLinkId:  referralLink.id,
    referrerId:      referralLink.customerId,
    refereeEmail:    order.customerEmail,
    refereeId:       order.customerId,
    orderId:         order.id,
    orderValue:      order.subtotal,
    programId:       referralLink.programId,
    status:          'pending',   // pending until refund window passes
  });

  // Grant referee reward immediately
  await grantReward(order.customerId, program.refereeReward, conversion.id, 'referee');

  // Update link stats
  await db.referralLinks.update(referralLink.id, {
    conversions: { increment: 1 },
    revenue:     { increment: order.subtotal },
  });

  // Schedule referrer reward after refund window (7 days)
  await referralQueue.add('grant-referrer-reward', {
    conversionId: conversion.id,
    referrerId:   referralLink.customerId,
    reward:       program.referrerReward,
  }, {
    delay:  7 * 86400000,
    jobId:  `referrer-reward-${conversion.id}`,
  });
}
```

### 4. Reward fulfillment

```typescript
async function grantReward(customerId: string, reward: Reward, conversionId: string, role: 'referrer' | 'referee') {
  let discountCode: string | null = null;
  let storeCredit: number | null  = null;

  switch (reward.type) {
    case 'percent_off':
    case 'fixed_amount':
      discountCode = await createUniqueDiscount({
        type:      reward.type,
        value:     reward.value,
        customerId,
        expiresAt: addDays(new Date(), reward.expiryDays),
        singleUse: true,
      });
      break;

    case 'store_credit':
      await db.customers.update(customerId, {
        storeCredit: { increment: reward.value },
      });
      storeCredit = reward.value;
      break;
  }

  await db.referralRewards.create({ customerId, conversionId, role, discountCode, storeCredit, grantedAt: new Date() });

  // Send reward notification email
  await sendEmail(customerId, role === 'referrer' ? 'referral-reward-earned' : 'referral-welcome-discount', {
    discountCode,
    storeCredit,
    rewardValue:   reward.value,
    expiresInDays: reward.expiryDays,
  });
}
```

### 5. Fraud prevention

```typescript
async function checkReferralFraud(conversion: ReferralConversion): Promise<boolean> {
  const flags: string[] = [];

  // Same IP address as referrer
  const referrer   = await db.customers.findById(conversion.referrerId);
  const referee    = await db.customers.findById(conversion.refereeId);
  if (referrer.lastLoginIp === referee.lastLoginIp) flags.push('same-ip');

  // Referee account created same day as referral (suspicious timing)
  const accountAgeDays = daysBetween(referee.createdAt, conversion.createdAt);
  if (accountAgeDays < 1) flags.push('instant-account');

  // Referrer has abnormal conversion rate (>20% of clicks)
  const link = await db.referralLinks.findById(conversion.referralLinkId);
  if (link.clicks > 10 && link.conversions / link.clicks > 0.20) flags.push('suspicious-conversion-rate');

  // Check for shared device fingerprint
  const sharedDevice = await db.deviceFingerprints.checkShared(referrer.id, referee.id);
  if (sharedDevice) flags.push('shared-device');

  // Max referrals per customer per month
  const program         = await db.referralPrograms.findById(conversion.programId);
  const monthlyConversions = await db.referralConversions.countByReferrer(conversion.referrerId, { since: subDays(new Date(), 30) });
  if (monthlyConversions >= program.maxReferralsPerCustomer) flags.push('rate-limit-exceeded');

  if (flags.length > 0) {
    await db.referralConversions.update(conversion.id, { fraudFlags: flags, status: 'under-review' });
    await notifyFraudTeam(conversion.id, flags);
    return true;  // is fraud
  }

  return false;
}
```

### 6. K-factor and viral coefficient calculation

```typescript
async function calculateViralCoefficient(programId: string, lookbackDays: number = 90) {
  const [totalReferrers, totalConversions, totalCustomers] = await Promise.all([
    db.referralLinks.countDistinctReferrers({ programId, since: subDays(new Date(), lookbackDays) }),
    db.referralConversions.count({ where: { programId, status: { in: ['approved', 'pending'] }, createdAt: { gte: subDays(new Date(), lookbackDays) } } }),
    db.customers.count({ where: { createdAt: { gte: subDays(new Date(), lookbackDays) } } }),
  ]);

  const shareRate       = totalReferrers / totalCustomers;   // % of customers who share
  const conversionRate  = totalConversions / Math.max(1, totalReferrers);   // conversions per sharer
  const kFactor         = shareRate * conversionRate;

  return {
    shareRate,
    conversionRate,
    kFactor,
    interpretation: kFactor >= 1.0 ? 'viral (exponential growth)' : kFactor >= 0.5 ? 'strong' : kFactor >= 0.2 ? 'moderate' : 'weak',
    totalReferrers,
    totalConversions,
  };
}
```

## Best Practices

- **Dual-sided rewards outperform one-sided** — giving both referrer and referee a reward increases share rates by 2–3x vs. rewarding only the referrer
- **Delay referrer reward by 7–14 days** — wait until the refund window passes before granting the reward; otherwise fraudsters can get rewards on returned orders
- **Make the referral link shareable by default** — show the referral link prominently in the account dashboard, post-purchase confirmation page, and packaging inserts
- **Set a monthly cap on referral conversions per customer** — even legitimate customers should not earn unlimited rewards; cap at 5–10 per month to prevent exploitation
- **Use store credit over discount codes for referrer rewards** — store credit ties the referrer back to your brand and has a higher perceived value than a percentage discount
- **Track clicks-to-conversions per referral channel** — Instagram DM shares convert very differently from SMS shares; understanding this helps optimize the program

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Self-referral fraud (customer creates new account to get referee discount) | Check IP address + device fingerprint; flag same-device conversions for manual review |
| Referral cookie being blocked | Implement server-side referral attribution via URL parameter stored in the database at first visit, not just cookie |
| Referrer reward given before order ships | Always delay referrer reward by 7+ days after confirmed delivery |
| Referral codes being shared publicly on coupon sites | Make referee codes unique per referrer so bulk sharing is detectable and the code can be deactivated |
| Low share rate despite great rewards | Reduce friction — add a pre-filled WhatsApp/SMS share button; most customers won't manually copy and paste |

## Related Skills

- @loyalty-program-optimization
- @affiliate-program
- @customer-retention-engine
- @email-marketing-automation
- @first-party-data-collection
